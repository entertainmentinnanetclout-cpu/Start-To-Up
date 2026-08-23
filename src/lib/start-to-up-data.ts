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

async function requireUser() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Authentication will be connected in the dedicated auth phase.");
  return data.user;
}

export async function applyForCollaboration(requestId: string, message: string) {
  const user = await requireUser();
  return supabase
    .from("collaboration_applications")
    .insert({ request_id: requestId, applicant_id: user.id, message });
}

export async function requestProtectedAccess(projectId: string, reason: string, accepted: boolean) {
  const user = await requireUser();
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
  const user = await requireUser();
  return supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: user.id, body });
}

export async function registerForExpertSession(sessionId: string, motivation: string) {
  const user = await requireUser();
  return supabase
    .from("expert_session_registrations")
    .insert({ session_id: sessionId, user_id: user.id, motivation });
}

export async function submitContentReport(
  subjectType: string,
  subjectId: string,
  category: string,
  description: string,
) {
  const user = await requireUser();
  return supabase.from("content_reports").insert({
    reporter_id: user.id,
    subject_type: subjectType,
    subject_id: subjectId,
    category,
    description,
  });
}
