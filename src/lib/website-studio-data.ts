import { supabase } from "../integrations/supabase/client";
import {
  buildPublicationManifest,
  createWebsiteDraft,
  normalizeWebsiteDraft,
  type BusinessCategoryKey,
  type WebsiteStudioDraft,
} from "./website-studio";
import { generateDeployableProjectBundle } from "./website-studio-export";

type AnyRow = Record<string, any>;
const db = supabase as any;

export async function getWebsiteStudioUser() {
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

export async function canUseWebsiteStudio(): Promise<boolean> {
  const user = await getWebsiteStudioUser();
  if (!user) return false;
  const { data, error } = await db.rpc("can_access_website_studio");
  if (error) return true;
  return Boolean(data);
}

export function websiteDraftFromRow(row: AnyRow): WebsiteStudioDraft {
  const fallback = createWebsiteDraft(String(row.business_name || "Your Business"), (row.business_category || "professional-services") as BusinessCategoryKey);
  const config = row.integration_config || {};
  return normalizeWebsiteDraft({
    ...fallback,
    id: row.id,
    projectName: row.project_name || fallback.projectName,
    businessName: row.business_name || fallback.businessName,
    slug: row.slug || fallback.slug,
    category: row.business_category || fallback.category,
    templateKey: row.template_key || fallback.templateKey,
    status: row.status || fallback.status,
    brand: { ...fallback.brand, ...(row.brand_config || {}) },
    site: { ...fallback.site, ...(row.site_config || {}) },
    seo: { ...fallback.seo, ...(row.seo_config || {}) },
    contact: { ...fallback.contact, ...(row.contact_config || {}) },
    github: {
      owner: row.github_repository_owner || fallback.github.owner,
      repository: row.github_repository_name || fallback.github.repository,
      branch: row.github_branch || fallback.github.branch,
      deploymentUrl: row.deployment_url || "",
    },
    integrations: {
      supabase: {
        ...fallback.integrations.supabase,
        ...(config.supabase || {}),
        publicSubmitToken: String(row.public_submit_token || config.supabase?.publicSubmitToken || ""),
      },
      vercel: { ...fallback.integrations.vercel, ...(config.vercel || {}) },
      lovable: { ...fallback.integrations.lovable, ...(config.lovable || {}) },
    },
  });
}

export async function listWebsiteStudioProjects(): Promise<WebsiteStudioDraft[]> {
  const user = await getWebsiteStudioUser();
  if (!user) return [];
  const { data, error } = await db.from("website_studio_projects").select("*").order("updated_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(websiteDraftFromRow);
}

export async function saveWebsiteStudioProject(raw: WebsiteStudioDraft): Promise<WebsiteStudioDraft> {
  const user = await getWebsiteStudioUser();
  if (!user) throw new Error("SIGN_IN_REQUIRED");
  const draft = normalizeWebsiteDraft(raw);
  const payload = {
    owner_id: user.id,
    project_name: draft.projectName,
    business_name: draft.businessName,
    slug: draft.slug,
    business_category: draft.category,
    template_key: draft.templateKey,
    status: draft.status,
    brand_config: draft.brand,
    site_config: draft.site,
    seo_config: draft.seo,
    contact_config: draft.contact,
    integration_config: draft.integrations,
    export_config: { format: "vite-react-typescript", version: 2, portable: true },
    github_repository_owner: draft.github.owner || null,
    github_repository_name: draft.github.repository || null,
    github_branch: draft.github.branch || "main",
    deployment_url: draft.integrations.vercel.deploymentUrl || draft.github.deploymentUrl || null,
    updated_at: new Date().toISOString(),
  };

  const result = draft.id
    ? await db.from("website_studio_projects").update(payload).eq("id", draft.id).select("*").single()
    : await db.from("website_studio_projects").insert(payload).select("*").single();
  if (result.error) throw result.error;
  return websiteDraftFromRow(result.data);
}

export async function markWebsiteStudioExported(projectId: string) {
  await db.from("website_studio_projects").update({ last_exported_at: new Date().toISOString() }).eq("id", projectId);
}

export async function createWebsiteStudioVersion(draft: WebsiteStudioDraft) {
  if (!draft.id) return;
  const user = await getWebsiteStudioUser();
  if (!user) return;
  const { data: latest } = await db.from("website_studio_versions").select("version_number").eq("project_id", draft.id).order("version_number", { ascending: false }).limit(1);
  const versionNumber = Number(latest?.[0]?.version_number || 0) + 1;
  const { error } = await db.from("website_studio_versions").insert({ project_id: draft.id, version_number: versionNumber, snapshot: draft, created_by: user.id });
  if (error) throw error;
  return versionNumber;
}

async function queuePublication(raw: WebsiteStudioDraft, provider: "github" | "vercel", visibility: "private" | "public" = "private") {
  if (!raw.id) throw new Error("SAVE_PROJECT_FIRST");
  const user = await getWebsiteStudioUser();
  if (!user) throw new Error("SIGN_IN_REQUIRED");
  const draft = normalizeWebsiteDraft(raw);
  const generatedFiles = await generateDeployableProjectBundle(draft);
  const manifest = { ...buildPublicationManifest(draft), generated_files: generatedFiles, export: { file_count: Object.keys(generatedFiles).length, runtime: "vite-react-typescript", zero_edit_vercel_ready: true } };
  const { data, error } = await db.from("website_studio_publication_jobs").insert({
    project_id: draft.id,
    requested_by: user.id,
    provider,
    repository_owner: draft.github.owner || null,
    repository_name: draft.github.repository || null,
    branch: draft.github.branch || "main",
    visibility,
    status: "queued",
    generated_manifest: manifest,
    client_message: provider === "github" ? "Full source project prepared for managed GitHub publishing." : "Full source project prepared for managed Vercel deployment.",
  }).select("*").single();
  if (error) throw error;
  return data;
}

export function queueGithubPublication(draft: WebsiteStudioDraft, visibility: "private" | "public" = "private") {
  return queuePublication(draft, "github", visibility);
}

export function queueVercelDeployment(draft: WebsiteStudioDraft) {
  return queuePublication(draft, "vercel", "private");
}

export async function runGithubPublication(jobId: string) {
  const { data, error } = await supabase.functions.invoke("website-studio-publish-github", { body: { jobId } });
  if (error) throw error;
  return data;
}

export async function runVercelDeployment(jobId: string) {
  const { data, error } = await supabase.functions.invoke("website-studio-deploy-vercel", { body: { jobId } });
  if (error) throw error;
  return data;
}

export async function saveStudioIntegration(projectId: string, provider: "github" | "vercel" | "supabase" | "lovable", status: string, config: Record<string, unknown>, externalProjectId?: string, externalUrl?: string) {
  const user = await getWebsiteStudioUser();
  if (!user) throw new Error("SIGN_IN_REQUIRED");
  const { data, error } = await db.from("website_studio_integrations").upsert({
    project_id: projectId,
    provider,
    status,
    config,
    external_project_id: externalProjectId || null,
    external_url: externalUrl || null,
    created_by: user.id,
    updated_at: new Date().toISOString(),
    last_error: null,
  }, { onConflict: "project_id,provider" }).select("*").single();
  if (error) throw error;
  return data;
}

export async function listStudioIntegrations(projectId: string): Promise<AnyRow[]> {
  const { data, error } = await db.from("website_studio_integrations").select("*").eq("project_id", projectId).order("provider");
  if (error) throw error;
  return data || [];
}

export async function listStudioDeployments(projectId: string): Promise<AnyRow[]> {
  const { data, error } = await db.from("website_studio_deployments").select("*").eq("project_id", projectId).order("created_at", { ascending: false }).limit(12);
  if (error) throw error;
  return data || [];
}

export async function listPublicationJobs(projectId: string): Promise<AnyRow[]> {
  const { data, error } = await db.from("website_studio_publication_jobs").select("*").eq("project_id", projectId).order("created_at", { ascending: false }).limit(12);
  if (error) throw error;
  return data || [];
}
