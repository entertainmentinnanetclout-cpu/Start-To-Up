import { createFileRoute } from "@tanstack/react-router";
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
        <button className="active">Overview</button>
        <button>Discussion</button>
        <button>Workstreams</button>
        <button>Files</button>
        <button>Decisions</button>
        <button>Updates</button>
      </div>
      <div className="workspace-content-grid">
        <section className="workstream-board">
          <div className="workspace-section-heading">
            <div>
              <span>ACTIVE WORKSTREAMS</span>
              <h3>Where collaboration can begin</h3>
            </div>
            <small>{streams.length} focused tracks</small>
          </div>
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
