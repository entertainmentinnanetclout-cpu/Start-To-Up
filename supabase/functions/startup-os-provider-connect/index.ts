import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.112.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supported = new Set([
  "github","vercel","supabase","lovable","stripe","resend","google_business",
  "google_analytics","search_console","meta","google_places","semrush","crm_webhook",
]);
const deferredVerification = new Set(["google_places","semrush"]);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
function bytesToBase64(bytes: Uint8Array) { let value = ""; for (const byte of bytes) value += String.fromCharCode(byte); return btoa(value); }
function base64ToBytes(value: string) { const raw = atob(value); return Uint8Array.from(raw, (char) => char.charCodeAt(0)); }
function hint(value: string) { const clean = value.trim(); return clean ? `••••${clean.slice(-4)}` : ""; }
function safeUrl(value: unknown) { try { const parsed = new URL(String(value || "")); return parsed.protocol === "https:" ? parsed.toString().replace(/\/$/, "") : ""; } catch { return ""; } }

async function cryptoKey(serviceRole: string, organizationId: string, provider: string) {
  const material = new TextEncoder().encode(`${serviceRole}|startup-os-provider-v1|${organizationId}|${provider}`);
  const digest = await crypto.subtle.digest("SHA-256", material);
  return crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}
async function encryptCredential(value: string, serviceRole: string, organizationId: string, provider: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await cryptoKey(serviceRole, organizationId, provider);
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(value));
  return { ciphertext: bytesToBase64(new Uint8Array(encrypted)), iv: bytesToBase64(iv) };
}
async function decryptCredential(ciphertext: string, iv: string, serviceRole: string, organizationId: string, provider: string) {
  const key = await cryptoKey(serviceRole, organizationId, provider);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: base64ToBytes(iv) }, key, base64ToBytes(ciphertext));
  return new TextDecoder().decode(plain);
}

async function verifyProvider(provider: string, credential: string, config: Record<string, unknown>) {
  if (deferredVerification.has(provider)) {
    if (!credential.trim()) throw new Error("CREDENTIAL_REQUIRED");
    return {
      status: "ready",
      externalUrl: provider === "google_places" ? "https://console.cloud.google.com/google/maps-apis/overview" : "https://www.semrush.com/",
      metadata: { deferredVerification: true },
      message: provider === "google_places"
        ? "Key saved. To avoid an unexpected bill, Start To Up will verify Places access only when you run a Company Intelligence search and will show the request cost warning first."
        : "API key saved. Start To Up will verify paid Semrush access only when you request a dataset and will show the API-unit warning first.",
    };
  }

  const headers: Record<string,string> = { Accept: "application/json", "User-Agent": "Start-To-Up-Startup-OS" };
  let url = "";
  let init: RequestInit = { method: "GET", headers };

  if (provider === "github") {
    url = "https://api.github.com/user";
    headers.Authorization = `Bearer ${credential}`;
    headers["X-GitHub-Api-Version"] = "2022-11-28";
  } else if (provider === "vercel") {
    url = "https://api.vercel.com/v2/user";
    headers.Authorization = `Bearer ${credential}`;
  } else if (provider === "stripe") {
    url = "https://api.stripe.com/v1/account";
    headers.Authorization = `Bearer ${credential}`;
  } else if (provider === "resend") {
    url = "https://api.resend.com/domains";
    headers.Authorization = `Bearer ${credential}`;
  } else if (provider === "google_business") {
    url = "https://mybusinessaccountmanagement.googleapis.com/v1/accounts";
    headers.Authorization = `Bearer ${credential}`;
  } else if (provider === "google_analytics" || provider === "search_console") {
    url = `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${encodeURIComponent(credential)}`;
  } else if (provider === "meta") {
    url = `https://graph.facebook.com/v23.0/me?fields=id,name&access_token=${encodeURIComponent(credential)}`;
  } else if (provider === "supabase") {
    const base = safeUrl(config.url);
    if (!base || !credential) throw new Error("INVALID_SUPABASE_DETAILS");
    url = `${base}/rest/v1/`;
    headers.apikey = credential;
    headers.Authorization = `Bearer ${credential}`;
  } else if (provider === "crm_webhook") {
    url = safeUrl(config.webhookUrl);
    if (!url) throw new Error("INVALID_WEBHOOK");
    headers["Content-Type"] = "application/json";
    if (credential) headers.Authorization = `Bearer ${credential}`;
    init = { method: "POST", headers, body: JSON.stringify({ source: "Start To Up Startup OS", type: "connection_test" }) };
  } else if (provider === "lovable") {
    const editorUrl = safeUrl(config.editorUrl);
    const previewUrl = safeUrl(config.previewUrl);
    if (!credential.trim() && !editorUrl && !previewUrl) throw new Error("LOVABLE_DETAILS_REQUIRED");
    return { status: "connected", externalUrl: editorUrl || previewUrl || "https://lovable.dev", metadata: { projectId: credential.trim() }, message: "Lovable project details connected." };
  } else {
    throw new Error("UNSUPPORTED_PROVIDER");
  }

  const response = await fetch(url, init);
  const body = await response.text();
  let parsed: any = null;
  try { parsed = body ? JSON.parse(body) : null; } catch { parsed = null; }
  if (!response.ok) throw new Error(`PROVIDER_${response.status}`);

  const externalUrl = provider === "github" ? String(parsed?.html_url || "https://github.com")
    : provider === "vercel" ? "https://vercel.com/account"
    : provider === "stripe" ? "https://dashboard.stripe.com"
    : provider === "resend" ? "https://resend.com/domains"
    : provider === "google_business" ? "https://business.google.com"
    : provider === "google_analytics" ? "https://analytics.google.com"
    : provider === "search_console" ? "https://search.google.com/search-console"
    : provider === "meta" ? "https://business.facebook.com"
    : provider === "supabase" ? String(config.url || "")
    : provider === "crm_webhook" ? String(config.webhookUrl || "") : "";

  const metadata = provider === "github" ? { login: parsed?.login }
    : provider === "vercel" ? { username: parsed?.user?.username || parsed?.user?.email }
    : provider === "stripe" ? { accountId: parsed?.id, chargesEnabled: Boolean(parsed?.charges_enabled) }
    : provider === "meta" ? { accountId: parsed?.id, name: parsed?.name }
    : {};

  return { status: "connected", externalUrl, metadata, message: "Connection test passed." };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRole) return json({ error: "Connector unavailable" }, 503);

  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return json({ error: "Authentication required" }, 401);

  const admin = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: authData, error: authError } = await admin.auth.getUser(token);
  if (authError || !authData.user) return json({ error: "Authentication required" }, 401);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "Invalid request" }, 400); }
  const action = String(body?.action || "status");
  const organizationId = String(body?.organizationId || "");
  const provider = String(body?.provider || "");
  if (!organizationId) return json({ error: "Company workspace required" }, 400);
  if (provider && !supported.has(provider)) return json({ error: "Unsupported provider" }, 400);

  const { data: member } = await admin.from("organization_members")
    .select("workspace_role")
    .eq("organization_id", organizationId)
    .eq("user_id", authData.user.id)
    .maybeSingle();
  const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", authData.user.id);
  const isPlatformAdmin = (roles || []).some((row: any) => ["admin","super_admin"].includes(String(row.role)));
  const canManage = isPlatformAdmin || ["owner","admin"].includes(String(member?.workspace_role || ""));
  if (!canManage) {
    const { data: explicitPermission } = await admin.from("workspace_member_permissions")
      .select("granted")
      .eq("organization_id", organizationId)
      .eq("user_id", authData.user.id)
      .eq("permission", "integrations.manage")
      .eq("granted", true)
      .maybeSingle();
    if (!explicitPermission) return json({ error: "You do not have permission to manage integrations for this workspace." }, 403);
  }

  if (action === "status") {
    const { data: rows } = await admin.from("startup_os_integrations")
      .select("provider,status,config,external_url,credential_hint,last_checked_at,last_error")
      .eq("organization_id", organizationId);
    return json({ connections: (rows || []).map((row: any) => ({
      provider: row.provider,
      status: row.status,
      publicConfig: row.config || {},
      externalUrl: row.external_url || "",
      credentialHint: row.credential_hint || "",
      lastCheckedAt: row.last_checked_at,
      message: row.last_error ? "Connection needs attention." : undefined,
    })) });
  }

  if (!provider) return json({ error: "Provider required" }, 400);

  if (action === "disconnect") {
    await admin.from("startup_os_provider_credentials").delete().eq("organization_id", organizationId).eq("provider", provider);
    await admin.from("startup_os_integrations").upsert({
      organization_id: organizationId,
      provider,
      status: "disconnected",
      config: {},
      external_url: null,
      external_account_id: null,
      credential_hint: null,
      last_checked_at: new Date().toISOString(),
      last_error: null,
      created_by: authData.user.id,
      updated_at: new Date().toISOString(),
    }, { onConflict: "organization_id,provider" });
    await admin.from("workspace_audit_log").insert({ organization_id: organizationId, actor_id: authData.user.id, action: "integration.disconnected", entity_type: "integration", new_state: { provider } });
    return json({ provider, status: "disconnected", message: `${provider} disconnected.` });
  }

  const publicConfig = body?.publicConfig && typeof body.publicConfig === "object" ? body.publicConfig as Record<string,unknown> : {};
  let credential = String(body?.credential || "").trim();
  if (!credential) {
    const { data: stored } = await admin.from("startup_os_provider_credentials")
      .select("ciphertext,iv")
      .eq("organization_id", organizationId)
      .eq("provider", provider)
      .maybeSingle();
    if (stored?.ciphertext && stored?.iv) credential = await decryptCredential(stored.ciphertext, stored.iv, serviceRole, organizationId, provider);
  }
  if (!credential && !["lovable","crm_webhook"].includes(provider)) return json({ provider, status: "error", message: "Paste the requested connection value first." }, 400);

  try {
    const tested = await verifyProvider(provider, credential, publicConfig);
    if (action === "test") return json({ provider, status: tested.status, credentialHint: hint(credential), externalUrl: tested.externalUrl, publicConfig, lastCheckedAt: new Date().toISOString(), message: tested.message });
    if (action !== "connect") return json({ error: "Unsupported action" }, 400);

    if (credential) {
      const encrypted = await encryptCredential(credential, serviceRole, organizationId, provider);
      await admin.from("startup_os_provider_credentials").upsert({
        organization_id: organizationId,
        provider,
        ...encrypted,
        credential_hint: hint(credential),
        metadata: tested.metadata || {},
        created_by: authData.user.id,
        updated_at: new Date().toISOString(),
      }, { onConflict: "organization_id,provider" });
    }

    const publicIntegrationConfig = provider === "supabase" ? { ...publicConfig, publishableKey: credential }
      : provider === "lovable" ? { ...publicConfig, projectId: credential }
      : publicConfig;
    await admin.from("startup_os_integrations").upsert({
      organization_id: organizationId,
      provider,
      status: tested.status,
      config: publicIntegrationConfig,
      external_url: tested.externalUrl || null,
      credential_hint: hint(credential),
      last_checked_at: new Date().toISOString(),
      last_error: null,
      created_by: authData.user.id,
      updated_at: new Date().toISOString(),
    }, { onConflict: "organization_id,provider" });
    await admin.from("workspace_audit_log").insert({ organization_id: organizationId, actor_id: authData.user.id, action: "integration.connected", entity_type: "integration", new_state: { provider, status: tested.status } });
    return json({ provider, status: tested.status, credentialHint: hint(credential), externalUrl: tested.externalUrl, publicConfig: publicIntegrationConfig, lastCheckedAt: new Date().toISOString(), message: tested.message || `${provider} connected successfully.` });
  } catch (error) {
    console.error("Startup OS provider test failed", provider, error);
    await admin.from("startup_os_integrations").upsert({
      organization_id: organizationId,
      provider,
      status: "error",
      config: publicConfig,
      credential_hint: credential ? hint(credential) : null,
      last_checked_at: new Date().toISOString(),
      last_error: "Provider verification failed",
      created_by: authData.user.id,
      updated_at: new Date().toISOString(),
    }, { onConflict: "organization_id,provider" });
    return json({ provider, status: "error", message: "The provider could not verify these details. Check the copied value and provider permissions, then try again." }, 400);
  }
});
