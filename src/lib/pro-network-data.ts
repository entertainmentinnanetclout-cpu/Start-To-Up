import { useCallback, useEffect, useState } from "react";
import { supabase } from "../integrations/supabase/client";
import type { Database, Json } from "../integrations/supabase/types";

type Tables = Database["public"]["Tables"];
type BaseMedia = Tables["network_media_items"]["Row"];
type BaseWorkspace = Tables["collaboration_workspaces"]["Row"];
export type Project = Tables["projects"]["Row"];
export type LiveEvent = Tables["live_events"]["Row"];

export type ProfessionalMediaItem = BaseMedia & {
  creator_id: string | null;
  project_id: string | null;
  live_event_id: string | null;
  source_media_id: string | null;
  credibility_score: number;
  safety_score: number;
  stream_state: "vod" | "scheduled" | "live" | "ended";
  captions_url: string | null;
  allow_collaboration: boolean;
  aspect_ratio: "9:16" | "16:9" | "1:1" | "4:5";
};

export type ProfessionalWorkspace = Omit<BaseWorkspace, "showcase_id"> & {
  showcase_id: string | null;
  project_id: string | null;
  created_by: string | null;
};

export type WorkspaceMember = {
  workspace_id: string;
  user_id: string;
  role_title: string;
  status: "requested" | "invited" | "active" | "removed";
  application_note: string | null;
  can_manage: boolean;
  can_edit: boolean;
  requested_at: string;
  joined_at: string | null;
  created_at: string;
  updated_at: string;
};

export type WorkspaceMessage = {
  id: string;
  workspace_id: string;
  author_id: string;
  parent_id: string | null;
  body: string;
  created_at: string;
  updated_at: string;
};

export type WorkspaceTask = {
  id: string;
  workspace_id: string;
  title: string;
  description: string | null;
  status: "open" | "in_progress" | "review" | "done" | "blocked";
  priority: "low" | "normal" | "high" | "critical";
  assignee_id: string | null;
  created_by: string;
  due_at: string | null;
  created_at: string;
  updated_at: string;
};

export type WorkspaceFile = {
  id: string;
  workspace_id: string;
  title: string;
  storage_path: string;
  mime_type: string | null;
  file_size: number | null;
  version: number;
  uploaded_by: string;
  created_at: string;
};

export type WorkspaceDecision = {
  id: string;
  workspace_id: string;
  title: string;
  proposal: string;
  outcome: string | null;
  status: "proposed" | "approved" | "rejected" | "superseded";
  proposed_by: string;
  decided_by: string | null;
  decided_at: string | null;
  created_at: string;
  updated_at: string;
};

export type WorkspaceUpdate = {
  id: string;
  workspace_id: string;
  author_id: string;
  body: string;
  progress_percent: number | null;
  milestone_label: string | null;
  created_at: string;
  updated_at: string;
};

type LiveState<T> = { data: T; loading: boolean; error: string | null };

export type WorkspaceRoomData = {
  members: WorkspaceMember[];
  messages: WorkspaceMessage[];
  tasks: WorkspaceTask[];
  files: WorkspaceFile[];
  decisions: WorkspaceDecision[];
  updates: WorkspaceUpdate[];
};

const emptyRoom: WorkspaceRoomData = {
  members: [],
  messages: [],
  tasks: [],
  files: [],
  decisions: [],
  updates: [],
};

const db = supabase as any;

function cleanError(error: unknown) {
  return error instanceof Error ? error.message : "This action could not be completed.";
}

async function permanentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user || data.user.is_anonymous) throw new Error("Sign in with a full account to continue.");
  return data.user;
}

function sessionKey() {
  if (typeof window === "undefined") return null;
  const key = "stu-media-session";
  const current = window.sessionStorage.getItem(key);
  if (current) return current;
  const next = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : null;
  if (next) window.sessionStorage.setItem(key, next);
  return next;
}

export function useProfessionalMediaFeed(audienceTags: string[]) {
  const audienceKey = audienceTags.join(",");
  const [state, setState] = useState<LiveState<ProfessionalMediaItem[]>>({
    data: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let active = true;
    setState((current) => ({ ...current, loading: true, error: null }));
    const tags = audienceKey ? audienceKey.split(",") : [];
    void db
      .rpc("ranked_media_feed", { audience_tags: tags, result_limit: 30 })
      .then(({ data, error }: { data: ProfessionalMediaItem[] | null; error: { message: string } | null }) => {
        if (active) setState({ data: data ?? [], loading: false, error: error?.message ?? null });
      })
      .catch((error: unknown) => {
        if (active) setState({ data: [], loading: false, error: cleanError(error) });
      });
    return () => {
      active = false;
    };
  }, [audienceKey]);

  return state;
}

export async function recordMediaSignal(
  mediaId: string,
  eventKind:
    | "impression"
    | "play"
    | "watch"
    | "complete"
    | "rewatch"
    | "support"
    | "save"
    | "share"
    | "comment"
    | "collaboration_enter"
    | "follow"
    | "skip"
    | "hide"
    | "report",
  context: Record<string, Json | undefined> = {},
) {
  const { data } = await supabase.auth.getSession();
  if (!data.session?.user || data.session.user.is_anonymous) return false;
  const payload = Object.fromEntries(Object.entries(context).filter(([, value]) => value !== undefined));
  const result = await db.rpc("record_media_signal", {
    media_id: mediaId,
    event_kind: eventKind,
    session_key: sessionKey(),
    event_context: payload,
  });
  if (result.error) throw result.error;
  return Boolean(result.data);
}

export function useLiveStudioEvents() {
  const [state, setState] = useState<LiveState<LiveEvent[]>>({ data: [], loading: true, error: null });
  useEffect(() => {
    let active = true;
    void supabase
      .from("live_events")
      .select("*")
      .in("status", ["scheduled", "live", "ended"])
      .order("starts_at", { ascending: true })
      .limit(12)
      .then(({ data, error }) => {
        if (active) setState({ data: data ?? [], loading: false, error: error?.message ?? null });
      });
    return () => {
      active = false;
    };
  }, []);
  return state;
}

export function useProfessionalWorkspaces() {
  const [state, setState] = useState<LiveState<ProfessionalWorkspace[]>>({
    data: [],
    loading: true,
    error: null,
  });
  useEffect(() => {
    let active = true;
    void db
      .from("collaboration_workspaces")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30)
      .then(({ data, error }: { data: ProfessionalWorkspace[] | null; error: { message: string } | null }) => {
        if (active) setState({ data: data ?? [], loading: false, error: error?.message ?? null });
      });
    return () => {
      active = false;
    };
  }, []);
  return state;
}

export function useWorkspaceMemberships(userId?: string) {
  const [state, setState] = useState<LiveState<WorkspaceMember[]>>({
    data: [],
    loading: Boolean(userId),
    error: null,
  });
  useEffect(() => {
    if (!userId) {
      setState({ data: [], loading: false, error: null });
      return;
    }
    let active = true;
    void db
      .from("collaboration_workspace_members")
      .select("*")
      .eq("user_id", userId)
      .then(({ data, error }: { data: WorkspaceMember[] | null; error: { message: string } | null }) => {
        if (active) setState({ data: data ?? [], loading: false, error: error?.message ?? null });
      });
    return () => {
      active = false;
    };
  }, [userId]);
  return state;
}

export function useWorkspaceRoom(workspaceId: string, enabled: boolean, refreshKey = 0) {
  const [state, setState] = useState<LiveState<WorkspaceRoomData>>({
    data: emptyRoom,
    loading: enabled,
    error: null,
  });

  useEffect(() => {
    if (!enabled) {
      setState({ data: emptyRoom, loading: false, error: null });
      return;
    }
    let active = true;
    setState((current) => ({ ...current, loading: true, error: null }));
    void Promise.all([
      db.from("collaboration_workspace_members").select("*").eq("workspace_id", workspaceId).eq("status", "active").order("joined_at"),
      db.from("collaboration_workspace_messages").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: false }).limit(80),
      db.from("collaboration_workspace_tasks").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: false }).limit(80),
      db.from("collaboration_workspace_files").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: false }).limit(80),
      db.from("collaboration_workspace_decisions").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: false }).limit(80),
      db.from("collaboration_workspace_updates").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: false }).limit(80),
    ])
      .then(([members, messages, tasks, files, decisions, updates]) => {
        const error = members.error ?? messages.error ?? tasks.error ?? files.error ?? decisions.error ?? updates.error;
        if (!active) return;
        setState({
          data: {
            members: members.data ?? [],
            messages: messages.data ?? [],
            tasks: tasks.data ?? [],
            files: files.data ?? [],
            decisions: decisions.data ?? [],
            updates: updates.data ?? [],
          },
          loading: false,
          error: error?.message ?? null,
        });
      })
      .catch((error: unknown) => {
        if (active) setState({ data: emptyRoom, loading: false, error: cleanError(error) });
      });
    return () => {
      active = false;
    };
  }, [workspaceId, enabled, refreshKey]);

  return state;
}

async function guestAction(body: {
  captchaToken: string;
  targetId: string;
  contactEmail: string;
  message: string;
}) {
  const { data, error } = await supabase.functions.invoke("guest-action-submit", {
    body: { ...body, actionType: "collaboration_interest" },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function requestWorkspaceAccess(
  workspaceId: string,
  message: string,
  email: string,
  captchaToken: string,
) {
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  if (user && !user.is_anonymous) {
    const result = await db.rpc("request_workspace_access", {
      _workspace_id: workspaceId,
      _application_note: message,
    });
    if (result.error) throw result.error;
    return result.data;
  }
  return guestAction({ captchaToken, targetId: workspaceId, contactEmail: email, message });
}

export async function postWorkspaceMessage(workspaceId: string, body: string) {
  const user = await permanentUser();
  const { error } = await db.from("collaboration_workspace_messages").insert({
    workspace_id: workspaceId,
    author_id: user.id,
    body: body.trim(),
  });
  if (error) throw error;
}

export async function createWorkspaceTask(
  workspaceId: string,
  title: string,
  description: string,
  priority: WorkspaceTask["priority"] = "normal",
) {
  const user = await permanentUser();
  const { error } = await db.from("collaboration_workspace_tasks").insert({
    workspace_id: workspaceId,
    created_by: user.id,
    title: title.trim(),
    description: description.trim() || null,
    priority,
  });
  if (error) throw error;
}

export async function updateWorkspaceTaskStatus(workspaceId: string, taskId: string, status: WorkspaceTask["status"]) {
  await permanentUser();
  const { error } = await db
    .from("collaboration_workspace_tasks")
    .update({ status })
    .eq("id", taskId)
    .eq("workspace_id", workspaceId);
  if (error) throw error;
}

export async function uploadWorkspaceFile(workspaceId: string, file: File) {
  const user = await permanentUser();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-120);
  const path = `${workspaceId}/${user.id}/${crypto.randomUUID()}-${safeName}`;
  const upload = await supabase.storage.from("collaboration-files").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });
  if (upload.error) throw upload.error;
  const { error } = await db.from("collaboration_workspace_files").insert({
    workspace_id: workspaceId,
    title: file.name,
    storage_path: path,
    mime_type: file.type || null,
    file_size: file.size,
    uploaded_by: user.id,
  });
  if (error) {
    await supabase.storage.from("collaboration-files").remove([path]);
    throw error;
  }
}

export async function getWorkspaceFileUrl(path: string) {
  const { data, error } = await supabase.storage.from("collaboration-files").createSignedUrl(path, 300);
  if (error) throw error;
  return data.signedUrl;
}

export async function proposeWorkspaceDecision(workspaceId: string, title: string, proposal: string) {
  const user = await permanentUser();
  const { error } = await db.from("collaboration_workspace_decisions").insert({
    workspace_id: workspaceId,
    title: title.trim(),
    proposal: proposal.trim(),
    proposed_by: user.id,
  });
  if (error) throw error;
}

export async function postWorkspaceUpdate(
  workspaceId: string,
  body: string,
  progressPercent?: number,
  milestoneLabel?: string,
) {
  const user = await permanentUser();
  const { error } = await db.from("collaboration_workspace_updates").insert({
    workspace_id: workspaceId,
    author_id: user.id,
    body: body.trim(),
    progress_percent: progressPercent ?? null,
    milestone_label: milestoneLabel?.trim() || null,
  });
  if (error) throw error;
}

export function useOwnProjects(userId?: string) {
  const [state, setState] = useState<LiveState<Project[]>>({ data: [], loading: Boolean(userId), error: null });
  useEffect(() => {
    if (!userId) {
      setState({ data: [], loading: false, error: null });
      return;
    }
    let active = true;
    void supabase
      .from("projects")
      .select("*")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (active) setState({ data: data ?? [], loading: false, error: error?.message ?? null });
      });
    return () => {
      active = false;
    };
  }, [userId]);
  return state;
}

export type CreateProjectInput = {
  name: string;
  pitch: string;
  problem: string;
  solution: string;
  technologies: string[];
  requiredSkills: string[];
  stage: Database["public"]["Enums"]["project_stage"];
  repositoryUrl?: string;
  demoUrl?: string;
  websiteUrl?: string;
  seekingFunding: boolean;
  visibility: Database["public"]["Enums"]["visibility_level"];
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 55);
}

export async function createProjectWithWorkspace(input: CreateProjectInput) {
  const user = await permanentUser();
  const profile = await supabase.from("profiles").select("display_name,username").eq("id", user.id).single();
  if (profile.error) throw profile.error;
  const suffix = crypto.randomUUID().slice(0, 8);
  const slug = `${slugify(input.name) || "project"}-${suffix}`;
  const project = await supabase
    .from("projects")
    .insert({
      owner_id: user.id,
      name: input.name.trim(),
      slug,
      pitch: input.pitch.trim(),
      problem: input.problem.trim() || null,
      solution: input.solution.trim() || null,
      technologies: input.technologies,
      required_skills: input.requiredSkills,
      stage: input.stage,
      repository_url: input.repositoryUrl?.trim() || null,
      demo_url: input.demoUrl?.trim() || null,
      website_url: input.websiteUrl?.trim() || null,
      seeking_collaborators: true,
      seeking_funding: input.seekingFunding,
      visibility: input.visibility,
      ownership_declaration: "Project ownership is declared by the publishing member; contributions are attributed through the project room.",
    })
    .select("*")
    .single();
  if (project.error) throw project.error;

  const ownerName = profile.data.display_name || profile.data.username;
  const workstreams = [
    {
      name: "Core product build",
      lead: ownerName,
      status: "Active",
      needs: input.technologies.length ? input.technologies : ["Product execution", "Technical delivery"],
    },
    {
      name: "Open collaboration",
      lead: ownerName,
      status: "Open",
      needs: input.requiredSkills.length ? input.requiredSkills : ["Contributors", "Domain expertise", "Testing partners"],
    },
  ];

  const workspace = await db
    .from("collaboration_workspaces")
    .insert({
      showcase_id: null,
      project_id: project.data.id,
      created_by: user.id,
      slug: `${slug}-room`,
      name: `${input.name.trim()} Build Room`,
      summary: input.pitch.trim(),
      status: "open",
      owner_name: ownerName,
      collaboration_modes: ["Technical contribution", "Product collaboration", "Mentorship", "Institutional support", "Investment conversation"],
      workstreams,
      operating_principles: [
        "Keep project work inside the room by default",
        "Record decisions and contributor ownership",
        "Protect confidential material",
        "Use scoped tasks, files and milestones",
      ],
      current_focus: input.requiredSkills.length ? `Recruit: ${input.requiredSkills.slice(0, 3).join(", ")}` : "Form the first delivery team.",
      is_public: input.visibility === "public" || input.visibility === "community",
    })
    .select("*")
    .single();

  if (workspace.error) {
    await supabase.from("projects").delete().eq("id", project.data.id);
    throw workspace.error;
  }

  const member = await db.from("collaboration_workspace_members").insert({
    workspace_id: workspace.data.id,
    user_id: user.id,
    role_title: "Project owner",
    status: "active",
    can_manage: true,
    can_edit: true,
    joined_at: new Date().toISOString(),
  });
  if (member.error) throw member.error;

  return { project: project.data as Project, workspace: workspace.data as ProfessionalWorkspace };
}

export type PublishBuildReelInput = {
  title: string;
  caption: string;
  projectId?: string;
  topics: string[];
  audiences: string[];
  file: File;
  durationSeconds?: number;
};

export async function publishBuildReel(input: PublishBuildReelInput) {
  const user = await permanentUser();
  const safeName = input.file.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-120);
  const path = `${user.id}/${crypto.randomUUID()}-${safeName}`;
  const upload = await supabase.storage.from("network-media").upload(path, input.file, {
    cacheControl: "31536000",
    upsert: false,
    contentType: input.file.type || undefined,
  });
  if (upload.error) throw upload.error;
  const publicUrl = supabase.storage.from("network-media").getPublicUrl(path).data.publicUrl;
  const result = await db.rpc("publish_build_reel", {
    _project_id: input.projectId || null,
    _title: input.title.trim(),
    _caption: input.caption.trim(),
    _storage_path: path,
    _playback_url: publicUrl,
    _poster_url: null,
    _duration_seconds: input.durationSeconds ?? null,
    _topic_tags: input.topics,
    _audience_tags: input.audiences,
  });
  if (result.error) {
    await supabase.storage.from("network-media").remove([path]);
    throw result.error;
  }
  return result.data as string;
}

export async function scheduleLiveEvent(input: {
  title: string;
  summary: string;
  startsAt: string;
  provider?: string;
  publicLandingUrl?: string;
  protectedJoinUrl?: string;
}) {
  const user = await permanentUser();
  const result = await supabase
    .from("live_events")
    .insert({
      host_id: user.id,
      title: input.title.trim(),
      summary: input.summary.trim(),
      starts_at: new Date(input.startsAt).toISOString(),
      provider: input.provider?.trim() || "start-to-up-studio",
      public_landing_url: input.publicLandingUrl?.trim() || "/app/media",
      protected_join_url: input.protectedJoinUrl?.trim() || null,
      status: "scheduled",
    })
    .select("*")
    .single();
  if (result.error) throw result.error;
  return result.data;
}

export function useRefreshToken() {
  const [token, setToken] = useState(0);
  const refresh = useCallback(() => setToken((current) => current + 1), []);
  return { token, refresh };
}
