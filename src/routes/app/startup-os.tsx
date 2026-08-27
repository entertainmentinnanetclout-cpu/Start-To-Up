import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  BadgeCheck,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  FileLock2,
  Flag,
  KeyRound,
  ListTodo,
  PlugZap,
  RefreshCw,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AppShell } from "../../components/app-shell";
import { AuthDeferred } from "../../components/live-data-ui";
import { supabase } from "../../integrations/supabase/client";
import {
  createStartupWorkspace,
  createWorkspaceTask,
  listStartupWorkspaces,
  loadWorkspaceSnapshot,
  saveCompanyProfile,
  type StartupWorkspace,
  type StartupWorkspaceSnapshot,
} from "../../lib/startup-os-foundation";

export const Route = createFileRoute("/app/startup-os")({ component: StartupOsPage });

const emptySnapshot: StartupWorkspaceSnapshot = {
  profile: null,
  members: [],
  verifications: [],
  metrics: [],
  tasks: [],
  integrations: [],
  flags: [],
  activity: [],
};

function StartupOsPage() {
  const [sessionReady, setSessionReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [workspaces, setWorkspaces] = useState<StartupWorkspace[]>([]);
  const [workspaceId, setWorkspaceId] = useState("");
  const [snapshot, setSnapshot] = useState<StartupWorkspaceSnapshot>(emptySnapshot);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const active = useMemo(() => workspaces.find((workspace) => workspace.organization_id === workspaceId), [workspaces, workspaceId]);

  useEffect(() => {
    let alive = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setSignedIn(Boolean(data.session));
      setSessionReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setSignedIn(Boolean(session)));
    return () => { alive = false; data.subscription.unsubscribe(); };
  }, []);

  async function refresh(preferredId?: string) {
    setLoading(true);
    try {
      const rows = await listStartupWorkspaces();
      setWorkspaces(rows);
      const stored = typeof window !== "undefined" ? window.localStorage.getItem("start-to-up-active-workspace") || "" : "";
      const nextId = preferredId || workspaceId || stored || rows[0]?.organization_id || "";
      setWorkspaceId(nextId);
      if (typeof window !== "undefined" && nextId) window.localStorage.setItem("start-to-up-active-workspace", nextId);
      setSnapshot(nextId ? await loadWorkspaceSnapshot(nextId) : emptySnapshot);
    } catch {
      setNotice("Your company workspace could not be loaded. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (sessionReady && signedIn) void refresh();
    if (sessionReady && !signedIn) setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionReady, signedIn]);

  async function changeWorkspace(id: string) {
    setWorkspaceId(id);
    window.localStorage.setItem("start-to-up-active-workspace", id);
    setLoading(true);
    try { setSnapshot(await loadWorkspaceSnapshot(id)); } finally { setLoading(false); }
  }

  async function createWorkspace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    if (name.length < 2) return;
    setNotice("Creating your secure company workspace…");
    try {
      const id = await createStartupWorkspace(name);
      event.currentTarget.reset();
      setNotice("Workspace created. Your company data can now be reused across Startup OS modules.");
      await refresh(id);
    } catch {
      setNotice("The workspace could not be created. Use a different company/workspace name and try again.");
    }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workspaceId) return;
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    setNotice("Saving company profile…");
    try {
      await saveCompanyProfile(workspaceId, values);
      setNotice("Company profile saved. Later Startup OS modules will reuse these details automatically.");
      setSnapshot(await loadWorkspaceSnapshot(workspaceId));
    } catch {
      setNotice("The company profile could not be saved. Review the fields and try again.");
    }
  }

  async function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workspaceId) return;
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") || "").trim();
    if (title.length < 2) return;
    try {
      await createWorkspaceTask(workspaceId, title);
      event.currentTarget.reset();
      setSnapshot(await loadWorkspaceSnapshot(workspaceId));
    } catch {
      setNotice("That task could not be added. Check your workspace permission and try again.");
    }
  }

  if (!sessionReady || loading) {
    return <AppShell title="Startup OS" eyebrow="PHASE 0 · COMPANY FOUNDATION"><div className="phase0-loading"><RefreshCw className="spin"/> Restoring your company workspace…</div></AppShell>;
  }
  if (!signedIn) return <AppShell title="Startup OS" eyebrow="PHASE 0 · COMPANY FOUNDATION"><AuthDeferred /></AppShell>;

  if (!workspaces.length) {
    return (
      <AppShell title="Startup OS" eyebrow="PHASE 0 · COMPANY FOUNDATION">
        <section className="phase0-onboarding-card">
          <Building2 />
          <span>CREATE YOUR COMPANY WORKSPACE</span>
          <h2>Enter your business once. Reuse it everywhere.</h2>
          <p>Company profile, contacts, documents, metrics, tasks, integrations and future Startup OS tools share one secure workspace.</p>
          <form onSubmit={createWorkspace}>
            <input name="name" required minLength={2} placeholder="Company or startup name" />
            <button className="button button-primary">Create workspace</button>
          </form>
          {notice ? <p role="status">{notice}</p> : null}
        </section>
      </AppShell>
    );
  }

  const verifiedCount = snapshot.verifications.filter((item) => item.status === "verified").length;
  const connectedCount = snapshot.integrations.filter((item) => item.status === "connected").length;
  const openTasks = snapshot.tasks.filter((item) => !["done", "cancelled"].includes(String(item.status))).length;

  return (
    <AppShell
      title="Startup OS"
      eyebrow="FOUNDATION LIVE · VALIDATION AVAILABLE"
      action={<div className="startup-os-header-actions"><Link to="/app/validate" className="button button-primary">Validate &amp; research</Link><Link to="/app/integrations" className="button button-secondary"><PlugZap size={16}/> Integrations</Link></div>}
    >
      <section className="phase0-toolbar">
        <div>
          <span>ACTIVE COMPANY WORKSPACE</span>
          <select value={workspaceId} onChange={(event) => void changeWorkspace(event.target.value)}>
            {workspaces.map((workspace) => <option key={workspace.organization_id} value={workspace.organization_id}>{workspace.name} · {workspace.role}</option>)}
          </select>
        </div>
        <form onSubmit={createWorkspace}>
          <input name="name" placeholder="New workspace name" required minLength={2}/>
          <button>Create</button>
        </form>
      </section>

      {notice ? <p className="phase0-notice" role="status">{notice}</p> : null}

      <section className="phase0-kpis">
        <article><ShieldCheck/><div><span>Verification</span><strong>{verifiedCount}</strong><small>verified records</small></div></article>
        <article><UsersRound/><div><span>Team</span><strong>{snapshot.members.length}</strong><small>workspace members</small></div></article>
        <article><PlugZap/><div><span>Integrations</span><strong>{connectedCount}</strong><small>connected providers</small></div></article>
        <article><ListTodo/><div><span>Actions</span><strong>{openTasks}</strong><small>open tasks</small></div></article>
      </section>

      <div className="phase0-grid phase0-grid-main">
        <section className="phase0-panel">
          <header><div><Building2/><span>SHARED COMPANY PROFILE</span></div><small>Used by validation, finance, CRM, website, funding and compliance tools.</small></header>
          <form className="phase0-form" onSubmit={saveProfile} key={`${workspaceId}-${snapshot.profile?.updated_at || "new"}`}>
            <label>Trading name<input name="trading_name" defaultValue={snapshot.profile?.trading_name || active?.name || ""}/></label>
            <label>Legal company name<input name="legal_name" defaultValue={snapshot.profile?.legal_name || ""}/></label>
            <label>Registration number<input name="registration_number" defaultValue={snapshot.profile?.registration_number || ""}/></label>
            <label>Industry<input name="industry" defaultValue={snapshot.profile?.industry || ""} placeholder="Technology, retail, property…"/></label>
            <label>Company email<input name="email" type="email" defaultValue={snapshot.profile?.email || ""}/></label>
            <label>Phone<input name="phone" defaultValue={snapshot.profile?.phone || ""}/></label>
            <label>Website<input name="website" defaultValue={snapshot.profile?.website || ""} placeholder="https://…"/></label>
            <label>City<input name="city" defaultValue={snapshot.profile?.city || ""}/></label>
            <label>Province<input name="province" defaultValue={snapshot.profile?.province || ""}/></label>
            <label className="wide">Company description<textarea name="description" rows={4} defaultValue={snapshot.profile?.description || ""}/></label>
            <button className="button button-primary wide">Save company profile</button>
          </form>
        </section>

        <section className="phase0-panel">
          <header><div><BadgeCheck/><span>TRUST &amp; VERIFICATION</span></div><small>Public-safe status only. Sensitive evidence stays private.</small></header>
          <div className="phase0-status-list">
            {snapshot.verifications.length ? snapshot.verifications.map((item) => (
              <article key={item.id}><CheckCircle2/><div><strong>{item.public_label || String(item.kind).replaceAll("_", " ")}</strong><span>{item.public_detail || item.status}</span></div><b>{item.status}</b></article>
            )) : <div className="phase0-empty">No workspace verification records yet.</div>}
          </div>
          <aside className="phase0-privacy-note"><FileLock2/><div><strong>Verification dates are not published.</strong><span>Certificate dates, tax references and source documents remain private operational data. Official regulator logos stay disabled unless an authorised permission record exists.</span></div></aside>
          <Link to="/app/trust" className="phase0-text-link">Open Trust Centre →</Link>
        </section>
      </div>

      <div className="phase0-grid">
        <section className="phase0-panel">
          <header><div><ListTodo/><span>FOUNDATION TASKS</span></div><small>Shared task primitive for every Startup OS module.</small></header>
          <form className="phase0-inline-form" onSubmit={addTask}><input name="title" placeholder="Add a company action…" required minLength={2}/><button>Add task</button></form>
          <div className="phase0-simple-list">
            {snapshot.tasks.slice(0, 8).map((task) => <article key={task.id}><span className={`phase0-dot ${task.priority}`}/><div><strong>{task.title}</strong><small>{String(task.status).replaceAll("_", " ")}</small></div></article>)}
            {!snapshot.tasks.length ? <div className="phase0-empty">No company tasks yet.</div> : null}
          </div>
        </section>

        <section className="phase0-panel">
          <header><div><Flag/><span>STAGED ROLLOUT</span></div><small>Foundation and validation flags are workspace-aware; later phases stay gated until released.</small></header>
          <div className="phase0-flag-list">
            {snapshot.flags.map((flag) => <article key={flag.flag_key}><div><strong>{flag.flag_key.replace("startup_os.", "").replaceAll("_", " ")}</strong><span>{flag.enabled ? "Available" : "Not released to this workspace"}</span></div><b className={flag.enabled ? "on" : "off"}>{flag.enabled ? "ON" : "OFF"}</b></article>)}
          </div>
        </section>

        <section className="phase0-panel">
          <header><div><KeyRound/><span>SECURITY &amp; ACCESS</span></div><small>Workspace roles and server-enforced permissions.</small></header>
          <div className="phase0-simple-list">
            {snapshot.members.slice(0, 8).map((member) => <article key={member.user_id}><UsersRound/><div><strong>{member.workspace_role}</strong><small>Workspace member</small></div></article>)}
          </div>
          <aside className="phase0-privacy-note"><ShieldCheck/><div><strong>Private by default</strong><span>Integration secrets are never returned to the browser after storage. Company documents use a private Storage bucket with workspace RLS.</span></div></aside>
        </section>

        <section className="phase0-panel">
          <header><div><Activity/><span>ACTIVITY</span></div><small>Auditable business changes and workspace actions.</small></header>
          <div className="phase0-simple-list">
            {snapshot.activity.slice(0, 8).map((item) => <article key={item.id}><Activity/><div><strong>{item.summary || item.action}</strong><small>{item.action}</small></div></article>)}
            {!snapshot.activity.length ? <div className="phase0-empty">Activity will appear as the workspace is used.</div> : null}
          </div>
        </section>
      </div>

      <section className="phase0-roadmap-band">
        <div><CircleDollarSign/><div><span>PHASE 1 AVAILABLE</span><strong>Validate &amp; Research</strong><p>Run idea validation, TAM/SAM/SOM modelling, Company Intelligence, competitor research, customer personas, interviews, surveys, brand checks and Startup Health baselines from this same workspace.</p></div></div>
        <Link to="/app/validate" className="button button-primary">Open Phase 1</Link>
      </section>
    </AppShell>
  );
}
