import { createFileRoute } from "@tanstack/react-router";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { CalendarDays, Camera, MessageCircle, Mic, MonitorUp, Radio, Send, Sparkles, UserPlus, Users, Video, VideoOff, X } from "lucide-react";
import { AppShell } from "../../components/app-shell";
import { DataState } from "../../components/live-data-ui";
import { supabase } from "../../integrations/supabase/client";
import { useLiveStudioEvents } from "../../lib/pro-network-data";
import { requestPitchRoomAccess, usePitchRooms } from "../../lib/media-v2-data";
import { useLiveRoom } from "../../lib/live-v2-data";
import "../../media-v2.css";

export const Route = createFileRoute("/app/sessions")({ component: LiveStudioPage });
const db = supabase as any;

type OwnProject = { id: string; name: string; pitch: string | null };

function LiveStudioPage() {
  const liveEvents = useLiveStudioEvents();
  const pitchRooms = usePitchRooms();
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>();
  const [createOpen, setCreateOpen] = useState(false);
  const [projects, setProjects] = useState<OwnProject[]>([]);

  useEffect(() => {
    void supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session?.user) return;
      const { data: rows } = await db.from("projects").select("id,name,pitch").eq("owner_id", data.session.user.id).order("created_at", { ascending: false });
      setProjects(rows ?? []);
    });
  }, []);

  return (
    <AppShell title="Live studio" eyebrow="NATIVE STREAMING · CO-STREAM · SCREEN SHARE · PITCH ROOMS">
      <section className="v2-command live-command">
        <div><span><Radio /> START TO UP LIVE</span><h2>Run the product demo, technical review or investor pitch inside the network.</h2><p>Realtime chat, browser camera, screen sharing, co-host negotiation and project context now operate as one live room.</p></div>
        <button className="button button-primary" onClick={() => setCreateOpen(true)}><Video /> Create pitch room</button>
      </section>

      {selectedEventId ? <LiveRoomStage eventId={selectedEventId} onClose={() => setSelectedEventId(undefined)} /> : (
        <div className="live-discovery-grid">
          <section>
            <div className="v2-section-heading"><span>LIVE & UPCOMING</span><h2>Native professional rooms</h2></div>
            <DataState loading={liveEvents.loading} error={liveEvents.error} empty={!liveEvents.data.length}>
              <div className="live-event-grid">
                {liveEvents.data.filter((event) => event.status !== "ended").map((event) => (
                  <article key={event.id} className={event.status === "live" ? "is-live" : ""}>
                    <span>{event.status === "live" ? <><i /> LIVE NOW</> : <><CalendarDays /> {new Date(event.starts_at).toLocaleString("en-ZA")}</>}</span>
                    <h3>{event.title}</h3><p>{event.summary}</p>
                    <button className="button button-primary" onClick={() => setSelectedEventId(event.id)}><Video /> Enter room</button>
                  </article>
                ))}
              </div>
            </DataState>
          </section>

          <section>
            <div className="v2-section-heading"><span>PROJECT PITCH ROOMS</span><h2>Founder ↔ investor sessions</h2></div>
            <DataState loading={pitchRooms.loading} error={pitchRooms.error} empty={!pitchRooms.data.length}>
              <div className="pitch-room-grid">
                {pitchRooms.data.map((room) => (
                  <article key={room.id}>
                    <span>{room.status.toUpperCase()} · {room.access_type.replaceAll("_", " ")}</span>
                    <h3>{room.title}</h3><p>{room.summary || room.project?.pitch}</p>
                    <small>{room.project?.name} · {room.project?.stage}</small>
                    <div>
                      {room.live_event_id ? <button className="button button-primary" onClick={() => setSelectedEventId(room.live_event_id!)}>Open live room</button> : null}
                      <button className="button button-secondary" onClick={() => void requestPitchRoomAccess(room.id)}>Request investor access</button>
                    </div>
                  </article>
                ))}
              </div>
            </DataState>
          </section>
        </div>
      )}
      {createOpen ? <CreatePitchRoom projects={projects} onClose={() => setCreateOpen(false)} onCreated={(eventId) => { setCreateOpen(false); setSelectedEventId(eventId); void pitchRooms.refresh(); }} /> : null}
    </AppShell>
  );
}

function LiveRoomStage({ eventId, onClose }: { eventId: string; onClose: () => void }) {
  const room = useLiveRoom(eventId);
  const [chat, setChat] = useState("");
  const [joined, setJoined] = useState(false);

  async function join() { await room.joinRoom(); setJoined(true); }
  async function send(event: FormEvent) { event.preventDefault(); if (!chat.trim()) return; await room.sendChat(chat); setChat(""); }

  return (
    <section className="live-room-stage">
      <header><div><span>{room.event?.status === "live" ? "LIVE NOW" : "LIVE STUDIO"}</span><h2>{room.event?.title ?? "Live room"}</h2></div><button onClick={onClose}><X /></button></header>
      {room.error ? <div className="network-notice">The live room is reconnecting. Please try the action again.</div> : null}
      <div className="live-room-layout">
        <div className="live-video-stage">
          <div className="live-video-grid">
            {room.screenStream ? <StreamTile stream={room.screenStream} label="Screen share" featured /> : room.localStream ? <StreamTile stream={room.localStream} label={room.isHost ? "Host" : "You"} muted /> : <div className="live-placeholder"><Camera /><strong>Camera ready</strong><span>Join the room, then start camera or share your screen.</span></div>}
            {Object.entries(room.remoteStreams).map(([id, stream]) => <StreamTile key={id} stream={stream} label={room.participants.find((p) => p.user_id === id)?.role ?? "Co-stream"} />)}
          </div>
          <div className="live-controls">
            {!joined ? <button className="primary" onClick={() => void join()}><Radio /> Join room</button> : null}
            <button disabled={!joined} onClick={() => void room.startCamera()}><Camera /> Camera</button>
            <button disabled={!joined} onClick={() => room.screenStream ? void room.stopScreenShare() : void room.startScreenShare()}><MonitorUp /> {room.screenStream ? "Stop share" : "Share screen"}</button>
            {!room.isHost && joined ? <button onClick={() => void room.requestCohost()}><UserPlus /> Request co-host</button> : null}
            {joined ? <button className="danger" onClick={() => void room.leaveRoom().then(() => setJoined(false))}><VideoOff /> Leave</button> : null}
          </div>
          <div className="live-participant-bar">
            <span><Users /> {room.participants.filter((p) => p.state === "joined").length} in room</span>
            {room.participants.filter((p) => p.state === "joined").map((participant) => (
              <div key={participant.user_id}><i>{participant.role.slice(0, 1).toUpperCase()}</i><b>{participant.user_id === room.currentUserId ? "You" : participant.role}</b>{room.isHost && participant.role === "viewer" ? <button onClick={() => void room.approveCohost(participant.user_id)}>Make co-host</button> : null}</div>
            ))}
          </div>
        </div>

        <aside className="live-chat-panel">
          <header><MessageCircle /><div><span>ROOM CHAT</span><strong>Realtime discussion</strong></div></header>
          <div className="live-chat-list">{room.messages.map((message) => <article key={message.id}><i>{message.author_id.slice(0, 2).toUpperCase()}</i><div><strong>{message.author_id === room.currentUserId ? "You" : "Member"}</strong><p>{message.body}</p><small>{new Date(message.created_at).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}</small></div></article>)}</div>
          <form onSubmit={(event) => void send(event)}><input value={chat} onChange={(event) => setChat(event.target.value)} placeholder="Ask, respond or add project context…" disabled={!joined} /><button disabled={!joined || !chat.trim()}><Send /></button></form>
        </aside>
      </div>
    </section>
  );
}

function StreamTile({ stream, label, muted = false, featured = false }: { stream: MediaStream; label: string; muted?: boolean; featured?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => { if (ref.current) ref.current.srcObject = stream; }, [stream]);
  return <div className={`stream-tile ${featured ? "featured" : ""}`}><video ref={ref} autoPlay playsInline muted={muted} /><span><Mic /> {label}</span></div>;
}

function CreatePitchRoom({ projects, onClose, onCreated }: { projects: OwnProject[]; onClose: () => void; onCreated: (eventId: string) => void }) {
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [accessType, setAccessType] = useState("request");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user || auth.user.is_anonymous) throw new Error("Sign in to create a pitch room.");
      const { data: live, error: liveError } = await db.from("live_events").insert({
        host_id: auth.user.id, title, summary, provider: "native", starts_at: new Date(scheduledAt).toISOString(), status: "scheduled", public_landing_url: "/app/sessions",
      }).select("id").single();
      if (liveError) throw liveError;
      const { error: pitchError } = await db.from("project_pitch_rooms").insert({
        project_id: projectId, host_id: auth.user.id, live_event_id: live.id, title, summary, scheduled_at: new Date(scheduledAt).toISOString(), duration_minutes: 30, access_type: accessType, status: "scheduled",
      });
      if (pitchError) throw pitchError;
      onCreated(live.id);
    } finally { setSaving(false); }
  }

  return (
    <div className="v2-modal" role="dialog" aria-modal="true"><button className="v2-modal-backdrop" onClick={onClose} /><form className="pitch-create-card" onSubmit={(event) => void submit(event)}><header><div><span>PROJECT PITCH ROOM</span><h2>Schedule a native investor room</h2></div><button type="button" onClick={onClose}><X /></button></header>
      <label>Project<select value={projectId} onChange={(event) => setProjectId(event.target.value)} required><option value="">Select project</option>{projects.map((project) => <option value={project.id} key={project.id}>{project.name}</option>)}</select></label>
      <label>Room title<input value={title} onChange={(event) => setTitle(event.target.value)} required placeholder="e.g. ResKonnect product + traction pitch" /></label>
      <label>Pitch context<textarea value={summary} onChange={(event) => setSummary(event.target.value)} required placeholder="What investors should understand before joining…" /></label>
      <label>Schedule<input type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} required /></label>
      <label>Access<select value={accessType} onChange={(event) => setAccessType(event.target.value)}><option value="request">Request approval</option><option value="public">Open to investors</option><option value="invite_only">Invite only</option></select></label>
      <button className="button button-primary" disabled={saving || !projects.length}><Sparkles /> {saving ? "Creating" : "Create pitch room"}</button>
    </form></div>
  );
}
