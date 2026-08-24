import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.112.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

async function vercelJson(path: string, init: RequestInit, token: string, teamId?: string) {
  const separator = path.includes("?") ? "&" : "?";
  const url = `https://api.vercel.com${path}${teamId ? `${separator}teamId=${encodeURIComponent(teamId)}` : ""}`;
  const response = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers || {}) },
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const error = new Error(data?.error?.message || data?.message || `Vercel request failed with ${response.status}`);
    (error as any).status = response.status;
    throw error;
  }
  return data;
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

  const admin = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: userData, error: userError } = await admin.auth.getUser(accessToken);
  if (userError || !userData.user) return json({ error: "Authentication required" }, 401);

  let jobId = "";
  try { jobId = String((await req.json())?.jobId || ""); } catch { return json({ error: "Invalid request" }, 400); }
  if (!jobId) return json({ error: "Deployment job required" }, 400);

  const { data: job } = await admin.from("website_studio_publication_jobs").select("*").eq("id", jobId).single();
  if (!job || job.provider !== "vercel") return json({ error: "Vercel deployment request not found" }, 404);
  const { data: project } = await admin.from("website_studio_projects").select("*").eq("id", job.project_id).single();
  if (!project) return json({ error: "Website project not found" }, 404);

  const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", userData.user.id);
  const isAdmin = (roles || []).some((row) => ["admin", "super_admin"].includes(String(row.role)));
  if (project.owner_id !== userData.user.id && !isAdmin) return json({ error: "Not authorized" }, 403);

  const manifest = (job.generated_manifest || {}) as Record<string, any>;
  const files = manifest.generated_files as Record<string, string | { encoding: "base64"; data: string }> | undefined;
  if (!files || !Object.keys(files).length) return json({ error: "Generated source package unavailable" }, 400);

  const integration = (project.integration_config || {}) as Record<string, any>;
  const vercelConfig = integration.vercel || {};
  const projectName = String(vercelConfig.projectName || project.slug || `site-${project.id.slice(0, 8)}`).toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
  const production = vercelConfig.production !== false;
  const vercelToken = Deno.env.get("VERCEL_TOKEN");
  const teamId = String(vercelConfig.teamId || Deno.env.get("VERCEL_TEAM_ID") || "").trim() || undefined;

  if (!vercelToken) {
    await admin.from("website_studio_publication_jobs").update({ status: "ready", client_message: "Source package is Vercel-ready. Connect Start To Up's Vercel deployment credential to deploy from inside Website Studio.", internal_error: null, updated_at: new Date().toISOString() }).eq("id", jobId);
    await admin.from("website_studio_integrations").upsert({ project_id: project.id, provider: "vercel", status: "ready", config: { projectName, teamId: teamId || "", production }, created_by: userData.user.id, updated_at: new Date().toISOString() }, { onConflict: "project_id,provider" });
    return json({ status: "ready", message: "Project is Vercel-ready." }, 202);
  }

  await admin.from("website_studio_publication_jobs").update({ status: "preparing", internal_error: null, updated_at: new Date().toISOString() }).eq("id", jobId);
  await admin.from("website_studio_integrations").upsert({ project_id: project.id, provider: "vercel", status: "deploying", config: { projectName, teamId: teamId || "", production }, created_by: userData.user.id, updated_at: new Date().toISOString() }, { onConflict: "project_id,provider" });

  try {
    let vercelProject: any = null;
    try {
      vercelProject = await vercelJson("/v11/projects", {
        method: "POST",
        body: JSON.stringify({ name: projectName, framework: "vite", buildCommand: "npm run build", installCommand: "npm install", outputDirectory: "dist" }),
      }, vercelToken, teamId);
    } catch (error) {
      if ((error as any)?.status !== 409) throw error;
      vercelProject = await vercelJson(`/v9/projects/${encodeURIComponent(projectName)}`, { method: "GET" }, vercelToken, teamId);
    }

    const deployment = await vercelJson("/v13/deployments", {
      method: "POST",
      body: JSON.stringify({
        name: projectName,
        project: vercelProject.id || projectName,
        target: production ? "production" : undefined,
        files: Object.entries(files).map(([file, value]) => typeof value === "string" ? { file, data: value } : { file, data: value.data, encoding: "base64" }),
        projectSettings: { framework: "vite", buildCommand: "npm run build", installCommand: "npm install", outputDirectory: "dist" },
      }),
    }, vercelToken, teamId);

    const deploymentUrl = deployment?.url ? `https://${deployment.url}` : null;
    await admin.from("website_studio_deployments").insert({
      project_id: project.id,
      provider: "vercel",
      status: String(deployment?.readyState || deployment?.status || "deploying").toLowerCase(),
      external_project_id: String(vercelProject.id || "") || null,
      external_deployment_id: String(deployment?.id || "") || null,
      preview_url: deploymentUrl,
      production_url: production ? deploymentUrl : null,
      metadata: { project_name: projectName, team_id: teamId || null },
      requested_by: userData.user.id,
    });
    await admin.from("website_studio_integrations").upsert({
      project_id: project.id,
      provider: "vercel",
      status: "deployed",
      external_project_id: String(vercelProject.id || "") || null,
      external_url: deploymentUrl,
      config: { projectName, teamId: teamId || "", production },
      created_by: userData.user.id,
      updated_at: new Date().toISOString(),
      last_error: null,
    }, { onConflict: "project_id,provider" });
    await admin.from("website_studio_publication_jobs").update({ status: "synced", client_message: "Vercel deployment created successfully.", internal_error: null, updated_at: new Date().toISOString() }).eq("id", jobId);
    await admin.from("website_studio_projects").update({ deployment_url: deploymentUrl, status: production ? "published" : project.status, updated_at: new Date().toISOString() }).eq("id", project.id);
    return json({ status: "deployed", projectId: vercelProject.id, deploymentId: deployment?.id, url: deploymentUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Vercel deployment failed";
    await admin.from("website_studio_publication_jobs").update({ status: "failed", client_message: "The source package is safe. Vercel deployment can be retried.", internal_error: message.slice(0, 2000), updated_at: new Date().toISOString() }).eq("id", jobId);
    await admin.from("website_studio_integrations").upsert({ project_id: project.id, provider: "vercel", status: "error", config: { projectName, teamId: teamId || "", production }, last_error: message.slice(0, 2000), created_by: userData.user.id, updated_at: new Date().toISOString() }, { onConflict: "project_id,provider" });
    return json({ status: "failed", message: "Vercel deployment could not complete." }, 502);
  }
});
