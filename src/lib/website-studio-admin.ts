import { supabase } from "../integrations/supabase/client";
const db = supabase as any;

export async function isStudioAdmin() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return false;
  const { data: rows } = await db.from("user_roles").select("role").eq("user_id",data.user.id);
  return (rows||[]).some((row:any)=>["admin","super_admin"].includes(String(row.role)));
}

export async function loadStudioAdminSnapshot() {
  if (!(await isStudioAdmin())) throw new Error("ADMIN_REQUIRED");
  const results = await Promise.allSettled([
    db.from("profiles").select("id,username,display_name,avatar_url,builder_access_status,builder_access_reason,builder_approved_at,created_at").order("created_at",{ascending:false}).limit(250),
    db.from("user_roles").select("user_id,role,created_at").order("created_at",{ascending:false}),
    db.from("website_studio_template_catalog").select("*").order("family").order("name"),
    db.from("website_studio_access_requests").select("*").order("created_at",{ascending:false}).limit(250),
    db.from("website_studio_user_entitlements").select("*").order("updated_at",{ascending:false}).limit(500),
    db.from("website_studio_projects").select("id,owner_id,project_name,business_name,template_key,status,deployment_url,updated_at").order("updated_at",{ascending:false}).limit(250),
    db.from("website_studio_publication_jobs").select("id,project_id,requested_by,provider,status,client_message,created_at,updated_at").order("created_at",{ascending:false}).limit(150),
    db.from("feature_flags").select("*").order("flag_key"),
  ]);
  const value=(index:number)=>results[index].status==="fulfilled"?((results[index] as PromiseFulfilledResult<any>).value?.data||[]):[];
  return { users:value(0),roles:value(1),templates:value(2),requests:value(3),entitlements:value(4),projects:value(5),publicationJobs:value(6),featureFlags:value(7) };
}

export async function setStudioUserAccess(userId:string,status:"pending"|"approved"|"paused"|"rejected",reason?:string){
  const { error }=await db.rpc("admin_set_studio_user_access",{target_user:userId,new_status:status,reason_text:reason||null});if(error)throw error;
}
export async function setStudioTemplate(input:{templateKey:string;visible:boolean;accessType:"free"|"paid"|"private";priceCents:number|null;currency:string;approvalRequired:boolean}){
  const { error }=await db.rpc("admin_set_studio_template",{target_key:input.templateKey,visible_value:input.visible,access_value:input.accessType,price_value:input.priceCents,currency_value:input.currency,approval_value:input.approvalRequired});if(error)throw error;
}
export async function grantStudioEntitlement(userId:string,templateKey:string,canExport=true,canPublish=true,notes?:string){
  const { error }=await db.rpc("admin_grant_studio_entitlement",{target_user:userId,target_template:templateKey,export_value:canExport,publish_value:canPublish,notes_value:notes||null});if(error)throw error;
}
export async function revokeStudioEntitlement(userId:string,templateKey:string){
  const { error }=await db.rpc("admin_revoke_studio_entitlement",{target_user:userId,target_template:templateKey});if(error)throw error;
}
export async function decideStudioRequest(request:any,decision:"approved"|"rejected",notes?:string){
  if (!(await isStudioAdmin())) throw new Error("ADMIN_REQUIRED");
  if(decision==="approved"){
    if(request.request_type==="builder") await setStudioUserAccess(request.user_id,"approved",notes||"Approved from Studio Control");
    if(["template","export","publish"].includes(request.request_type)&&request.template_key) await grantStudioEntitlement(request.user_id,request.template_key,true,request.request_type==="publish",notes);
  }
  const { error }=await db.from("website_studio_access_requests").update({status:decision,decision_notes:notes||null,decided_at:new Date().toISOString()}).eq("id",request.id);if(error)throw error;
}
