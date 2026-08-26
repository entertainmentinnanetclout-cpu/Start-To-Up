import { supabase } from "../integrations/supabase/client";
import { getWebsiteStudioUser } from "./website-studio-data";
import { ensureStudioV6Draft, type StudioAuditResult, type StudioV6Config, type StudioV6Draft, type StudioV6Form, type StudioV6IndustryRecord, type StudioV6Page, type StudioV6Section } from "./website-studio-v6";

const db = supabase as any;
type AnyRow = Record<string, any>;

async function userRequired() {
  const user = await getWebsiteStudioUser();
  if (!user) throw new Error("SIGN_IN_REQUIRED");
  return user;
}

export async function saveStudioV6Settings(projectId: string, config: StudioV6Config) {
  await userRequired();
  const { data: row, error: readError } = await db.from("website_studio_projects").select("settings_config").eq("id", projectId).single();
  if (readError) throw readError;
  const { error } = await db.from("website_studio_projects").update({ settings_config: { ...(row?.settings_config || {}), studioV6: config }, updated_at: new Date().toISOString() }).eq("id", projectId);
  if (error) throw error;
  return config;
}

export async function loadStudioV6Settings(projectId: string, fallback: StudioV6Draft) {
  await userRequired();
  const { data, error } = await db.from("website_studio_projects").select("settings_config,default_locale,timezone").eq("id", projectId).single();
  if (error) throw error;
  return ensureStudioV6Draft({ ...fallback, studioV6: data?.settings_config?.studioV6 || fallback.studioV6 } as StudioV6Draft);
}

export async function syncStudioV6PageGraph(projectId: string, pages: StudioV6Page[]) {
  const user = await userRequired();
  const saved: StudioV6Page[] = [];
  for (const page of pages.sort((a,b) => a.order - b.order)) {
    const pagePayload = { project_id: projectId, slug: page.slug, title: page.title, page_type: page.type, sort_order: page.order, is_home: page.slug === "/", is_published: page.visible, seo_config: page.seo, responsive_config: {}, created_by: user.id, updated_at: new Date().toISOString() };
    const { data: pageRow, error: pageError } = await db.from("website_studio_pages").upsert(pagePayload, { onConflict: "project_id,slug" }).select("*").single();
    if (pageError) throw pageError;
    const sectionRows: StudioV6Section[] = [];
    for (const section of page.sections.sort((a,b) => a.order - b.order)) {
      const payload = { project_id: projectId, page_id: pageRow.id, section_key: section.key, section_type: section.type, sort_order: section.order, content: { ...section.content, title: section.title, columns: section.columns }, style_config: section.style, responsive_config: section.responsive, locked: Boolean(section.locked), visibility: "visible", created_by: user.id, updated_at: new Date().toISOString() };
      const { data: sectionRow, error: sectionError } = await db.from("website_studio_sections").upsert(payload, { onConflict: "page_id,section_key" }).select("*").single();
      if (sectionError) throw sectionError;
      sectionRows.push({ ...section, id: sectionRow.id });
    }
    saved.push({ ...page, id: pageRow.id, sections: sectionRows });
  }
  return saved;
}

export async function listStudioV6Pages(projectId: string): Promise<StudioV6Page[]> {
  const { data: pages, error } = await db.from("website_studio_pages").select("*").eq("project_id", projectId).order("sort_order");
  if (error) throw error;
  const result: StudioV6Page[] = [];
  for (const pageRow of pages || []) {
    const { data: sections, error: sectionError } = await db.from("website_studio_sections").select("*").eq("page_id", pageRow.id).order("sort_order");
    if (sectionError) throw sectionError;
    result.push({
      id: pageRow.id, slug: pageRow.slug, title: pageRow.title, type: pageRow.page_type, order: pageRow.sort_order, visible: pageRow.is_published,
      seo: { title: pageRow.seo_config?.title || pageRow.title, description: pageRow.seo_config?.description || "", canonical: pageRow.seo_config?.canonical || "", ogImageUrl: pageRow.seo_config?.ogImageUrl || "", noIndex: Boolean(pageRow.seo_config?.noIndex), schemaType: pageRow.seo_config?.schemaType || "WebPage" },
      sections: (sections || []).map((row: AnyRow) => ({ id: row.id, key: row.section_key, type: row.section_type, title: row.content?.title || row.section_type, order: row.sort_order, columns: Number(row.content?.columns || 1), content: row.content || {}, style: row.style_config || {}, responsive: row.responsive_config || {}, locked: Boolean(row.locked) })),
    });
  }
  return result;
}

export async function deleteStudioPage(projectId: string, pageId: string) {
  await userRequired();
  const { error } = await db.from("website_studio_pages").delete().eq("project_id", projectId).eq("id", pageId);
  if (error) throw error;
}

export async function listBrandKits() {
  await userRequired();
  const { data, error } = await db.from("website_studio_brand_kits").select("*").order("updated_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function saveBrandKit(name: string, tokens: Record<string, unknown>, media: Record<string, unknown>, id?: string) {
  const user = await userRequired();
  const payload = { owner_id: user.id, name, tokens, media, updated_at: new Date().toISOString() };
  const result = id ? await db.from("website_studio_brand_kits").update(payload).eq("id", id).select("*").single() : await db.from("website_studio_brand_kits").insert(payload).select("*").single();
  if (result.error) throw result.error;
  return result.data;
}

export async function listIndustryRecords(projectId: string, moduleType?: string): Promise<StudioV6IndustryRecord[]> {
  let query = db.from("website_studio_industry_records").select("*").eq("project_id", projectId).order("sort_order");
  if (moduleType) query = query.eq("module_type", moduleType);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map((row: AnyRow) => ({ id: row.id, moduleType: row.module_type, title: row.title, slug: row.slug, status: row.status, data: row.data || {}, media: row.media || [] }));
}

export async function saveIndustryRecord(projectId: string, record: StudioV6IndustryRecord, order = 0) {
  const user = await userRequired();
  const payload = { project_id: projectId, module_type: record.moduleType, record_key: record.id || record.slug, title: record.title, slug: record.slug, status: record.status, sort_order: order, data: record.data, media: record.media, created_by: user.id, updated_at: new Date().toISOString() };
  const { data, error } = await db.from("website_studio_industry_records").upsert(payload, { onConflict: "project_id,module_type,record_key" }).select("*").single();
  if (error) throw error;
  return data;
}

export async function deleteIndustryRecord(projectId: string, id: string) {
  await userRequired(); const { error } = await db.from("website_studio_industry_records").delete().eq("project_id", projectId).eq("id", id); if (error) throw error;
}

export async function listStudioVersions(projectId: string) {
  const { data, error } = await db.from("website_studio_versions").select("*").eq("project_id", projectId).order("version_number", { ascending: false }).limit(50);
  if (error) throw error; return data || [];
}

export async function createNamedStudioVersion(draft: StudioV6Draft, name: string, description = "", isAuto = false) {
  if (!draft.id) throw new Error("SAVE_PROJECT_FIRST");
  const user = await userRequired();
  const { data: latest } = await db.from("website_studio_versions").select("id,version_number").eq("project_id", draft.id).order("version_number", { ascending: false }).limit(1);
  const next = Number(latest?.[0]?.version_number || 0) + 1;
  const { data, error } = await db.from("website_studio_versions").insert({ project_id: draft.id, version_number: next, snapshot: draft, created_by: user.id, name: name || `Version ${next}`, description, is_auto: isAuto, parent_version_id: latest?.[0]?.id || null }).select("*").single();
  if (error) throw error; return data;
}

export function restoreStudioVersion(row: AnyRow): StudioV6Draft { return ensureStudioV6Draft(row.snapshot as StudioV6Draft); }

export async function listCollaborators(projectId: string) { const { data, error } = await db.from("website_studio_collaborators").select("*").eq("project_id", projectId).order("created_at"); if (error) throw error; return data || []; }
export async function inviteCollaborator(projectId: string, email: string, role: string) { const user=await userRequired(); const { data,error }=await db.from("website_studio_collaborators").insert({ project_id:projectId, invited_email:email.toLowerCase().trim(), role, status:"pending", invited_by:user.id }).select("*").single(); if(error) throw error; return data; }
export async function updateCollaborator(id: string, role: string, status = "active") { await userRequired(); const { data,error }=await db.from("website_studio_collaborators").update({ role,status,updated_at:new Date().toISOString() }).eq("id",id).select("*").single(); if(error) throw error; return data; }

export async function listStudioComments(projectId: string) { const { data,error }=await db.from("website_studio_comments").select("*").eq("project_id",projectId).order("created_at",{ascending:false}); if(error) throw error; return data||[]; }
export async function addStudioComment(projectId: string, body: string, pageId?: string, sectionId?: string) { const user=await userRequired(); const { data,error }=await db.from("website_studio_comments").insert({ project_id:projectId, page_id:pageId||null, section_id:sectionId||null, author_id:user.id, body }).select("*").single(); if(error) throw error; return data; }
export async function resolveStudioComment(id: string) { const user=await userRequired(); const { data,error }=await db.from("website_studio_comments").update({ status:"resolved", resolved_by:user.id, resolved_at:new Date().toISOString() }).eq("id",id).select("*").single(); if(error) throw error; return data; }

export async function listApprovals(projectId:string){const{data,error}=await db.from("website_studio_approvals").select("*").eq("project_id",projectId).order("created_at",{ascending:false});if(error)throw error;return data||[];}
export async function submitApproval(projectId:string,status:"approved"|"changes_requested"|"pending",message:string,versionId?:string){const user=await userRequired();const{data,error}=await db.from("website_studio_approvals").insert({project_id:projectId,version_id:versionId||null,reviewer_id:user.id,status,message}).select("*").single();if(error)throw error;return data;}

export async function saveStudioAudit(projectId: string, result: StudioAuditResult) { const user=await userRequired(); const { data,error }=await db.from("website_studio_audits").insert({ project_id:projectId,audit_type:result.type,score:result.score,findings:result.findings,created_by:user.id }).select("*").single(); if(error)throw error; return data; }
export async function listStudioAudits(projectId:string){const{data,error}=await db.from("website_studio_audits").select("*").eq("project_id",projectId).order("created_at",{ascending:false}).limit(30);if(error)throw error;return data||[];}

export async function listDomains(projectId:string){const{data,error}=await db.from("website_studio_domains").select("*").eq("project_id",projectId).order("created_at");if(error)throw error;return data||[];}
export async function saveDomain(projectId:string,hostname:string,environment:"staging"|"production"="production"){const user=await userRequired();const{data,error}=await db.from("website_studio_domains").upsert({project_id:projectId,hostname:hostname.toLowerCase().trim(),environment,created_by:user.id,updated_at:new Date().toISOString()},{onConflict:"project_id,hostname"}).select("*").single();if(error)throw error;return data;}
export async function runDomainOperation(projectId:string,domainId:string,action:"connect"|"check"|"remove"){const{data,error}=await supabase.functions.invoke("website-studio-domain",{body:{projectId,domainId,action}});if(error)throw error;return data;}

export async function listForms(projectId:string){const{data,error}=await db.from("website_studio_forms").select("*").eq("project_id",projectId).order("created_at");if(error)throw error;return data||[];}
export async function saveForm(projectId:string,form:StudioV6Form){const user=await userRequired();const payload={project_id:projectId,name:form.name,slug:form.slug,fields:form.fields,settings:form.settings,spam_config:form.spam,autoresponder_config:form.autoresponder,created_by:user.id,updated_at:new Date().toISOString()};const{data,error}=await db.from("website_studio_forms").upsert(payload,{onConflict:"project_id,slug"}).select("*").single();if(error)throw error;return data;}
export async function listFormSubmissions(projectId:string){const{data,error}=await db.from("website_studio_form_submissions").select("*").eq("project_id",projectId).order("created_at",{ascending:false}).limit(500);if(error)throw error;return data||[];}
export async function updateSubmission(id:string,status:string,tags:string[]){await userRequired();const{data,error}=await db.from("website_studio_form_submissions").update({status,tags}).eq("id",id).select("*").single();if(error)throw error;return data;}

export async function listBookings(projectId:string){const{data,error}=await db.from("website_studio_bookings").select("*").eq("project_id",projectId).order("start_at",{ascending:false}).limit(500);if(error)throw error;return data||[];}
export async function listPayments(projectId:string){const{data,error}=await db.from("website_studio_payments").select("*").eq("project_id",projectId).order("created_at",{ascending:false}).limit(500);if(error)throw error;return data||[];}

export async function analyticsSummary(projectId:string,days=30){
  const since=new Date(Date.now()-days*86400000).toISOString();
  const{data,error}=await db.from("website_studio_analytics_events").select("event_type,page_path,session_id,device,campaign,occurred_at").eq("project_id",projectId).gte("occurred_at",since).limit(10000);if(error)throw error;
  const rows=data||[];const sessions=new Set(rows.map((row:AnyRow)=>row.session_id).filter(Boolean));const pageViews=rows.filter((row:AnyRow)=>row.event_type==="page_view");const conversions=rows.filter((row:AnyRow)=>["form_submit","booking_submit","checkout_start","cta_click"].includes(row.event_type));
  const pages=Object.entries(pageViews.reduce((acc:Record<string,number>,row:AnyRow)=>{acc[row.page_path]=(acc[row.page_path]||0)+1;return acc;},{})).sort((a,b)=>b[1]-a[1]).slice(0,10);
  const devices=rows.reduce((acc:Record<string,number>,row:AnyRow)=>{const key=row.device?.type||"unknown";acc[key]=(acc[key]||0)+1;return acc;},{});
  return{events:rows.length,sessions:sessions.size,pageViews:pageViews.length,conversions:conversions.length,conversionRate:sessions.size?Math.round(conversions.length/sessions.size*1000)/10:0,pages,devices};
}

export async function createImportJob(projectId:string,sourceType:string,sourceUrl:string,config:Record<string,unknown>={}){const user=await userRequired();const{data,error}=await db.from("website_studio_import_jobs").insert({project_id:projectId,source_type:sourceType,source_url:sourceUrl||null,config,requested_by:user.id}).select("*").single();if(error)throw error;return data;}
export async function runImportJob(jobId:string){const{data,error}=await supabase.functions.invoke("website-studio-import",{body:{jobId}});if(error)throw error;return data;}
export async function listImportJobs(projectId:string){const{data,error}=await db.from("website_studio_import_jobs").select("*").eq("project_id",projectId).order("created_at",{ascending:false});if(error)throw error;return data||[];}

export async function listSavedSections(){const user=await userRequired();const{data,error}=await db.from("website_studio_saved_sections").select("*").or(`owner_id.eq.${user.id},is_global.eq.true`).order("updated_at",{ascending:false});if(error)throw error;return data||[];}
export async function saveReusableSection(section:StudioV6Section,name:string,structuralFamily:string){const user=await userRequired();const{data,error}=await db.from("website_studio_saved_sections").insert({owner_id:user.id,name,section_type:section.type,structural_family:structuralFamily,content:{...section.content,title:section.title,columns:section.columns},style_config:section.style,responsive_config:section.responsive}).select("*").single();if(error)throw error;return data;}

export async function listFidelityRuns(projectId:string){const{data,error}=await db.from("website_studio_fidelity_runs").select("*").eq("project_id",projectId).order("created_at",{ascending:false}).limit(30);if(error)throw error;return data||[];}
export async function recordFidelityRun(projectId:string,templateKey:string,device:string,score:number,status:string,metrics:Record<string,unknown>={}){const user=await userRequired();const{data,error}=await db.from("website_studio_fidelity_runs").insert({project_id:projectId,template_key:templateKey,device,score,status,metrics,created_by:user.id}).select("*").single();if(error)throw error;return data;}

export async function createAssistantThread(projectId:string,title="Builder chat"){const user=await userRequired();const{data,error}=await db.from("website_studio_assistant_threads").insert({project_id:projectId,created_by:user.id,title,mode:"deterministic"}).select("*").single();if(error)throw error;return data;}
export async function listAssistantMessages(projectId:string,threadId?:string){let query=db.from("website_studio_assistant_messages").select("*").eq("project_id",projectId).order("created_at");if(threadId)query=query.eq("thread_id",threadId);const{data,error}=await query;if(error)throw error;return data||[];}
export async function saveAssistantMessage(projectId:string,threadId:string,role:"user"|"assistant"|"system",content:string,parsedIntent:Record<string,unknown>={},appliedPatch:Record<string,unknown>={}){const user=await userRequired();const{data,error}=await db.from("website_studio_assistant_messages").insert({project_id:projectId,thread_id:threadId,role,content,parsed_intent:parsedIntent,applied_patch:appliedPatch,created_by:user.id}).select("*").single();if(error)throw error;return data;}

export async function runAdminAssetSync(templateKey?:string,repair=true){const{data,error}=await supabase.functions.invoke("website-studio-admin-asset-sync",{body:{templateKey,repair}});if(error)throw error;return data;}
export async function listAssetSyncManifest(){const{data,error}=await db.from("website_studio_asset_sync_manifest").select("*").order("template_key").order("asset_key");if(error)throw error;return data||[];}
