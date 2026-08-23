import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { supabase } from "../integrations/supabase/client";
import type { Database } from "../integrations/supabase/types";

type Tables = Database["public"]["Tables"];
export type Profile = Tables["profiles"]["Row"];
export type Project = Tables["projects"]["Row"];
export type CollaborationRequest = Tables["collaboration_requests"]["Row"];
export type Conversation = Tables["conversations"]["Row"];
export type Notification = Tables["notifications"]["Row"];
export type Organization = Tables["organizations"]["Row"];
export type ExpertSession = Tables["expert_sessions"]["Row"];
export type VerificationRequest = Tables["verification_requests"]["Row"];
export type AccessRequest = Tables["protected_access_requests"]["Row"];
export type EvidenceEvent = Tables["evidence_events"]["Row"];
export type ContentReport = Tables["content_reports"]["Row"];
export type MediaPublication = Tables["media_publications"]["Row"];
export type LiveEvent = Tables["live_events"]["Row"];
export type EcosystemProgram = Tables["ecosystem_programs"]["Row"];
export type PlatformPlan = Tables["platform_plans"]["Row"];

type LiveState<T> = { data: T; loading: boolean; error: string | null };

const EMPTY_PRIVATE_TRUST_DATA = {
  conversations: [] as Conversation[],
  notifications: [] as Notification[],
  accessRequests: [] as AccessRequest[],
  evidence: [] as EvidenceEvent[],
  verification: [] as VerificationRequest[],
  reports: [] as ContentReport[],
};

function messageOf(error: unknown) {
  return error instanceof Error ? error.message : "The network could not load this information.";
}

export function useSessionState() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active) {
        setSession(data.session);
        setLoading(false);
      }
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return { session, loading };
}

export function useProjects() {
  const [state, setState] = useState<LiveState<Project[]>>({
    data: [],
    loading: true,
    error: null,
  });
  useEffect(() => {
    let active = true;
    void supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(24)
      .then(({ data, error }) => {
        if (active) setState({ data: data ?? [], loading: false, error: error?.message ?? null });
      });
    return () => {
      active = false;
    };
  }, []);
  return state;
}

export function useProfiles() {
  const [state, setState] = useState<LiveState<Profile[]>>({
    data: [],
    loading: true,
    error: null,
  });
  useEffect(() => {
    let active = true;
    void supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(24)
      .then(({ data, error }) => {
        if (active) setState({ data: data ?? [], loading: false, error: error?.message ?? null });
      });
    return () => {
      active = false;
    };
  }, []);
  return state;
}

export function usePublicTrustData() {
  const [state, setState] = useState<
    LiveState<{
      organizations: Organization[];
      sessions: ExpertSession[];
      collaborations: CollaborationRequest[];
    }>
  >({ data: { organizations: [], sessions: [], collaborations: [] }, loading: true, error: null });
  useEffect(() => {
    let active = true;
    void Promise.all([
      supabase
        .from("organizations")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("expert_sessions")
        .select("*")
        .eq("status", "published")
        .order("starts_at")
        .limit(20),
      supabase
        .from("collaboration_requests")
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(20),
    ])
      .then(([organizations, sessions, collaborations]) => {
        const error = organizations.error ?? sessions.error ?? collaborations.error;
        if (active)
          setState({
            data: {
              organizations: organizations.data ?? [],
              sessions: sessions.data ?? [],
              collaborations: collaborations.data ?? [],
            },
            loading: false,
            error: error?.message ?? null,
          });
      })
      .catch((error: unknown) => {
        if (active)
          setState((current) => ({ ...current, loading: false, error: messageOf(error) }));
      });
    return () => {
      active = false;
    };
  }, []);
  return state;
}

export function usePrivateTrustData(userId?: string) {
  const [state, setState] = useState<LiveState<typeof EMPTY_PRIVATE_TRUST_DATA>>({
    data: EMPTY_PRIVATE_TRUST_DATA,
    loading: Boolean(userId),
    error: null,
  });

  useEffect(() => {
    if (!userId) {
      setState({ data: EMPTY_PRIVATE_TRUST_DATA, loading: false, error: null });
      return;
    }
    let active = true;
    setState((current) => ({ ...current, loading: true }));
    void Promise.all([
      supabase.from("conversations").select("*").order("created_at", { ascending: false }),
      supabase.from("notifications").select("*").order("created_at", { ascending: false }),
      supabase
        .from("protected_access_requests")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase.from("evidence_events").select("*").order("created_at", { ascending: false }),
      supabase.from("verification_requests").select("*").order("created_at", { ascending: false }),
      supabase.from("content_reports").select("*").order("created_at", { ascending: false }),
    ]).then(([conversations, notifications, accessRequests, evidence, verification, reports]) => {
      const error =
        conversations.error ??
        notifications.error ??
        accessRequests.error ??
        evidence.error ??
        verification.error ??
        reports.error;
      if (active)
        setState({
          data: {
            conversations: conversations.data ?? [],
            notifications: notifications.data ?? [],
            accessRequests: accessRequests.data ?? [],
            evidence: evidence.data ?? [],
            verification: verification.data ?? [],
            reports: reports.data ?? [],
          },
          loading: false,
          error: error?.message ?? null,
        });
    });
    return () => {
      active = false;
    };
  }, [userId]);
  return state;
}

export function usePhaseThreeData() {
  const initial = {
    media: [] as MediaPublication[],
    events: [] as LiveEvent[],
    programs: [] as EcosystemProgram[],
    plans: [] as PlatformPlan[],
  };
  const [state, setState] = useState<LiveState<typeof initial>>({
    data: initial,
    loading: true,
    error: null,
  });
  useEffect(() => {
    let active = true;
    void Promise.all([
      supabase
        .from("media_publications")
        .select("*")
        .eq("status", "published")
        .order("published_at", { ascending: false }),
      supabase
        .from("live_events")
        .select("*")
        .in("status", ["scheduled", "live", "ended"])
        .order("starts_at"),
      supabase
        .from("ecosystem_programs")
        .select("*")
        .in("status", ["open", "active", "completed"])
        .order("created_at", { ascending: false }),
      supabase.from("platform_plans").select("*").eq("is_public", true).order("display_order"),
    ]).then(([media, events, programs, plans]) => {
      const error = media.error ?? events.error ?? programs.error ?? plans.error;
      if (active)
        setState({
          data: {
            media: media.data ?? [],
            events: events.data ?? [],
            programs: programs.data ?? [],
            plans: plans.data ?? [],
          },
          loading: false,
          error: error?.message ?? null,
        });
    });
    return () => {
      active = false;
    };
  }, []);
  return state;
}

async function requirePermanentUser() {
  const { data } = await supabase.auth.getUser();
  if (!data.user || data.user.is_anonymous)
    throw new Error("This protected action requires a permanent account in the later auth phase.");
  return data.user;
}

async function permanentUserOrNull() {
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  return user && !user.is_anonymous ? user : null;
}

async function submitCaptchaProtectedGuestAction(body: {
  captchaToken: string;
  actionType: "collaboration_interest" | "session_registration" | "content_report";
  targetId: string;
  contactEmail: string;
  message: string;
  category?: string;
}) {
  const { data, error } = await supabase.functions.invoke("guest-action-submit", { body });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function applyForCollaboration(
  requestId: string,
  message: string,
  email: string,
  captchaToken: string,
) {
  const user = await permanentUserOrNull();
  const result = user
    ? await supabase
        .from("collaboration_applications")
        .insert({ request_id: requestId, applicant_id: user.id, message })
    : await submitCaptchaProtectedGuestAction({
        actionType: "collaboration_interest",
        targetId: requestId,
        contactEmail: email,
        message,
        captchaToken,
      });
  if ("error" in result && result.error) throw result.error;
  return "data" in result ? result.data : result;
}

export async function requestProtectedAccess(projectId: string, reason: string, accepted: boolean) {
  const user = await requirePermanentUser();
  if (!accepted) throw new Error("The confidentiality commitment must be accepted explicitly.");
  return supabase.from("protected_access_requests").insert({
    project_id: projectId,
    requester_id: user.id,
    reason,
    confidentiality_accepted: true,
    confidentiality_accepted_at: new Date().toISOString(),
  });
}

export async function sendMessage(conversationId: string, body: string) {
  const user = await requirePermanentUser();
  return supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: user.id, body });
}

export async function registerForExpertSession(
  sessionId: string,
  motivation: string,
  email: string,
  captchaToken: string,
) {
  const user = await permanentUserOrNull();
  const result = user
    ? await supabase
        .from("expert_session_registrations")
        .insert({ session_id: sessionId, user_id: user.id, motivation })
    : await submitCaptchaProtectedGuestAction({
        actionType: "session_registration",
        targetId: sessionId,
        contactEmail: email,
        message: motivation,
        captchaToken,
      });
  if ("error" in result && result.error) throw result.error;
  return "data" in result ? result.data : result;
}

export async function submitContentReport(
  subjectType: string,
  subjectId: string,
  category: string,
  description: string,
  email: string,
  captchaToken: string,
) {
  const user = await permanentUserOrNull();
  const result = user
    ? await supabase.from("content_reports").insert({
        reporter_id: user.id,
        subject_type: subjectType,
        subject_id: subjectId,
        category,
        description,
      })
    : await submitCaptchaProtectedGuestAction({
        actionType: "content_report",
        targetId: subjectId,
        contactEmail: email,
        message: description,
        category,
        captchaToken,
      });
  if ("error" in result && result.error) throw result.error;
  return "data" in result ? result.data : result;
}
