import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.112.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function base64Url(value: string) {
  return btoa(value).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64UrlBytes(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function utf8Base64(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function pemBytes(pem: string) {
  const normalized = pem.replaceAll("\\n", "\n");
  const base64 = normalized
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s+/g, "");
  const binary = atob(base64);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function createGithubAppJwt(appId: string, privateKey: string) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64Url(JSON.stringify({ iat: now - 60, exp: now + 540, iss: appId }));
  const signingInput = `${header}.${payload}`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemBytes(privateKey),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(signingInput),
  );
  return `${signingInput}.${base64UrlBytes(new Uint8Array(signature))}`;
}

async function githubJson(url: string, init: RequestInit, token: string) {
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "Start-To-Up-Website-Studio",
      ...(init.headers || {}),
    },
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const error = new Error(data?.message || `GitHub request failed with ${response.status}`);
    (error as any).status = response.status;
    throw error;
  }
  return data;
}

async function installationToken(appId: string, installationId: string, privateKey: string) {
  const jwt = await createGithubAppJwt(appId, privateKey);
  const data = await githubJson(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    { method: "POST" },
    jwt,
  );
  return String(data.token);
}

async function currentFileSha(owner: string, repository: string, path: string, branch: string, token: string) {
  try {
    const data = await githubJson(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/contents/${path}?ref=${encodeURIComponent(branch)}`,
      { method: "GET" },
      token,
    );
    return typeof data?.sha === "string" ? data.sha : null;
  } catch (error) {
    if ((error as any)?.status === 404) return null;
    throw error;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRole) return json({ error: "Service configuration unavailable" }, 503);

  const authorization = req.headers.get("Authorization") || "";
  const accessToken = authorization.replace(/^Bearer\s+/i, "").trim();
  if (!accessToken) return json({ error: "Authentication required" }, 401);

  const admin = createClient(supabaseUrl, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await admin.auth.getUser(accessToken);
  if (userError || !userData.user) return json({ error: "Authentication required" }, 401);

  let jobId = "";
  try {
    const body = await req.json();
    jobId = String(body?.jobId || "");
  } catch {
    return json({ error: "Invalid request" }, 400);
  }
  if (!jobId) return json({ error: "Publication job required" }, 400);

  const { data: job, error: jobError } = await admin
    .from("website_studio_publication_jobs")
    .select("*")
    .eq("id", jobId)
    .single();
  if (jobError || !job) return json({ error: "Publication request not found" }, 404);

  const { data: project, error: projectError } = await admin
    .from("website_studio_projects")
    .select("*")
    .eq("id", job.project_id)
    .single();
  if (projectError || !project) return json({ error: "Website project not found" }, 404);

  const { data: roles } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id);
  const isAdmin = (roles || []).some((row) => ["admin", "super_admin"].includes(String(row.role)));
  if (job.requested_by !== userData.user.id && project.owner_id !== userData.user.id && !isAdmin) {
    return json({ error: "Not authorized" }, 403);
  }

  const owner = String(job.repository_owner || project.github_repository_owner || "").trim();
  const repository = String(job.repository_name || project.github_repository_name || "").trim();
  const branch = String(job.branch || project.github_branch || "main").trim() || "main";
  if (!owner || !repository) return json({ error: "Repository destination required" }, 400);

  const manifest = (job.generated_manifest || {}) as Record<string, any>;
  const files = manifest.generated_files as Record<string, string> | undefined;
  if (!files || !Object.keys(files).length) return json({ error: "Generated website package unavailable" }, 400);

  const githubAppId = Deno.env.get("GITHUB_APP_ID");
  const githubInstallationId = Deno.env.get("GITHUB_APP_INSTALLATION_ID");
  const githubPrivateKey = Deno.env.get("GITHUB_APP_PRIVATE_KEY");

  if (!githubAppId || !githubInstallationId || !githubPrivateKey) {
    await admin
      .from("website_studio_publication_jobs")
      .update({
        status: "ready",
        client_message: "Website package is ready for managed GitHub publishing.",
        internal_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);
    return json({ status: "ready", message: "Website package is ready for managed GitHub publishing." }, 202);
  }

  await admin
    .from("website_studio_publication_jobs")
    .update({ status: "preparing", internal_error: null, updated_at: new Date().toISOString() })
    .eq("id", jobId);

  try {
    const token = await installationToken(githubAppId, githubInstallationId, githubPrivateKey);
    let lastCommitSha: string | null = null;

    for (const [path, content] of Object.entries(files)) {
      const sha = await currentFileSha(owner, repository, path, branch, token);
      const payload: Record<string, unknown> = {
        message: `Website Studio: publish ${project.business_name}`,
        content: utf8Base64(String(content)),
        branch,
      };
      if (sha) payload.sha = sha;
      const result = await githubJson(
        `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/contents/${path}`,
        { method: "PUT", body: JSON.stringify(payload), headers: { "Content-Type": "application/json" } },
        token,
      );
      lastCommitSha = result?.commit?.sha || lastCommitSha;
    }

    await admin
      .from("website_studio_publication_jobs")
      .update({
        status: "synced",
        last_commit_sha: lastCommitSha,
        client_message: "Website synced to GitHub successfully.",
        internal_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    await admin
      .from("website_studio_projects")
      .update({
        github_repository_owner: owner,
        github_repository_name: repository,
        github_branch: branch,
        status: project.status === "draft" ? "ready" : project.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", project.id);

    return json({ status: "synced", lastCommitSha });
  } catch (error) {
    const message = error instanceof Error ? error.message : "GitHub publishing failed";
    await admin
      .from("website_studio_publication_jobs")
      .update({
        status: "failed",
        client_message: "The website package is safe. Start To Up can retry the managed GitHub sync.",
        internal_error: message.slice(0, 2000),
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);
    return json({ status: "failed", message: "Managed GitHub sync could not complete." }, 502);
  }
});
