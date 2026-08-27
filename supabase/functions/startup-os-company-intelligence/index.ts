import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.112.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const bytesToBase64 = (bytes: Uint8Array) => { let out = ""; for (const byte of bytes) out += String.fromCharCode(byte); return btoa(out); };
const base64ToBytes = (value: string) => Uint8Array.from(atob(value), (char) => char.charCodeAt(0));

async function cryptoKey(serviceRole: string, organizationId: string, provider: string) {
  const material = new TextEncoder().encode(`${serviceRole}|startup-os-provider-v1|${organizationId}|${provider}`);
  const digest = await crypto.subtle.digest("SHA-256", material);
  return crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, ["decrypt"]);
}
async function decryptCredential(ciphertext: string, iv: string, serviceRole: string, organizationId: string, provider: string) {
  const key = await cryptoKey(serviceRole, organizationId, provider);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: base64ToBytes(iv) }, key, base64ToBytes(ciphertext));
  return new TextDecoder().decode(plain);
}

function privateIp(host: string) {
  const h = host.toLowerCase().replace(/^\[|\]$/g, "");
  return h === "localhost" || h === "::1" || h === "0.0.0.0" || h.startsWith("127.") || h.startsWith("10.") || h.startsWith("192.168.") || h.startsWith("169.254.") || /^172\.(1[6-9]|2\d|3[01])\./.test(h) || h.startsWith("fc") || h.startsWith("fd") || h.startsWith("fe80:");
}
async function assertPublicUrl(raw: string) {
  let url: URL;
  try { url = new URL(raw); } catch { throw new Error("INVALID_URL"); }
  if (!['http:','https:'].includes(url.protocol)) throw new Error("INVALID_URL");
  if (privateIp(url.hostname)) throw new Error("PRIVATE_TARGET");
  try {
    const addresses = await Deno.resolveDns(url.hostname, "A");
    if (addresses.some(privateIp)) throw new Error("PRIVATE_TARGET");
  } catch (error) {
    if (String(error).includes("PRIVATE_TARGET")) throw error;
  }
  return url;
}

function textMatch(html: string, pattern: RegExp) { return pattern.test(html); }
function firstMatch(html: string, pattern: RegExp) { return html.match(pattern)?.[1]?.trim() || ""; }
function scoreWebsite(html: string, url: URL, responseMs: number, bytes: number) {
  const title = firstMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const description = firstMatch(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) || firstMatch(html, /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
  const checks = {
    https: url.protocol === "https:",
    title: title.length >= 10,
    description: description.length >= 50,
    h1: textMatch(html, /<h1\b/i),
    canonical: textMatch(html, /<link[^>]+rel=["']canonical["']/i),
    schema: textMatch(html, /application\/ld\+json/i),
    viewport: textMatch(html, /<meta[^>]+name=["']viewport["']/i),
    contactCue: /mailto:|tel:|contact|whatsapp/i.test(html),
    socialCue: /facebook\.com|instagram\.com|linkedin\.com|tiktok\.com/i.test(html),
  };
  const weights: Record<keyof typeof checks, number> = { https: 15, title: 12, description: 12, h1: 10, canonical: 10, schema: 12, viewport: 12, contactCue: 9, socialCue: 8 };
  const seoScore = Math.min(100, Math.round((Object.keys(checks) as Array<keyof typeof checks>).reduce((sum, key) => sum + (checks[key] ? weights[key] : 0), 0)));
  const responseComponent = responseMs <= 400 ? 60 : responseMs <= 800 ? 50 : responseMs <= 1500 ? 35 : responseMs <= 3000 ? 20 : 8;
  const sizeComponent = bytes <= 250_000 ? 40 : bytes <= 750_000 ? 32 : bytes <= 1_500_000 ? 22 : bytes <= 3_000_000 ? 12 : 5;
  const performanceScore = Math.min(100, responseComponent + sizeComponent);
  return { seoScore, performanceScore, title, description, checks, responseMs, bytes };
}
function reputationScore(rating: number | null, reviewCount: number | null) {
  if (!rating && !reviewCount) return null;
  const ratingPart = Math.max(0, Math.min(100, ((rating || 0) / 5) * 75));
  const reviewPart = Math.max(0, Math.min(25, Math.log10((reviewCount || 0) + 1) * 10));
  return Math.round(ratingPart + reviewPart);
}
function demandProxy(rating: number | null, reviewCount: number | null) {
  if (!reviewCount) return null;
  const reviewSignal = Math.min(75, Math.log10(reviewCount + 1) * 25);
  const ratingSignal = rating ? Math.max(0, Math.min(25, ((rating - 2.5) / 2.5) * 25)) : 0;
  return Math.round(Math.max(0, Math.min(100, reviewSignal + ratingSignal)));
}
function opportunityScore(websiteStatus: string, demand: number | null, reputation: number | null, seo: number | null) {
  const websiteGap = websiteStatus === "not_detected" ? 45 : websiteStatus === "unreachable" ? 35 : websiteStatus === "detected" ? Math.round((100 - (seo ?? 50)) * 0.35) : 25;
  const demandPart = Math.round((demand ?? 45) * 0.30);
  const reputationPart = Math.round((reputation ?? 45) * 0.20);
  return Math.max(0, Math.min(100, websiteGap + demandPart + reputationPart));
}

async function storedCredential(admin: any, organizationId: string, provider: string, serviceRole: string) {
  const { data } = await admin.from("startup_os_provider_credentials").select("ciphertext,iv").eq("organization_id", organizationId).eq("provider", provider).maybeSingle();
  if (!data?.ciphertext || !data?.iv) throw new Error(`${provider.toUpperCase()}_NOT_CONNECTED`);
  return decryptCredential(data.ciphertext, data.iv, serviceRole, organizationId, provider);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRole) return json({ error: "Service unavailable" }, 503);
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return json({ error: "Authentication required" }, 401);
  const admin = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: authData } = await admin.auth.getUser(token);
  if (!authData.user) return json({ error: "Authentication required" }, 401);
  let body: any;
  try { body = await req.json(); } catch { return json({ error: "Invalid request" }, 400); }
  const organizationId = String(body?.organizationId || "");
  const action = String(body?.action || "");
  if (!organizationId) return json({ error: "Company workspace required" }, 400);
  const { data: member } = await admin.from("organization_members").select("workspace_role").eq("organization_id", organizationId).eq("user_id", authData.user.id).maybeSingle();
  if (!member) return json({ error: "You do not have access to this company workspace." }, 403);

  try {
    if (action === "places_search") {
      if (body?.acknowledgeBillable !== true) return json({ error: "Confirm the Google Places usage warning before running this search." }, 409);
      const query = String(body?.query || "").trim();
      if (query.length < 2) return json({ error: "Enter a company, industry or category to search." }, 400);
      const apiKey = await storedCredential(admin, organizationId, "google_places", serviceRole);
      const location = String(body?.location || "").trim();
      const searchText = location ? `${query} in ${location}` : query;
      const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.websiteUri,places.nationalPhoneNumber,places.rating,places.userRatingCount,places.businessStatus,places.primaryType,places.googleMapsUri",
        },
        body: JSON.stringify({ textQuery: searchText, pageSize: Math.max(1, Math.min(20, Number(body?.limit) || 12)) }),
      });
      if (!response.ok) return json({ error: "Google Places could not complete the search. Check the key, billing and Places API permissions." }, 400);
      const payload = await response.json();
      const places = Array.isArray(payload?.places) ? payload.places : [];
      const records = places.map((place: any) => {
        const rating = typeof place.rating === "number" ? place.rating : null;
        const reviews = Number.isFinite(place.userRatingCount) ? Number(place.userRatingCount) : null;
        const websiteStatus = place.websiteUri ? "detected" : "not_detected";
        const reputation = reputationScore(rating, reviews);
        const demand = demandProxy(rating, reviews);
        return {
          organization_id: organizationId,
          external_place_id: String(place.id || ""),
          company_name: String(place.displayName?.text || "Unnamed business"),
          category: String(place.primaryType || ""),
          address: String(place.formattedAddress || ""),
          location,
          phone: String(place.nationalPhoneNumber || ""),
          website: place.websiteUri ? String(place.websiteUri) : null,
          website_status: websiteStatus,
          rating,
          review_count: reviews,
          business_status: String(place.businessStatus || ""),
          google_maps_url: String(place.googleMapsUri || ""),
          demand_score: demand,
          reputation_score: reputation,
          opportunity_score: opportunityScore(websiteStatus, demand, reputation, null),
          evidence_confidence: "observed",
          evidence: { companyDetails: "Google Places", demandScore: "Estimated proxy from public review volume/rating; not search volume or revenue." },
          recommendation: websiteStatus === "not_detected" ? { priority: "website", message: "No independent website was detected in the Places record. Verify before outreach, then consider a Website Studio demo." } : { priority: "audit", message: "Website detected. Run the website scanner before recommending SEO or redesign work." },
          source_provider: "google_places",
          source_checked_at: new Date().toISOString(),
          created_by: authData.user.id,
          updated_at: new Date().toISOString(),
        };
      });
      if (records.length) {
        const { error } = await admin.from("company_intelligence_records").upsert(records, { onConflict: "organization_id,external_place_id" });
        if (error) throw error;
      }
      await admin.from("company_intelligence_searches").insert({ organization_id: organizationId, query, location, provider: "google_places", result_count: records.length, billable_request_confirmed: true, created_by: authData.user.id });
      return json({ results: records, source: "Google Places", confidence: "Observed company facts; demand is an estimated proxy.", billableRequest: true });
    }

    if (action === "website_scan") {
      const target = await assertPublicUrl(String(body?.url || ""));
      const started = performance.now();
      const response = await fetch(target.toString(), { redirect: "manual", headers: { "User-Agent": "Start-To-Up-Company-Intelligence/1.0" } });
      if ([301,302,303,307,308].includes(response.status)) {
        const location = response.headers.get("location");
        if (!location) throw new Error("REDIRECT_INVALID");
        const redirected = await assertPublicUrl(new URL(location, target).toString());
        target.href = redirected.href;
      }
      const finalResponse = [301,302,303,307,308].includes(response.status) ? await fetch(target.toString(), { redirect: "error", headers: { "User-Agent": "Start-To-Up-Company-Intelligence/1.0" } }) : response;
      if (!finalResponse.ok) return json({ error: "The website did not return a normal public page." }, 400);
      const html = (await finalResponse.text()).slice(0, 5_000_000);
      const ms = Math.round(performance.now() - started);
      const scan = scoreWebsite(html, target, ms, new TextEncoder().encode(html).byteLength);
      let robots = false, sitemap = false;
      try { const r = await fetch(new URL('/robots.txt', target.origin)); robots = r.ok; } catch { /* optional */ }
      try { const s = await fetch(new URL('/sitemap.xml', target.origin)); sitemap = s.ok; } catch { /* optional */ }
      const seoScore = Math.min(100, scan.seoScore + (robots ? 3 : 0) + (sitemap ? 4 : 0));
      const intelligenceId = String(body?.intelligenceId || "");
      const patch = {
        website: target.toString(),
        website_status: "detected",
        seo_score: seoScore,
        performance_score: scan.performanceScore,
        source_checked_at: new Date().toISOString(),
        evidence_confidence: "observed",
        evidence: { ...(typeof body?.existingEvidence === "object" ? body.existingEvidence : {}), websiteScan: { ...scan, robots, sitemap, note: "Performance score is an observed technical response proxy, not Core Web Vitals or owner analytics." } },
        updated_at: new Date().toISOString(),
      };
      if (intelligenceId) {
        const { data: existing } = await admin.from("company_intelligence_records").select("demand_score,reputation_score").eq("id", intelligenceId).eq("organization_id", organizationId).maybeSingle();
        if (!existing) return json({ error: "Company record not found in this workspace." }, 404);
        (patch as any).opportunity_score = opportunityScore("detected", existing.demand_score, existing.reputation_score, seoScore);
        await admin.from("company_intelligence_records").update(patch).eq("id", intelligenceId).eq("organization_id", organizationId);
      } else {
        await admin.from("company_intelligence_records").insert({ organization_id: organizationId, company_name: String(body?.companyName || target.hostname), ...patch, opportunity_score: opportunityScore("detected", null, null, seoScore), source_provider: "website_scan", created_by: authData.user.id });
      }
      return json({ url: target.toString(), seoScore, performanceScore: scan.performanceScore, checks: scan.checks, robots, sitemap, evidence: "Observed public website scan. Performance is not owner-verified Core Web Vitals." });
    }

    if (action === "semrush_domain_overview") {
      if (body?.acknowledgeUnits !== true) return json({ error: "Confirm the Semrush API-unit warning before requesting this dataset." }, 409);
      const domain = String(body?.domain || "").trim().replace(/^https?:\/\//i, "").split('/')[0];
      if (!domain) return json({ error: "Enter a domain." }, 400);
      const apiKey = await storedCredential(admin, organizationId, "semrush", serviceRole);
      const database = String(body?.database || "za").replace(/[^a-z]/gi, "").toLowerCase() || "za";
      const url = new URL("https://api.semrush.com/");
      url.searchParams.set("key", apiKey);
      url.searchParams.set("type", "domain_rank");
      url.searchParams.set("domain", domain);
      url.searchParams.set("database", database);
      url.searchParams.set("export_columns", "Dn,Rk,Or,Ot,Oc,Ad,At,Ac");
      const response = await fetch(url);
      const text = await response.text();
      if (!response.ok || /^ERROR/i.test(text)) return json({ error: "Semrush could not return the requested domain overview. Check API access and available units." }, 400);
      const lines = text.trim().split(/\r?\n/);
      const headers = lines[0]?.split(';') || [];
      const values = lines[1]?.split(';') || [];
      const record = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
      return json({ domain, database, data: record, confidence: "Estimated third-party SEO data from Semrush", apiUnitsWarning: "This request consumes Semrush API units." });
    }

    if (action === "brand_domain_check") {
      const proposedName = String(body?.proposedName || "").trim();
      const domain = String(body?.domain || "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
      if (!proposedName || !domain) return json({ error: "Enter a proposed brand name and domain." }, 400);
      let signal = "no_dns_detected";
      try {
        const records = await Deno.resolveDns(domain, "A");
        if (records.length) signal = "dns_detected";
      } catch { signal = "no_dns_detected"; }
      const { data, error } = await admin.from("startup_brand_checks").insert({ organization_id: organizationId, proposed_name: proposedName, domain, domain_signal: signal, created_by: authData.user.id }).select("*").single();
      if (error) throw error;
      return json({ result: data, disclaimer: "DNS presence is only a signal. It does not prove domain, company-name or trademark availability. Confirm through the appropriate registrar and official registries." });
    }

    return json({ error: "Unsupported Company Intelligence action" }, 400);
  } catch (error) {
    console.error("Company Intelligence error", error);
    const message = String(error).includes("GOOGLE_PLACES_NOT_CONNECTED") ? "Connect Google Places in Integrations before running business discovery."
      : String(error).includes("SEMRUSH_NOT_CONNECTED") ? "Connect Semrush in Integrations before requesting advanced SEO intelligence."
      : String(error).includes("PRIVATE_TARGET") ? "That address cannot be scanned. Use a public business website."
      : "Company Intelligence could not complete that request. Check the inputs and connected provider, then try again.";
    return json({ error: message }, 400);
  }
});
