import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../integrations/supabase/client";
import type { ProfessionalMediaItem } from "./pro-network-data";

const db = supabase as any;

type LiveState<T> = { data: T; loading: boolean; error: string | null };

export type MediaComment = {
  id: string;
  media_id: string;
  author_id: string;
  parent_id: string | null;
  body: string;
  status: string;
  created_at: string;
  updated_at: string;
  author?: { display_name?: string; username?: string; avatar_url?: string | null } | null;
};

export type InvestorWatchItem = {
  user_id: string;
  project_id: string;
  source_media_id: string | null;
  status: "watching" | "diligence" | "contacted" | "passed" | "invested";
  private_notes: string | null;
  created_at: string;
  updated_at: string;
  project?: {
    id: string;
    name: string;
    pitch: string | null;
    stage: string;
    seeking_funding: boolean;
    funding_amount: number | null;
    logo_url: string | null;
  } | null;
};

export type RecommendationState = {
  cohort: string;
  exploration_rate: number;
  notification_weight: number;
  topics: Array<{ topic: string; score: number }>;
  creators: Array<{ creator_id: string; score: number }>;
};

export type MediaNotification = {
  id: string;
  media_id: string;
  reason: string;
  priority: number;
  delivered_at: string | null;
  opened_at: string | null;
  created_at: string;
  media?: ProfessionalMediaItem | null;
};

export type PitchRoom = {
  id: string;
  project_id: string;
  host_id: string;
  live_event_id: string | null;
  title: string;
  summary: string;
  scheduled_at: string;
  duration_minutes: number;
  status: "draft" | "scheduled" | "live" | "ended" | "cancelled";
  access_type: "public" | "request" | "invite_only";
  max_investors: number;
  project?: { name: string; pitch: string | null; stage: string; seeking_funding: boolean; funding_amount: number | null } | null;
};

function errorText(error: unknown) {
  return error instanceof Error ? error.message : "This action could not be completed.";
}

async function currentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user || data.user.is_anonymous) throw new Error("Sign in with a full account to continue.");
  return data.user;
}

export function useRankedMediaFeedV2(audienceTags: string[]) {
  const key = audienceTags.join(",");
  const [state, setState] = useState<LiveState<ProfessionalMediaItem[]>>({ data: [], loading: true, error: null });
  useEffect(() => {
    let active = true;
    const tags = key ? key.split(",") : [];
    setState((s) => ({ ...s, loading: true, error: null }));
    void db.rpc("ranked_media_feed_v2", { audience_tags: tags, result_limit: 40 }).then(({ data, error }: any) => {
      if (active) setState({ data: data ?? [], loading: false, error: error?.message ?? null });
    }).catch((error: unknown) => {
      if (active) setState({ data: [], loading: false, error: errorText(error) });
    });
    return () => { active = false; };
  }, [key]);
  return state;
}

export function useMediaComments(mediaId?: string) {
  const [state, setState] = useState<LiveState<MediaComment[]>>({ data: [], loading: Boolean(mediaId), error: null });
  const load = useCallback(async () => {
    if (!mediaId) return;
    const { data, error } = await db
      .from("media_comments")
      .select("id,media_id,author_id,parent_id,body,status,created_at,updated_at,author:profiles!media_comments_author_id_fkey(display_name,username,avatar_url)")
      .eq("media_id", mediaId)
      .eq("status", "active")
      .order("created_at", { ascending: true })
      .limit(250);
    setState({ data: data ?? [], loading: false, error: error?.message ?? null });
  }, [mediaId]);

  useEffect(() => {
    if (!mediaId) { setState({ data: [], loading: false, error: null }); return; }
    let mounted = true;
    void load().catch((error) => mounted && setState({ data: [], loading: false, error: errorText(error) }));
    const channel = supabase.channel(`media-comments-${mediaId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "media_comments", filter: `media_id=eq.${mediaId}` }, () => void load())
      .subscribe();
    return () => { mounted = false; void supabase.removeChannel(channel); };
  }, [mediaId, load]);

  return { ...state, refresh: load };
}

export async function addMediaComment(mediaId: string, body: string, parentId?: string | null) {
  const user = await currentUser();
  const { error } = await db.from("media_comments").insert({ media_id: mediaId, author_id: user.id, parent_id: parentId ?? null, body: body.trim() });
  if (error) throw error;
  await db.rpc("record_media_signal", { media_id: mediaId, event_kind: "comment", session_key: null, event_context: { source: "media_v2" } });
}

export async function toggleCreatorFollow(creatorId: string) {
  const { data, error } = await db.rpc("toggle_creator_follow", { _creator_id: creatorId });
  if (error) throw error;
  return Boolean(data);
}

export async function toggleInvestorWatchlist(projectId: string, sourceMediaId?: string | null) {
  const { data, error } = await db.rpc("toggle_investor_watchlist", { _project_id: projectId, _source_media_id: sourceMediaId ?? null });
  if (error) throw error;
  return Boolean(data);
}

export function useInvestorWatchlist() {
  const [state, setState] = useState<LiveState<InvestorWatchItem[]>>({ data: [], loading: true, error: null });
  const load = useCallback(async () => {
    const { data: auth } = await supabase.auth.getSession();
    if (!auth.session?.user || auth.session.user.is_anonymous) { setState({ data: [], loading: false, error: null }); return; }
    const { data, error } = await db.from("investor_watchlist")
      .select("*,project:projects(id,name,pitch,stage,seeking_funding,funding_amount,logo_url)")
      .order("updated_at", { ascending: false });
    setState({ data: data ?? [], loading: false, error: error?.message ?? null });
  }, []);
  useEffect(() => { void load().catch((e) => setState({ data: [], loading: false, error: errorText(e) })); }, [load]);
  return { ...state, refresh: load };
}

export async function updateWatchlistStatus(projectId: string, status: InvestorWatchItem["status"], privateNotes?: string) {
  const user = await currentUser();
  const { error } = await db.from("investor_watchlist").update({ status, private_notes: privateNotes, updated_at: new Date().toISOString() }).eq("user_id", user.id).eq("project_id", projectId);
  if (error) throw error;
}

export function useCreatorAnalytics() {
  const [state, setState] = useState<LiveState<Record<string, number>>>({ data: {}, loading: true, error: null });
  useEffect(() => {
    let active = true;
    void db.rpc("creator_media_analytics").then(({ data, error }: any) => {
      if (active) setState({ data: data ?? {}, loading: false, error: error?.message ?? null });
    }).catch((e: unknown) => active && setState({ data: {}, loading: false, error: errorText(e) }));
    return () => { active = false; };
  }, []);
  return state;
}

export function useRecommendationState() {
  const [state, setState] = useState<LiveState<RecommendationState>>({
    data: { cohort: "explorer", exploration_rate: 0.18, notification_weight: 0.1, topics: [], creators: [] }, loading: true, error: null,
  });
  useEffect(() => {
    let active = true;
    void (async () => {
      const { data: auth } = await supabase.auth.getSession();
      const uid = auth.session?.user.id;
      if (!uid) { if (active) setState((s) => ({ ...s, loading: false })); return; }
      const [userState, topics, creators] = await Promise.all([
        db.from("recommendation_user_state").select("cohort,exploration_rate,notification_weight").eq("user_id", uid).maybeSingle(),
        db.from("recommendation_topic_affinity").select("topic,score").eq("user_id", uid).order("score", { ascending: false }).limit(8),
        db.from("recommendation_creator_affinity").select("creator_id,score").eq("user_id", uid).order("score", { ascending: false }).limit(8),
      ]);
      const error = userState.error ?? topics.error ?? creators.error;
      if (active) setState({
        data: {
          cohort: userState.data?.cohort ?? "explorer",
          exploration_rate: Number(userState.data?.exploration_rate ?? 0.18),
          notification_weight: Number(userState.data?.notification_weight ?? 0.1),
          topics: topics.data ?? [], creators: creators.data ?? [],
        }, loading: false, error: error?.message ?? null,
      });
    })().catch((e) => active && setState((s) => ({ ...s, loading: false, error: errorText(e) })));
    return () => { active = false; };
  }, []);
  return state;
}

export function useMediaNotifications() {
  const [state, setState] = useState<LiveState<MediaNotification[]>>({ data: [], loading: true, error: null });
  const load = useCallback(async () => {
    const { data: auth } = await supabase.auth.getSession();
    if (!auth.session?.user || auth.session.user.is_anonymous) { setState({ data: [], loading: false, error: null }); return; }
    const { data, error } = await db.from("media_notification_queue")
      .select("id,media_id,reason,priority,delivered_at,opened_at,created_at,media:network_media_items(*)")
      .is("opened_at", null)
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(12);
    setState({ data: data ?? [], loading: false, error: error?.message ?? null });
  }, []);
  useEffect(() => { void load().catch((e) => setState({ data: [], loading: false, error: errorText(e) })); }, [load]);
  return { ...state, refresh: load };
}

export async function markMediaNotificationOpen(id: string, mediaId: string) {
  const { error } = await db.from("media_notification_queue").update({ opened_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
  await db.rpc("record_media_signal", { media_id: mediaId, event_kind: "play", session_key: null, event_context: { source: "notification" } });
}

export function usePitchRooms() {
  const [state, setState] = useState<LiveState<PitchRoom[]>>({ data: [], loading: true, error: null });
  const load = useCallback(async () => {
    const { data: auth } = await supabase.auth.getSession();
    if (!auth.session?.user || auth.session.user.is_anonymous) { setState({ data: [], loading: false, error: null }); return; }
    const { data, error } = await db.from("project_pitch_rooms")
      .select("*,project:projects(name,pitch,stage,seeking_funding,funding_amount)")
      .in("status", ["scheduled", "live"])
      .order("scheduled_at", { ascending: true })
      .limit(30);
    setState({ data: data ?? [], loading: false, error: error?.message ?? null });
  }, []);
  useEffect(() => { void load().catch((e) => setState({ data: [], loading: false, error: errorText(e) })); }, [load]);
  return { ...state, refresh: load };
}

export async function createPitchRoom(input: { projectId: string; title: string; summary: string; scheduledAt: string; durationMinutes: number; accessType: PitchRoom["access_type"] }) {
  const user = await currentUser();
  const { data, error } = await db.from("project_pitch_rooms").insert({
    project_id: input.projectId, host_id: user.id, title: input.title, summary: input.summary,
    scheduled_at: input.scheduledAt, duration_minutes: input.durationMinutes, access_type: input.accessType, status: "scheduled",
  }).select("id").single();
  if (error) throw error;
  return data?.id as string;
}

export async function requestPitchRoomAccess(roomId: string, role: "investor" | "advisor" | "institution" | "observer" = "investor") {
  const user = await currentUser();
  const { error } = await db.from("project_pitch_room_attendees").upsert({ room_id: roomId, user_id: user.id, role, status: "requested", updated_at: new Date().toISOString() }, { onConflict: "room_id,user_id" });
  if (error) throw error;
}

export function threadComments(comments: MediaComment[]) {
  const roots = comments.filter((comment) => !comment.parent_id);
  const children = new Map<string, MediaComment[]>();
  for (const comment of comments) {
    if (!comment.parent_id) continue;
    children.set(comment.parent_id, [...(children.get(comment.parent_id) ?? []), comment]);
  }
  return roots.map((root) => ({ root, replies: children.get(root.id) ?? [] }));
}

export function watchlistIds(items: InvestorWatchItem[]) {
  return useMemo(() => new Set(items.map((item) => item.project_id)), [items]);
}
