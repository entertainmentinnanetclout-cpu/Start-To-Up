import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.112.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const providers = new Set(["github","vercel","supabase","lovable","stripe","resend","google_business","crm_webhook"]);
function json(body: unknown, status = 200) { return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }); }
function bytesToBase64(bytes: Uint8Array) { let value = ""; for (const byte of bytes) value += String.fromCharCode(byte); return btoa(value); }
function base64ToBytes(value: string) { const raw = atob(value); return Uint8Array.from(raw, (char) => char.charCodeAt(0)); }

async function cryptoKey(serviceRole: string, projectId: string, provider: string) {
  const material = new TextEncoder().encode(`${serviceRole}|website-studio-provider-v1|${projectId}|${provider}`);
  const digest = await crypto.subtle.digest("SHA-256", material);
  return crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}
async function encryptCredential(value: string, serviceRole: string, projectId: string, provider: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await cryptoKey(serviceRole, projectId, provider);
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(value));
  return { ciphertext: bytesToBase64(new Uint8Array(encrypted)), iv: bytesToBase64(iv) };
}
async function decryptCredential(ciphertext: string, iv: string, serviceRole: string, projectId: string, provider: string) {
  const key = await cryptoKey(serviceRole, projectId, provider);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: base64ToBytes(iv) }, key, base64ToBytes(ciphertext));
  return new TextDecoder().decode(plain);
}
function hint(value: string) { const clean = value.trim(); return clean ? `••••${clean.slice(-4)}` : ""; }
function safeUrl(value: unknown) { try { const url = new URL(String(value || "")); return url.protocol === "https:" ? url.toString().replace(/\/$/, "") : ""; } catch { return ""; } }

async function providerRequest(provider: string, credential: string, config: Record<string, unknown>) {
  const headers: Record<string,string> = { "Accept": "application/json", "User-Agent": "Start-To-Up-Website-Studio" };
  let url = ""; let init: RequestInit = { method: "GET", headers };
  if (provider === "github") { url = "https://api.github.com/user"; headers.Authorization = `Bearer ${credential}`; headers["X-GitHub-Api-Version"] = "2022-11-28"; }
  else if (provider === "vercel") { url = "https://api.vercel.com/v2/user"; headers.Authorization = `Bearer ${credential}`; }
  else if (provider === "stripe") { url = "https://api.stripe.com/v1/account"; headers.Authorization = `Bearer ${credential}`; }
  else if (provider === "resend") { url = "https://api.resend.com/domains"; headers.Authorization = `Bearer ${credential}`; }
  else if (provider === "google_business") { url = "https://mybusinessaccountmanagement.googleapis.com/v1/accounts"; headers.Authorization = `Bearer ${credential}`; }
  else if (provider === "supabase") {
    const base = safeUrl(config.url); if (!base || !credential.startsWith("sb_") && !credential.includes(".")) throw new Error("INVALID_PUBLIC_CONFIG");
    url = `${base}/rest/v1/`; headers.apikey = credential; headers.Authorization = `Bearer ${credential}`;
  } else if (provider === "crm_webhook") {
    url = safeUrl(config.webhookUrl); if (!url) throw new Error("INVALID_WEBHOOK");
    headers["Content-Type"] = "application/json"; if (credential) headers.Authorization = `Bearer ${credential}`;
    init = { method: "POST", headers, body: JSON.stringify({ source: "Start To Up Website Studio", type: "connection_test", sentAt: new Date().toISOString() }) };
  } else if (provider === "lovable") {
    const editorUrl = safeUrl(config.editorUrl); const previewUrl = safeUrl(config.previewUrl); const projectId = credential.trim();
    if (!projectId && !editorUrl && !previewUrl) throw new Error("LOVABLE_DETAILS_REQUIRED");
    return { ok: true, externalUrl: editorUrl || previewUrl || "https://lovable.dev", metadata: { projectId } };
  } else throw new Error("UNSUPPORTED_PROVIDER");

  const response = await fetch(url, init);
  const body = await response.text();
  let parsed: any = null; try { parsed = body ? JSON.parse(body) : null; } catch { parsed = null; }
  if (!response.ok) throw new Error(`PROVIDER_${response.status}`);
  const externalUrl = provider === "github" ? String(parsed?.html_url || "")
    : provider === "vercel" ? "https://vercel.com/account"
    : provider === "stripe" ? "https://dashboard.stripe.com"
    : provider === "resend" ? "https://resend.com/domains"
    : provider === "google_business" ? "https://business.google.com"
    : provider === "supabase" ? String(config.url || "")
    : provider === "crm_webhook" ? String(config.webhookUrl || "") : "";
  return { ok: true, externalUrl, metadata: provider === "github" ? { login: parsed?.login } : provider === "vercel" ? { username: parsed?.user?.username || parsed?.user?.email } : provider === "stripe" ? { accountId: parsed?.id, livemode: Boolean(parsed?.charges_enabled) } : {} };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const supabaseUrl = Deno.env.get("SUPABASE_URL"); const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRole) return json({ error: "Connector unavailable" }, 503);
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return json({ error: "Authentication required" }, 401);
  const admin = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: authData, error: authError } = await admin.auth.getUser(token);
  if (authError || !authData.user) return json({ error: "Authentication required" }, 401);

  let body: any; try { body = await req.json(); } catch { return json({ error: "Invalid request" }, 400); }
  const action = String(body?.action || "status"); const projectId = String(body?.projectId || ""); const provider = String(body?.provider || "");
  if (!projectId) return json({ error: "Project required" }, 400);
  if (provider && !providers.has(provider)) return json({ error: "Unsupported provider" }, 400);

  const { data: project } = await admin.from("website_studio_projects").select("id,owner_id").eq("id", projectId).single();
  if (!project) return json({ error: "Project not found" }, 404);
  const { data: roleRows } = await admin.from("user_roles").select("role").eq("user_id", authData.user.id);
  const isAdmin = (roleRows || []).some((row: any) => ["admin","super_admin"].includes(String(row.role)));
  const { data: collaborator } = await admin.from("website_studio_collaborators").select("role,status,user_id,invited_email").eq("project_id", projectId).or(`user_id.eq.${authData.user.id},invited_email.eq.${authData.user.email || ""}`).maybeSingle();
  const canManage = project.owner_id === authData.user.id || isAdmin || (collaborator?.status === "active" && ["developer","publisher"].includes(String(collaborator.role)));
  if (!canManage) return json({ error: "Not authorized" }, 403);

  if (action === "status") {
    const [{ data: integrations }, { data: credentials }] = await Promise.all([
      admin.from("website_studio_integrations").select("provider,status,external_url,config,updated_at,last_error").eq("project_id", projectId),
      admin.from("website_studio_provider_credentials").select("provider,credential_hint,updated_at").eq("project_id", projectId),
    ]);
    const hints = new Map((credentials || []).map((row: any) => [row.provider, row]));
    return json({ connections: (integrations || []).map((row: any) => ({ provider: row.provider, status: row.status, credentialHint: hints.get(row.provider)?.credential_hint || "", externalUrl: row.external_url || "", publicConfig: row.config || {}, lastCheckedAt: row.updated_at, message: row.last_error ? "Connection needs attention." : undefined })) });
  }
  if (!provider) return json({ error: "Provider required" }, 400);

  if (action === "disconnect") {
    await admin.from("website_studio_provider_credentials").delete().eq("project_id", projectId).eq("provider", provider);
    await admin.from("website_studio_integrations").upsert({ project_id: projectId, provider, status: "disconnected", config: {}, external_project_id: null, external_url: null, last_error: null, created_by: authData.user.id, updated_at: new Date().toISOString() }, { onConflict: "project_id,provider" });
    return json({ provider, status: "disconnected", message: `${provider} disconnected.` });
  }

  const publicConfig = body?.publicConfig && typeof body.publicConfig === "object" ? body.publicConfig as Record<string,unknown> : {};
  let credential = String(body?.credential || "").trim();
  if (!credential) {
    const { data: stored } = await admin.from("website_studio_provider_credentials").select("ciphertext,iv").eq("project_id", projectId).eq("provider", provider).maybeSingle();
    if (stored?.ciphertext && stored?.iv) credential = await decryptCredential(stored.ciphertext, stored.iv, serviceRole, projectId, provider);
  }
  if (!credential && !["lovable"].includes(provider)) return json({ provider, status: "error", message: "Paste the requested connection value first." }, 400);

  try {
    const tested = await providerRequest(provider, credential, publicConfig);
    if (action === "test") return json({ provider, status: "connected", credentialHint: hint(credential), externalUrl: tested.externalUrl, publicConfig, lastCheckedAt: new Date().toISOString(), message: "Connection test passed." });
    if (action !== "connect") return json({ error: "Unsupported action" }, 400);

    if (credential) {
      const encrypted = await encryptCredential(credential, serviceRole, projectId, provider);
      await admin.from("website_studio_provider_credentials").upsert({ project_id: projectId, provider, ...encrypted, credential_hint: hint(credential), metadata: tested.metadata || {}, created_by: authData.user.id, updated_at: new Date().toISOString() }, { onConflict: "project_id,provider" });
    }
    const publicIntegrationConfig = provider === "supabase" ? { ...publicConfig, publishableKey: credential } : provider === "lovable" ? { ...publicConfig, projectId: credential } : publicConfig;
    const { data: integration, error: integrationError } = await admin.from("website_studio_integrations").upsert({ project_id: projectId, provider, status: "connected", config: publicIntegrationConfig, external_project_id: provider === "lovable" ? credential || null : null, external_url: tested.externalUrl || null, last_error: null, created_by: authData.user.id, updated_at: new Date().toISOString() }, { onConflict: "project_id,provider" }).select("provider,status,external_url,config,updated_at").single();
    if (integrationError) throw integrationError;
    return json({ provider, status: integration.status, credentialHint: hint(credential), externalUrl: integration.external_url || "", publicConfig: integration.config || {}, lastCheckedAt: integration.updated_at, message: `${provider} connected successfully.` });
  } catch (error) {
    console.error("Website Studio provider test failed", provider, error);
    await admin.from("website_studio_integrations").upsert({ project_id: projectId, provider, status: "error", config: publicConfig, last_error: "Provider verification failed", created_by: authData.user.id, updated_at: new Date().toISOString() }, { onConflict: "project_id,provider" });
    return json({ provider, status: "error", message: "The provider could not verify these details. Check the key and permissions, then try again." }, 400);
  }
});
