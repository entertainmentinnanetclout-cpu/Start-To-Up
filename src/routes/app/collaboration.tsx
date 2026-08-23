import { createFileRoute } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CheckCircle2,
  Download,
  FileText,
  GitBranch,
  ListChecks,
  LockKeyhole,
  MessageSquareText,
  Plus,
  Send,
  ShieldCheck,
  Upload,
  Users,
} from "lucide-react";
import { AppShell } from "../../components/app-shell";
import { GuestActionForm } from "../../components/guest-action-form";
import { DataState } from "../../components/live-data-ui";
import { useSessionState } from "../../lib/start-to-up-data";
import {
  createWorkspaceTask,
  getWorkspaceFileUrl,
  postWorkspaceMessage,
  postWorkspaceUpdate,
  proposeWorkspaceDecision,
  requestWorkspaceAccess,
  type ProfessionalWorkspace,
  type WorkspaceRoomData,
  type WorkspaceTask,
  updateWorkspaceTaskStatus,
  uploadWorkspaceFile,
  useProfessionalWorkspaces,
  useRefreshToken,
  useWorkspaceMemberships,
  useWorkspaceRoom,
} from "../../lib/pro-network-data";
import "../../pro-network.css";

export const Route = createFileRoute("/app/collaboration")({ component: CollaborationPage });

type Workstream = { name: string; lead: string; status: string; needs: string[] };
type WorkspaceTab = "Overview" | "Discussion" | "Workstreams" | "Files" | "Decisions" | "Updates";

const workspaceTabs: WorkspaceTab[] = ["Overview", "Discussion", "Workstreams", "Files", "Decisions", "Updates"];

function getWorkstreams(workspace: ProfessionalWorkspace): Workstream[] {
  if (!Array.isArray(workspace.workstreams)) return [];
  return workspace.workstreams.filter(
    (item): item is Workstream =>
      item !== null &&
      typeof item === "object" &&
      "name" in item &&
      "lead" in item &&
      "status" in item &&
      "needs" in item &&
      Array.isArray(item["needs"]),
  );
}

function CollaborationPage() {
  const session = useSessionState();
  const workspaces = useProfessionalWorkspaces();
  const memberships = useWorkspaceMemberships(session.session?.user.id);

  return (
    <AppShell title="Collaboration rooms" eyebrow="90% OF THE WORK · INSIDE THE NETWORK">
      <section className="collaboration-operating-hero pro-collaboration-hero">
        <div>
          <span>
            <BriefcaseBusiness /> BUILT FOR DELIVERY, NOT JUST CONNECTIONS
          </span>
          <h2>Discover the project, form the team and keep the working relationship in one room.</h2>
          <p>
            Discussion, scoped workstreams, tasks, files, decisions, milestones and contribution records stay
            attached to the venture. External tools become the exception—not the operating system.
          </p>
        </div>
        <div className="collaboration-system-map">
          <span><MessageSquareText /> Discuss</span><i />
          <span><ListChecks /> Scope</span><i />
          <span><GitBranch /> Build</span><i />
          <span><CheckCircle2 /> Deliver</span>
        </div>
      </section>

      <section className="collaboration-principles-strip" aria-label="Collaboration system features">
        <span><MessageSquareText /> Project discussion</span>
        <span><FileText /> Controlled files</span>
        <span><ListChecks /> Tasks & workstreams</span>
        <span><ShieldCheck /> Decisions & attribution</span>
        <span><Users /> Team roles</span>
      </section>

      <DataState loading={workspaces.loading} error={workspaces.error} empty={!workspaces.data.length}>
        <div className="workspace-stack">
          {workspaces.data.map((workspace) => (
            <WorkspaceRoom
              workspace={workspace}
              userId={session.session?.user.id}
              membership={memberships.data.find((member) => member.workspace_id === workspace.id)}
              key={workspace.id}
            />
          ))}
        </div>
      </DataState>
    </AppShell>
  );
}

function WorkspaceRoom({
  workspace,
  userId,
  membership,
}: {
  workspace: ProfessionalWorkspace;
  userId?: string;
  membership?: { status: string; role_title: string; can_manage: boolean };
}) {
  const streams = getWorkstreams(workspace);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("Overview");
  const [requested, setRequested] = useState(membership?.status === "requested");
  const { token, refresh } = useRefreshToken();
  const hasAccess = Boolean(userId && (workspace.created_by === userId || membership?.status === "active"));
  const room = useWorkspaceRoom(workspace.id, hasAccess, token);

  return (
    <article className="collaboration-workspace pro-room-shell">
      <header>
        <div className="workspace-owner-mark">{workspace.owner_name.slice(0, 2).toUpperCase()}</div>
        <div>
          <span>{workspace.owner_name} <BadgeCheck /></span>
          <h2>{workspace.name}</h2>
          <p>{workspace.summary}</p>
        </div>
        <strong className="pro-room-status"><i /> {workspace.status.toUpperCase()}</strong>
      </header>

      <div className="workspace-focus">
        <span>CURRENT FOCUS</span>
        <strong>{workspace.current_focus || "Build the next validated milestone."}</strong>
      </div>

      <div className="workspace-tabs pro-room-tabs" role="tablist" aria-label="Collaboration workspace sections">
        {workspaceTabs.map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            className={activeTab === tab ? "active" : ""}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="pro-room-content">
        {hasAccess ? (
          <DataState loading={room.loading} error={room.error} empty={false}>
            <div className="pro-room-operational-grid">
              <section className="pro-room-panel">
                <RoomPanel
                  tab={activeTab}
                  workspace={workspace}
                  streams={streams}
                  room={room.data}
                  refresh={refresh}
                />
              </section>
              <MembersRail room={room.data} ownerName={workspace.owner_name} />
            </div>
          </DataState>
        ) : (
          <div className="pro-room-operational-grid">
            <section className="pro-room-panel">
              {activeTab === "Overview" || activeTab === "Workstreams" ? (
                <PublicWorkspaceOverview workspace={workspace} streams={streams} />
              ) : (
                <div className="pro-room-lock">
                  <LockKeyhole />
                  <h3>{workspacePanelTitle(activeTab)}</h3>
                  <p>
                    Working material is protected inside the room. Approved contributors can use this section
                    without moving the project conversation to unrelated apps.
                  </p>
                </div>
              )}
            </section>
            <aside className="workspace-join-panel">
              <span>ENTER THE ROOM</span>
              <h3>{requested ? "Access request recorded." : "Offer a credible contribution."}</h3>
              {requested ? (
                <div className="pro-request-state">
                  Your request is attached to this project room. The workspace manager can activate your role when the contribution fits the current scope.
                </div>
              ) : (
                <>
                  <p>
                    Explain the service, capability, evidence or access you can bring. The goal is to form a delivery team—not collect empty connections.
                  </p>
                  <div className="workspace-modes">
                    {workspace.collaboration_modes.map((mode) => <span key={mode}>{mode}</span>)}
                  </div>
                  <GuestActionForm
                    label="Request room access"
                    fieldLabel="What can you contribute?"
                    placeholder="Name your role or company, relevant capability, delivery evidence and the workstream you want to join."
                    onSubmit={async (message, email, captchaToken) => {
                      await requestWorkspaceAccess(workspace.id, message, email, captchaToken);
                      setRequested(true);
                    }}
                  />
                </>
              )}
            </aside>
          </div>
        )}
      </div>

      <footer className="workspace-rules">
        <span>ROOM STANDARD</span>
        {workspace.operating_principles.map((principle) => (
          <p key={principle}><CheckCircle2 /> {principle}</p>
        ))}
      </footer>
    </article>
  );
}

function PublicWorkspaceOverview({ workspace, streams }: { workspace: ProfessionalWorkspace; streams: Workstream[] }) {
  return (
    <>
      <div className="workspace-section-heading">
        <div><span>OPEN SCOPE</span><h3>Understand where the project needs delivery.</h3></div>
        <small>{streams.length} workstreams</small>
      </div>
      <div className="workstream-grid">
        {streams.map((stream, index) => (
          <article key={stream.name}>
            <div><span>0{index + 1}</span><strong>{stream.status}</strong></div>
            <h3>{stream.name}</h3>
            <small>Coordinated by {stream.lead}</small>
            <ul>{stream.needs.map((need) => <li key={need}><ArrowRight /> {need}</li>)}</ul>
          </article>
        ))}
      </div>
      {!streams.length ? (
        <div className="pro-room-lock">
          <GitBranch />
          <h3>{workspace.name}</h3>
          <p>The room is open for scoped contributions. Enter with a clear role and the manager can shape the first delivery track with you.</p>
        </div>
      ) : null}
    </>
  );
}

function RoomPanel({
  tab,
  workspace,
  streams,
  room,
  refresh,
}: {
  tab: WorkspaceTab;
  workspace: ProfessionalWorkspace;
  streams: Workstream[];
  room: WorkspaceRoomData;
  refresh: () => void;
}) {
  if (tab === "Overview") {
    return (
      <>
        <div className="workspace-section-heading">
          <div><span>ROOM OVERVIEW</span><h3>The project operating picture</h3></div>
          <small>{room.members.length} active members</small>
        </div>
        <div className="pro-room-stats">
          <RoomStat value={room.members.length} label="Members" />
          <RoomStat value={room.tasks.filter((task) => task.status !== "done").length} label="Open tasks" />
          <RoomStat value={room.files.length} label="Files" />
          <RoomStat value={room.decisions.length} label="Decisions" />
          <RoomStat value={room.updates.length} label="Updates" />
        </div>
        <PublicWorkspaceOverview workspace={workspace} streams={streams} />
      </>
    );
  }
  if (tab === "Discussion") return <DiscussionPanel workspaceId={workspace.id} messages={room.messages} refresh={refresh} />;
  if (tab === "Workstreams") return <WorkstreamsPanel workspaceId={workspace.id} streams={streams} tasks={room.tasks} refresh={refresh} />;
  if (tab === "Files") return <FilesPanel workspaceId={workspace.id} files={room.files} refresh={refresh} />;
  if (tab === "Decisions") return <DecisionsPanel workspaceId={workspace.id} decisions={room.decisions} refresh={refresh} />;
  return <UpdatesPanel workspaceId={workspace.id} updates={room.updates} refresh={refresh} />;
}

function RoomStat({ value, label }: { value: number; label: string }) {
  return <div className="pro-room-stat"><strong>{value}</strong><span>{label}</span></div>;
}

function MembersRail({ room, ownerName }: { room: WorkspaceRoomData; ownerName: string }) {
  return (
    <aside className="pro-members-rail">
      <span>ACTIVE ROOM MEMBERS</span>
      {room.members.map((member, index) => (
        <div className="pro-member-row" key={member.user_id}>
          <i>{index === 0 ? ownerName.slice(0, 2).toUpperCase() : `M${index + 1}`}</i>
          <div><strong>{index === 0 ? ownerName : "Project contributor"}</strong><span>{member.role_title}</span></div>
        </div>
      ))}
      {!room.members.length ? <div className="pro-request-state">The room owner is preparing the delivery team.</div> : null}
    </aside>
  );
}

function DiscussionPanel({ workspaceId, messages, refresh }: { workspaceId: string; messages: WorkspaceRoomData["messages"]; refresh: () => void }) {
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <>
      <PanelHeading label="DISCUSSION" title="One conversation attached to the work" count={`${messages.length} messages`} />
      <div className="pro-room-list">
        {messages.map((message) => (
          <div className="pro-room-item" key={message.id}>
            <MessageSquareText /><div><strong>Room member</strong><p>{message.body}</p><small>{formatDate(message.created_at)}</small></div>
          </div>
        ))}
      </div>
      <form className="pro-room-form" onSubmit={async (event) => {
        event.preventDefault(); if (!body.trim()) return; setBusy(true);
        try { await postWorkspaceMessage(workspaceId, body); setBody(""); refresh(); } finally { setBusy(false); }
      }}>
        <h4>Post to the room</h4>
        <textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Share a build note, question, review request or blocker." required />
        <button disabled={busy}><Send /> {busy ? "Posting…" : "Post message"}</button>
      </form>
    </>
  );
}

function WorkstreamsPanel({ workspaceId, streams, tasks, refresh }: { workspaceId: string; streams: Workstream[]; tasks: WorkspaceTask[]; refresh: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<WorkspaceTask["priority"]>("normal");
  const [busy, setBusy] = useState(false);
  return (
    <>
      <PanelHeading label="WORKSTREAMS & TASKS" title="Turn collaboration into owned execution" count={`${tasks.filter((task) => task.status !== "done").length} open tasks`} />
      <div className="workstream-grid">
        {streams.map((stream, index) => (
          <article key={stream.name}><div><span>0{index + 1}</span><strong>{stream.status}</strong></div><h3>{stream.name}</h3><small>Coordinated by {stream.lead}</small><ul>{stream.needs.map((need) => <li key={need}><ArrowRight /> {need}</li>)}</ul></article>
        ))}
      </div>
      <div className="pro-room-list">
        {tasks.map((task) => (
          <div className="pro-room-item" key={task.id}>
            <ListChecks />
            <div><strong>{task.title}</strong>{task.description ? <p>{task.description}</p> : null}<small>{task.priority.toUpperCase()} · {formatDate(task.created_at)}</small></div>
            <select value={task.status} aria-label={`Status for ${task.title}`} onChange={async (event) => { await updateWorkspaceTaskStatus(workspaceId, task.id, event.target.value as WorkspaceTask["status"]); refresh(); }}>
              <option value="open">Open</option><option value="in_progress">In progress</option><option value="review">Review</option><option value="done">Done</option><option value="blocked">Blocked</option>
            </select>
          </div>
        ))}
      </div>
      <form className="pro-room-form" onSubmit={async (event) => {
        event.preventDefault(); if (!title.trim()) return; setBusy(true);
        try { await createWorkspaceTask(workspaceId, title, description, priority); setTitle(""); setDescription(""); refresh(); } finally { setBusy(false); }
      }}>
        <h4>Create a task</h4>
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Task title" required />
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Definition of done, context or dependency" />
        <select value={priority} onChange={(event) => setPriority(event.target.value as WorkspaceTask["priority"])}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="critical">Critical</option></select>
        <button disabled={busy}><Plus /> {busy ? "Creating…" : "Create task"}</button>
      </form>
    </>
  );
}

function FilesPanel({ workspaceId, files, refresh }: { workspaceId: string; files: WorkspaceRoomData["files"]; refresh: () => void }) {
  const [busy, setBusy] = useState(false);
  async function download(path: string) {
    const url = await getWorkspaceFileUrl(path);
    window.open(url, "_blank", "noopener,noreferrer");
  }
  return (
    <>
      <PanelHeading label="FILES" title="Shared project context with controlled access" count={`${files.length} files`} />
      <div className="pro-room-list">
        {files.map((file) => (
          <div className="pro-room-item" key={file.id}>
            <FileText /><div><strong>{file.title}</strong><small>v{file.version} · {file.file_size ? formatBytes(file.file_size) : "Project file"} · {formatDate(file.created_at)}</small></div>
            <button className="pro-file-button" onClick={() => void download(file.storage_path)}><Download /> Open</button>
          </div>
        ))}
      </div>
      <label className="pro-room-form">
        <h4>Upload to the room</h4>
        <span>PDFs, documents, spreadsheets, slides, images, ZIPs and short video files are supported.</span>
        <input type="file" disabled={busy} onChange={async (event) => {
          const file = event.target.files?.[0]; if (!file) return; setBusy(true);
          try { await uploadWorkspaceFile(workspaceId, file); refresh(); event.target.value = ""; } finally { setBusy(false); }
        }} />
        <span className="pro-inline-button"><Upload /> {busy ? "Uploading…" : "Choose file"}</span>
      </label>
    </>
  );
}

function DecisionsPanel({ workspaceId, decisions, refresh }: { workspaceId: string; decisions: WorkspaceRoomData["decisions"]; refresh: () => void }) {
  const [title, setTitle] = useState("");
  const [proposal, setProposal] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <>
      <PanelHeading label="DECISION LOG" title="Preserve what the team proposes and agrees" count={`${decisions.length} records`} />
      <div className="pro-room-list">
        {decisions.map((decision) => (
          <div className="pro-room-item" key={decision.id}>
            <ShieldCheck /><div><strong>{decision.title}</strong><p>{decision.outcome || decision.proposal}</p><small>{formatDate(decision.created_at)}</small></div><span className="status-pill">{decision.status}</span>
          </div>
        ))}
      </div>
      <form className="pro-room-form" onSubmit={async (event) => {
        event.preventDefault(); if (!title.trim() || !proposal.trim()) return; setBusy(true);
        try { await proposeWorkspaceDecision(workspaceId, title, proposal); setTitle(""); setProposal(""); refresh(); } finally { setBusy(false); }
      }}>
        <h4>Propose a decision</h4>
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Decision title" required />
        <textarea value={proposal} onChange={(event) => setProposal(event.target.value)} placeholder="State the proposed direction and why it matters." required />
        <button disabled={busy}><ShieldCheck /> {busy ? "Recording…" : "Record proposal"}</button>
      </form>
    </>
  );
}

function UpdatesPanel({ workspaceId, updates, refresh }: { workspaceId: string; updates: WorkspaceRoomData["updates"]; refresh: () => void }) {
  const [body, setBody] = useState("");
  const [milestone, setMilestone] = useState("");
  const [progress, setProgress] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <>
      <PanelHeading label="BUILD UPDATES" title="Create a readable delivery history" count={`${updates.length} updates`} />
      <div className="pro-room-list">
        {updates.map((update) => (
          <div className="pro-room-item" key={update.id}>
            <CheckCircle2 /><div><strong>{update.milestone_label || "Project update"}</strong><p>{update.body}</p><small>{update.progress_percent !== null ? `${update.progress_percent}% · ` : ""}{formatDate(update.created_at)}</small></div>
          </div>
        ))}
      </div>
      <form className="pro-room-form" onSubmit={async (event) => {
        event.preventDefault(); if (!body.trim()) return; setBusy(true);
        try { await postWorkspaceUpdate(workspaceId, body, progress ? Number(progress) : undefined, milestone); setBody(""); setMilestone(""); setProgress(""); refresh(); } finally { setBusy(false); }
      }}>
        <h4>Post a progress update</h4>
        <input value={milestone} onChange={(event) => setMilestone(event.target.value)} placeholder="Milestone label (optional)" />
        <textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="What changed, what was delivered and what happens next?" required />
        <input type="number" min="0" max="100" value={progress} onChange={(event) => setProgress(event.target.value)} placeholder="Progress % (optional)" />
        <button disabled={busy}><Send /> {busy ? "Posting…" : "Post update"}</button>
      </form>
    </>
  );
}

function PanelHeading({ label, title, count }: { label: string; title: string; count: string }) {
  return <div className="workspace-section-heading"><div><span>{label}</span><h3>{title}</h3></div><small>{count}</small></div>;
}

function workspacePanelTitle(tab: WorkspaceTab) {
  const titles: Record<WorkspaceTab, string> = {
    Overview: "Where collaboration can begin",
    Discussion: "One conversation, attached to the work",
    Workstreams: "Choose the track where you can deliver",
    Files: "Shared context with a controlled source",
    Decisions: "A durable record of what the team agrees",
    Updates: "Progress that stays visible to the room",
  };
  return titles[tab];
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-ZA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}
function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
