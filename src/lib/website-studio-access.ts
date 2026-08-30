import { supabase } from "../integrations/supabase/client";

const db = supabase as any;
export type StudioAccessState = { signedIn: boolean; approved: boolean; status: "anonymous"|"pending"|"approved"|"paused"|"rejected"; isStaff: boolean };

export async function getStudioAccessState(): Promise<StudioAccessState> {
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return { signedIn: false, approved: false, status: "anonymous", isStaff: false };
  const [{ data: profile }, { data: roles }] = await Promise.all([
    db.from("profiles").select("builder_access_status").eq("id", user.id).maybeSingle(),
    db.from("user_roles").select("role").eq("user_id", user.id),
  ]);
  const roleValues = (roles || []).map((row:any)=>String(row.role));
  const isStaff = roleValues.some((role:string)=>["moderator","admin","super_admin"].includes(role));
  const raw = String(profile?.builder_access_status || "pending") as StudioAccessState["status"];
  const status: StudioAccessState["status"] = ["pending","approved","paused","rejected"].includes(raw) ? raw : "pending";
  return { signedIn: true, approved: isStaff || status === "approved", status: isStaff ? "approved" : status, isStaff };
}

export async function requestStudioAccess(reason = "Website Studio access") {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("SIGN_IN_REQUIRED");
  const { data: existing } = await db.from("website_studio_access_requests").select("id,status").eq("user_id",data.user.id).eq("request_type","builder").eq("status","pending").limit(1);
  if (existing?.length) return existing[0];
  const { data: row, error } = await db.from("website_studio_access_requests").insert({ user_id:data.user.id, request_type:"builder", status:"pending", reason }).select("*").single();
  if (error) throw error; return row;
}

export async function canExtractStudio(templateKey: string, action: "export"|"publish" = "export"): Promise<boolean> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return false;
  const result = await db.rpc("can_extract_website_studio", { target_template_key: templateKey, action_name: action });
  if (result.error) return false;
  return Boolean(result.data);
}

export async function requestTemplateEntitlement(templateKey: string, requestType: "template"|"export"|"publish" = "template", projectId?: string, reason?: string) {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("SIGN_IN_REQUIRED");
  const { data: row, error } = await db.from("website_studio_access_requests").insert({ user_id:data.user.id, request_type:requestType, template_key:templateKey, project_id:projectId || null, status:"pending", reason:reason || `Request ${requestType} access for ${templateKey}` }).select("*").single();
  if (error) throw error; return row;
}

export async function listTemplateCatalog() {
  const { data, error } = await db.from("website_studio_template_catalog").select("*").order("family").order("name");
  if (error) return [];
  return data || [];
}
