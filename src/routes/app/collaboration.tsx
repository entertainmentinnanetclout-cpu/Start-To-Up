import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CheckCircle2,
  FileText,
  GitBranch,
  ListChecks,
  MessageSquareText,
  ShieldCheck,
  Users,
} from "lucide-react";
import { AppShell } from "../../components/app-shell";
import { GuestActionForm } from "../../components/guest-action-form";
import { DataState } from "../../components/live-data-ui";
import {
  applyForCollaboration,
  type CollaborationWorkspace,
  useCollaborationWorkspaces,
} from "../../lib/start-to-up-data";

export const Route = createFileRoute("/app/collaboration")({ component: CollaborationPage });

type Workstream = { name: string; lead: string; status: string; needs: string[] };
type WorkspaceTab = "Overview" | "Discussion" | "Workstreams" | "Files" | "Decisions" | "Updates";

const workspaceTabs: WorkspaceTab[] = [
  "Overview",
  "Discussion",
  "Workstreams",
  "Files",
  "Decisions",
  "Updates",
];

function getWorkstreams(workspace: CollaborationWorkspace): Workstream[] {
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
  const workspaces = useCollaborationWorkspaces();
  return (
    <AppShell title="Collaboration rooms" eyebrow="90% OF THE WORK · INSIDE THE NETWORK">
      <section className="collaboration-operating-hero">
        <div>
          <span>
            <BriefcaseBusiness /> BUILT FOR DELIVERY, NOT JUST CONNECTIONS
          </span>
          <h2>
            Discover the project, form the team and keep the working relationship in one room.
          </h2>
          <p>
            Project context, scoped workstreams, decisions, files, milestones, contribution records
            and discussion remain connected to the venture. External tools are used only when
            execution genuinely requires them.
          </p>
        </div>
        <div className="collaboration-system-map">
          <span>
            <MessageSquareText /> Discuss
          </span>
          <i />
          <span>
            <ListChecks /> Scope
          </span>
          <i />
          <span>
            <GitBranch /> Build
          </span>
          <i />
          <span>
            <CheckCircle2 /> Deliver
          </span>
        </div>
      </section>
      <section
        className="collaboration-principles-strip"
        aria-label="Collaboration system features"
      >
        <span>
          <MessageSquareText /> Project discussion
        </span>
        <span>
          <FileText /> Shared context & files
        </span>
        <span>
          <ListChecks /> Tasks & milestones
        </span>
        <span>
          <ShieldCheck /> Decisions & attribution
        </span>
        <span>
          <Users /> Team roles
        </span>
      </section>
      <DataState
        loading={workspaces.loading}
        error={workspaces.error}
        empty={!workspaces.data.length}
      >
        <div className="workspace-stack">
          {workspaces.data.map((workspace) => (
            <WorkspaceRoom workspace={workspace} key={workspace.id} />
          ))}
        </div>
      </DataState>
    </AppShell>
  );
}

function WorkspaceRoom({ workspace }: { workspace: CollaborationWorkspace }) {
  const streams = getWorkstreams(workspace);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("Overview");
  return (
    <article className="collaboration-workspace">
      <header>
        <div className="workspace-owner-mark">RK</div>
        <div>
          <span>
            {workspace.owner_name} <BadgeCheck />
          </span>
          <h2>{workspace.name}</h2>
          <p>{workspace.summary}</p>
        </div>
        <strong>
          <i /> {workspace.status.toUpperCase()}
        </strong>
      </header>
      <div className="workspace-focus">
        <span>CURRENT FOCUS</span>
        <strong>{workspace.current_focus}</strong>
      </div>
      <div className="workspace-tabs" role="tablist" aria-label="Collaboration workspace sections">
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
      <div className="workspace-content-grid">
        <section className="workstream-board">
          <div className="workspace-section-heading">
            <div>
              <span>
                {activeTab === "Workstreams" ? "ACTIVE WORKSTREAMS" : activeTab.toUpperCase()}
              </span>
              <h3>{workspacePanelTitle(activeTab)}</h3>
            </div>
            <small>{streams.length} focused tracks</small>
          </div>
          {activeTab === "Overview" || activeTab === "Workstreams" ? (
            <div className="workstream-grid">
              {streams.map((stream, index) => (
                <article key={stream.name}>
                  <div>
                    <span>0{index + 1}</span>
                    <strong>{stream.status}</strong>
                  </div>
                  <h3>{stream.name}</h3>
                  <small>Coordinated by {stream.lead}</small>
                  <ul>
                    {stream.needs.map((need) => (
                      <li key={need}>
                        <ArrowRight /> {need}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          ) : (
            <div className="workspace-preview-panel">
              <WorkspacePanelIcon tab={activeTab} />
              <strong>{workspacePanelTitle(activeTab)}</strong>
              <p>{workspacePanelCopy(activeTab)}</p>
              <button type="button" onClick={() => setActiveTab("Workstreams")}>
                View active workstreams <ArrowRight />
              </button>
            </div>
          )}
        </section>
        <aside className="workspace-join-panel">
          <span>ENTER THE ROOM</span>
          <h3>Offer a credible contribution.</h3>
          <p>
            Selecting the right people matters more than collecting applications. Explain the
            service, capability or access you can bring.
          </p>
          <div className="workspace-modes">
            {workspace.collaboration_modes.map((mode) => (
              <span key={mode}>{mode}</span>
            ))}
          </div>
          <GuestActionForm
            label="Request room access"
            fieldLabel="What can you contribute?"
            placeholder="Name your company or role, relevant capability, delivery evidence and the workstream you want to join."
            onSubmit={(message, email, captchaToken) =>
              applyForCollaboration(workspace.id, message, email, captchaToken)
            }
          />
        </aside>
      </div>
      <footer className="workspace-rules">
        <span>ROOM STANDARD</span>
        {workspace.operating_principles.map((principle) => (
          <p key={principle}>
            <CheckCircle2 /> {principle}
          </p>
        ))}
      </footer>
    </article>
  );
}

function workspacePanelTitle(tab: WorkspaceTab) {
  const titles: Record<WorkspaceTab, string> = {
    Overview: "Where collaboration can begin",
    Discussion: "One conversation, attached to the work",
    Workstreams: "Choose the track where you can deliver",
    Files: "Shared context with a clear source",
    Decisions: "A durable record of what the team agrees",
    Updates: "Progress that stays visible to the room",
  };
  return titles[tab];
}

function workspacePanelCopy(tab: WorkspaceTab) {
  const copy: Record<WorkspaceTab, string> = {
    Overview: "Review the active collaboration tracks and enter with a specific contribution.",
    Discussion:
      "Room conversations will stay linked to the project, workstream and people responsible for delivery.",
    Workstreams:
      "Each track states its focus, coordination point and the capabilities currently needed.",
    Files:
      "Briefs, specifications and evidence will carry ownership, version context and access controls.",
    Decisions:
      "Key decisions will preserve the proposal, outcome, contributors and project attribution.",
    Updates:
      "Milestones and build updates will create a readable delivery history for collaborators and stakeholders.",
  };
  return copy[tab];
}

function WorkspacePanelIcon({ tab }: { tab: WorkspaceTab }) {
  if (tab === "Discussion") return <MessageSquareText />;
  if (tab === "Files") return <FileText />;
  if (tab === "Decisions") return <ShieldCheck />;
  if (tab === "Updates") return <CheckCircle2 />;
  return <GitBranch />;
}
