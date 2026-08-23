import { supabase } from "../integrations/supabase/client";
import {
  buildPublicationManifest,
  createWebsiteDraft,
  type BusinessCategoryKey,
  type WebsiteStudioDraft,
} from "./website-studio";

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
  const fallback = createWebsiteDraft(
    String(row.business_name || "Your Business"),
    (row.business_category || "professional-services") as BusinessCategoryKey,
  );
  return {
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
  };
}

export async function listWebsiteStudioProjects(): Promise<WebsiteStudioDraft[]> {
  const user = await getWebsiteStudioUser();
  if (!user) return [];
  const { data, error } = await db
    .from("website_studio_projects")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(websiteDraftFromRow);
}

export async function saveWebsiteStudioProject(
  draft: WebsiteStudioDraft,
): Promise<WebsiteStudioDraft> {
  const user = await getWebsiteStudioUser();
  if (!user) throw new Error("SIGN_IN_REQUIRED");
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
    github_repository_owner: draft.github.owner || null,
    github_repository_name: draft.github.repository || null,
    github_branch: draft.github.branch || "main",
    deployment_url: draft.github.deploymentUrl || null,
    updated_at: new Date().toISOString(),
  };

  let result;
  if (draft.id) {
    result = await db
      .from("website_studio_projects")
      .update(payload)
      .eq("id", draft.id)
      .select("*")
      .single();
  } else {
    result = await db
      .from("website_studio_projects")
      .insert(payload)
      .select("*")
      .single();
  }
  if (result.error) throw result.error;
  return websiteDraftFromRow(result.data);
}

export async function createWebsiteStudioVersion(draft: WebsiteStudioDraft) {
  if (!draft.id) return;
  const user = await getWebsiteStudioUser();
  if (!user) return;
  const { data: latest } = await db
    .from("website_studio_versions")
    .select("version_number")
    .eq("project_id", draft.id)
    .order("version_number", { ascending: false })
    .limit(1);
  const versionNumber = Number(latest?.[0]?.version_number || 0) + 1;
  const { error } = await db.from("website_studio_versions").insert({
    project_id: draft.id,
    version_number: versionNumber,
    snapshot: draft,
    created_by: user.id,
  });
  if (error) throw error;
  return versionNumber;
}

export async function queueGithubPublication(
  draft: WebsiteStudioDraft,
  visibility: "private" | "public" = "private",
) {
  if (!draft.id) throw new Error("SAVE_PROJECT_FIRST");
  const user = await getWebsiteStudioUser();
  if (!user) throw new Error("SIGN_IN_REQUIRED");
  const manifest = buildPublicationManifest(draft);
  const { data, error } = await db
    .from("website_studio_publication_jobs")
    .insert({
      project_id: draft.id,
      requested_by: user.id,
      provider: "github",
      repository_owner: draft.github.owner || null,
      repository_name: draft.github.repository || null,
      branch: draft.github.branch || "main",
      visibility,
      status: "queued",
      generated_manifest: manifest,
      client_message:
        "Website package prepared for managed GitHub publishing through Start To Up Website Studio.",
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function listPublicationJobs(projectId: string): Promise<AnyRow[]> {
  const { data, error } = await db
    .from("website_studio_publication_jobs")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(8);
  if (error) throw error;
  return data || [];
}
