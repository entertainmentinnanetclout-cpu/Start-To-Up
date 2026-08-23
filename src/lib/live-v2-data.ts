import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../integrations/supabase/client";

const db = supabase as any;

export type LiveRoomEvent = {
  id: string;
  host_id: string;
  title: string;
  summary: string;
  starts_at: string;
  ends_at: string | null;
  status: "draft" | "scheduled" | "live" | "ended" | "cancelled";
};

export type LiveParticipant = {
  live_event_id: string;
  user_id: string;
  role: "host" | "cohost" | "speaker" | "viewer";
  state: "invited" | "joined" | "left" | "blocked";
  can_share_screen: boolean;
  joined_at: string | null;
  left_at: string | null;
  updated_at: string;
};

export type LiveChatMessage = {
  id: string;
  live_event_id: string;
  author_id: string;
  reply_to: string | null;
  message_kind: "message" | "question" | "reaction" | "system";
  body: string;
  created_at: string;
  deleted_at: string | null;
};

type SignalRow = {
  id: string;
  live_event_id: string;
  sender_id: string;
  target_id: string | null;
  signal_type: "offer" | "answer" | "ice" | "screen_start" | "screen_stop" | "cohost_request" | "cohost_accept";
  payload: any;
  created_at: string;
};

async function userId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user || data.user.is_anonymous) throw new Error("Sign in with a full account to join live rooms.");
  return data.user.id;
}

export function useLiveRoom(eventId?: string) {
  const [event, setEvent] = useState<LiveRoomEvent | null>(null);
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [participants, setParticipants] = useState<LiveParticipant[]>([]);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const peers = useRef(new Map<string, RTCPeerConnection>());
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => { localStreamRef.current = localStream; }, [localStream]);
  useEffect(() => { screenStreamRef.current = screenStream; }, [screenStream]);

  const sendSignal = useCallback(async (targetId: string | null, signalType: SignalRow["signal_type"], payload: any = {}) => {
    if (!eventId) return;
    const uid = currentUserId ?? await userId();
    const { error } = await db.from("live_room_signals").insert({ live_event_id: eventId, sender_id: uid, target_id: targetId, signal_type: signalType, payload });
    if (error) throw error;
  }, [eventId, currentUserId]);

  const attachLocalTracks = useCallback((peer: RTCPeerConnection) => {
    const stream = screenStreamRef.current ?? localStreamRef.current;
    if (!stream) return;
    const senders = peer.getSenders();
    for (const track of stream.getTracks()) {
      if (!senders.some((sender) => sender.track?.kind === track.kind)) peer.addTrack(track, stream);
    }
  }, []);

  const getPeer = useCallback((peerId: string) => {
    const existing = peers.current.get(peerId);
    if (existing) return existing;
    const peer = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
    peer.onicecandidate = (iceEvent) => {
      if (iceEvent.candidate) void sendSignal(peerId, "ice", iceEvent.candidate.toJSON()).catch(() => undefined);
    };
    peer.ontrack = (trackEvent) => {
      const stream = trackEvent.streams[0] ?? new MediaStream([trackEvent.track]);
      setRemoteStreams((current) => ({ ...current, [peerId]: stream }));
    };
    peer.onconnectionstatechange = () => {
      if (["failed", "closed", "disconnected"].includes(peer.connectionState)) {
        setRemoteStreams((current) => {
          const next = { ...current };
          delete next[peerId];
          return next;
        });
      }
    };
    attachLocalTracks(peer);
    peers.current.set(peerId, peer);
    return peer;
  }, [attachLocalTracks, sendSignal]);

  const handleSignal = useCallback(async (signal: SignalRow) => {
    if (!currentUserId || signal.sender_id === currentUserId) return;
    if (signal.target_id && signal.target_id !== currentUserId) return;
    const peer = getPeer(signal.sender_id);
    if (signal.signal_type === "offer") {
      await peer.setRemoteDescription(new RTCSessionDescription(signal.payload));
      attachLocalTracks(peer);
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      await sendSignal(signal.sender_id, "answer", answer);
    } else if (signal.signal_type === "answer") {
      if (peer.signalingState !== "stable") await peer.setRemoteDescription(new RTCSessionDescription(signal.payload));
    } else if (signal.signal_type === "ice" && signal.payload) {
      try { await peer.addIceCandidate(new RTCIceCandidate(signal.payload)); } catch { /* stale ICE candidate */ }
    } else if (signal.signal_type === "cohost_accept") {
      await connectToPeer(signal.sender_id);
    }
  // connectToPeer intentionally resolves through the stable callback below.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId, getPeer, attachLocalTracks, sendSignal]);

  const connectToPeer = useCallback(async (peerId: string) => {
    const peer = getPeer(peerId);
    attachLocalTracks(peer);
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    await sendSignal(peerId, "offer", offer);
  }, [getPeer, attachLocalTracks, sendSignal]);

  useEffect(() => {
    if (!eventId) return;
    let alive = true;
    void (async () => {
      const uid = await userId();
      if (!alive) return;
      setCurrentUserId(uid);
      const [eventResult, chatResult, participantResult] = await Promise.all([
        db.from("live_events").select("id,host_id,title,summary,starts_at,ends_at,status").eq("id", eventId).single(),
        db.from("live_chat_messages").select("*").eq("live_event_id", eventId).is("deleted_at", null).order("created_at", { ascending: true }).limit(250),
        db.from("live_room_participants").select("*").eq("live_event_id", eventId).neq("state", "blocked").order("updated_at", { ascending: false }),
      ]);
      if (!alive) return;
      if (eventResult.error) setError(eventResult.error.message);
      else setEvent(eventResult.data);
      setMessages(chatResult.data ?? []);
      setParticipants(participantResult.data ?? []);
    })().catch((e) => alive && setError(e instanceof Error ? e.message : "Live room unavailable."));

    const chatChannel = supabase.channel(`live-chat-v2-${eventId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "live_chat_messages", filter: `live_event_id=eq.${eventId}` }, (payload) => {
        const row = payload.new as LiveChatMessage;
        if (!row.deleted_at) setMessages((current) => [...current, row]);
      }).subscribe();

    const participantChannel = supabase.channel(`live-presence-v2-${eventId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "live_room_participants", filter: `live_event_id=eq.${eventId}` }, async () => {
        const { data } = await db.from("live_room_participants").select("*").eq("live_event_id", eventId).neq("state", "blocked").order("updated_at", { ascending: false });
        if (alive) setParticipants(data ?? []);
      }).subscribe();

    const signalChannel = supabase.channel(`live-signal-v2-${eventId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "live_room_signals", filter: `live_event_id=eq.${eventId}` }, (payload) => {
        void handleSignal(payload.new as SignalRow).catch((e) => setError(e instanceof Error ? e.message : "Peer connection failed."));
      }).subscribe();

    return () => {
      alive = false;
      void supabase.removeChannel(chatChannel);
      void supabase.removeChannel(participantChannel);
      void supabase.removeChannel(signalChannel);
      for (const peer of peers.current.values()) peer.close();
      peers.current.clear();
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      screenStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [eventId, handleSignal]);

  const joinRoom = useCallback(async () => {
    if (!eventId) return;
    const uid = currentUserId ?? await userId();
    const role = event?.host_id === uid ? "host" : "viewer";
    const { error } = await db.from("live_room_participants").upsert({
      live_event_id: eventId, user_id: uid, role, state: "joined", can_share_screen: role === "host",
      joined_at: new Date().toISOString(), left_at: null, updated_at: new Date().toISOString(),
    }, { onConflict: "live_event_id,user_id" });
    if (error) throw error;
  }, [eventId, currentUserId, event?.host_id]);

  const leaveRoom = useCallback(async () => {
    if (!eventId || !currentUserId) return;
    await db.from("live_room_participants").update({ state: "left", left_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("live_event_id", eventId).eq("user_id", currentUserId);
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    screenStreamRef.current?.getTracks().forEach((track) => track.stop());
    setLocalStream(null); setScreenStream(null);
  }, [eventId, currentUserId]);

  const sendChat = useCallback(async (body: string, kind: LiveChatMessage["message_kind"] = "message", replyTo?: string | null) => {
    if (!eventId) return;
    const uid = currentUserId ?? await userId();
    const { error } = await db.from("live_chat_messages").insert({ live_event_id: eventId, author_id: uid, reply_to: replyTo ?? null, message_kind: kind, body: body.trim() });
    if (error) throw error;
  }, [eventId, currentUserId]);

  const startCamera = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = stream;
    setLocalStream(stream);
    for (const [peerId, peer] of peers.current) {
      for (const track of stream.getTracks()) {
        const sender = peer.getSenders().find((candidate) => candidate.track?.kind === track.kind);
        if (sender) await sender.replaceTrack(track); else peer.addTrack(track, stream);
      }
      if (peer.connectionState === "new") await connectToPeer(peerId);
    }
    return stream;
  }, [connectToPeer]);

  const startScreenShare = useCallback(async () => {
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
    screenStreamRef.current = stream;
    setScreenStream(stream);
    const screenTrack = stream.getVideoTracks()[0];
    for (const peer of peers.current.values()) {
      const sender = peer.getSenders().find((candidate) => candidate.track?.kind === "video");
      if (sender) await sender.replaceTrack(screenTrack); else peer.addTrack(screenTrack, stream);
    }
    await sendSignal(null, "screen_start", {});
    screenTrack.onended = () => { void stopScreenShare(); };
    return stream;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sendSignal]);

  const stopScreenShare = useCallback(async () => {
    const stream = screenStreamRef.current;
    if (!stream) return;
    stream.getTracks().forEach((track) => track.stop());
    screenStreamRef.current = null;
    setScreenStream(null);
    const cameraTrack = localStreamRef.current?.getVideoTracks()[0] ?? null;
    for (const peer of peers.current.values()) {
      const sender = peer.getSenders().find((candidate) => candidate.track?.kind === "video");
      if (sender) await sender.replaceTrack(cameraTrack);
    }
    await sendSignal(null, "screen_stop", {});
  }, [sendSignal]);

  const requestCohost = useCallback(async () => {
    if (!event?.host_id) return;
    await sendSignal(event.host_id, "cohost_request", {});
  }, [event?.host_id, sendSignal]);

  const approveCohost = useCallback(async (participantId: string) => {
    if (!eventId || event?.host_id !== currentUserId) return;
    const { error } = await db.from("live_room_participants").update({ role: "cohost", can_share_screen: true, state: "joined", updated_at: new Date().toISOString() }).eq("live_event_id", eventId).eq("user_id", participantId);
    if (error) throw error;
    await sendSignal(participantId, "cohost_accept", {});
    if (!localStreamRef.current) await startCamera();
    await connectToPeer(participantId);
  }, [eventId, event?.host_id, currentUserId, sendSignal, startCamera, connectToPeer]);

  return {
    event, messages, participants, currentUserId, localStream, screenStream, remoteStreams, error,
    isHost: Boolean(event && currentUserId && event.host_id === currentUserId),
    joinRoom, leaveRoom, sendChat, startCamera, startScreenShare, stopScreenShare, requestCohost, approveCohost, connectToPeer,
  };
}
