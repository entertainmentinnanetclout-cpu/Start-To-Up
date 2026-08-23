import { supabase } from "../integrations/supabase/client";
import type { Database } from "../integrations/supabase/types";

async function permanentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user || data.user.is_anonymous) throw new Error("Sign in with a full account to publish.");
  return data.user;
}

export async function publishNetworkPost(input: {
  caption: string;
  projectId?: string;
  purpose?: string;
  requestedHelp?: string;
  type?: Database["public"]["Enums"]["post_type"];
  visibility?: Database["public"]["Enums"]["visibility_level"];
}) {
  const user = await permanentUser();
  const result = await supabase
    .from("posts")
    .insert({
      author_id: user.id,
      caption: input.caption.trim(),
      project_id: input.projectId || null,
      purpose: input.purpose?.trim() || null,
      requested_help: input.requestedHelp?.trim() || null,
      post_type: input.type ?? "post",
      visibility: input.visibility ?? "community",
    })
    .select("*")
    .single();
  if (result.error) throw result.error;
  return result.data;
}

export async function createProjectMilestone(input: {
  projectId: string;
  title: string;
  description?: string;
  stage?: Database["public"]["Enums"]["project_stage"];
  visibility?: Database["public"]["Enums"]["visibility_level"];
}) {
  const user = await permanentUser();
  const result = await supabase
    .from("project_milestones")
    .insert({
      project_id: input.projectId,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      stage: input.stage,
      milestone_date: new Date().toISOString().slice(0, 10),
      created_by: user.id,
      contributor_ids: [user.id],
      visibility: input.visibility ?? "community",
    })
    .select("*")
    .single();
  if (result.error) throw result.error;

  const post = await supabase.from("posts").insert({
    author_id: user.id,
    project_id: input.projectId,
    post_type: "project_update",
    caption: `${input.title.trim()}${input.description?.trim() ? ` — ${input.description.trim()}` : ""}`,
    purpose: "Project milestone",
    visibility: input.visibility ?? "community",
  });
  if (post.error) console.warn("Milestone published without feed mirror", post.error.message);
  return result.data;
}

export async function createCollaborationRequest(input: {
  projectId: string;
  requirement: string;
  description?: string;
  skills: string[];
  isRemote: boolean;
  commitment?: string;
  compensationDisclosure?: string;
  deadline?: string;
}) {
  const user = await permanentUser();
  const result = await supabase
    .from("collaboration_requests")
    .insert({
      project_id: input.projectId,
      created_by: user.id,
      requirement: input.requirement.trim(),
      description: input.description?.trim() || null,
      skills: input.skills,
      is_remote: input.isRemote,
      commitment: input.commitment?.trim() || null,
      compensation_disclosure: input.compensationDisclosure?.trim() || null,
      deadline: input.deadline || null,
      visibility: "community",
      status: "open",
    })
    .select("*")
    .single();
  if (result.error) throw result.error;

  const post = await supabase.from("posts").insert({
    author_id: user.id,
    project_id: input.projectId,
    post_type: "collaboration_request",
    caption: input.description?.trim() || input.requirement.trim(),
    purpose: "Collaboration request",
    requested_help: input.requirement.trim(),
    visibility: "community",
  });
  if (post.error) console.warn("Collaboration request published without feed mirror", post.error.message);
  return result.data;
}
