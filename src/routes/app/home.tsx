import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  Building2,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Gauge,
  ListTodo,
  PlugZap,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../../components/app-shell";
import { AuthDeferred } from "../../components/live-data-ui";
import { useSessionState } from "../../lib/start-to-up-data";
import {
  listStartupWorkspaces,
  loadWorkspaceSnapshot,
  type StartupWorkspace,
  type StartupWorkspaceSnapshot,
} from "../../lib/startup-os-foundation";
import {
  journeyStages,
  readOperatingPreferences,
  readRecentWork,
  relativeWorkTime,
  stageOptions,
  type RecentWorkItem,
} from "../../lib/ux-operating-layer";

export const Route = createFileRoute("/app/home")({ component: TodayPage });

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

function metricValue(snapshot: StartupWorkspaceSnapshot, token: string) {
  const metric = snapshot.metrics.find((item) => String(item.metric_key || item.key || item.name || item.label || "").toLowerCase().includes(token));
  if (!metric) return "No signal";
  const value = metric.value_numeric ?? metric.metric_value ?? metric.value ?? metric.current_value;
  if (value == null || value === "") return "Recorded";
  return typeof value === "number" ? value.toLocaleString() : String(value);
}

function TodayPage() {
  const session = useSessionState();
  const [workspaces, setWorkspaces] = useState<StartupWorkspace[]>([]);
  const [workspaceId, setWorkspaceId] = useState("");
  const [snapshot, setSnapshot] = useState<StartupWorkspaceSnapshot>(emptySnapshot);
  const [recent, setRecent] = useState<RecentWorkItem[]>(() => readRecentWork());
  const [loading, setLoading] = useState(true);
  const preferences = readOperatingPreferences();

  useEffect(() => {
    const updateRecent = () => setRecent(readRecentWork());
    window.addEventListener("start-to-up:recent-work", updateRecent);
    return () => window.removeEventListener("start-to-up:recent-work", updateRecent);
  }, []);

  useEffect(() => {
    let alive = true;
    async function load() {
      if (!session.session || session.session.user.is_anonymous) { if (alive) setLoading(false); return; }
      setLoading(true);
      try {
        const rows = await listStartupWorkspaces();
        if (!alive) return;
        setWorkspaces(rows);
        const stored = window.localStorage.getItem("start-to-up-active-workspace") || "";
        const next = rows.some((workspace) => workspace.organization_id === stored) ? stored : rows[0]?.organization_id || "";
        setWorkspaceId(next);
        if (next) {
          window.localStorage.setItem("start-to-up-active-workspace", next);
          setSnapshot(await loadWorkspaceSnapshot(next));
        } else setSnapshot(emptySnapshot);
      } catch { if (alive) setSnapshot(emptySnapshot); }
      finally { if (alive) setLoading(false); }
    }
    void load();
    return () => { alive = false; };
  }, [session.session]);

  const active = workspaces.find((workspace) => workspace.organization_id === workspaceId) || workspaces[0];
  const profileFields = ["trading_name", "legal_name", "industry", "email", "phone", "description", "city"];
  const profileCompletion = snapshot.profile ? Math.round(profileFields.filter((key) => Boolean(String(snapshot.profile?.[key] || "").trim())).length / profileFields.length * 100) : 0;
  const openTasks = snapshot.tasks.filter((item) => !["done", "cancelled"].includes(String(item.status || "").toLowerCase()));
  const highTasks = openTasks.filter((item) => ["high", "urgent", "critical"].includes(String(item.priority || "").toLowerCase()));
  const completedTasks = snapshot.tasks.filter((item) => String(item.status || "").toLowerCase() === "done").length;
  const execution = snapshot.tasks.length ? Math.round(completedTasks / snapshot.tasks.length * 100) : null;
  const connectedIntegrations = snapshot.integrations.filter((item) => item.status === "connected").length;
  const stageIndex = Math.max(0, journeyStages.findIndex((item) => item.stage === (preferences?.stage || "launching")));
  const stageInfo = stageOptions.find((item) => item.value === (preferences?.stage || "launching"))!;

  const nextActions = useMemo(() => {
    const actions: Array<{ id: string; title: string; detail: string; path: string }> = [];
    for (const task of [...highTasks, ...openTasks.filter((item) => !highTasks.includes(item))].slice(0, 3)) {
      actions.push({ id: `task-${task.id}`, title: String(task.title || "Company action"), detail: `${String(task.priority || "normal")} priority · ${String(task.status || "open").replaceAll("_", " ")}`, path: "/app/operations" });
    }
    if (profileCompletion < 80) actions.push({ id: "profile", title: "Complete the company foundation", detail: `Company profile is ${profileCompletion}% complete`, path: "/app/startup-os" });
    if (!connectedIntegrations) actions.push({ id: "integrations", title: "Connect your first operating service", detail: "GitHub, Vercel, analytics, CRM and other company-owned providers", path: "/app/integrations" });
    if (!snapshot.profile?.website) actions.push({ id: "website", title: "Create or connect the company website", detail: "Use Website Studio or add the live company URL", path: "/app/website-studio-templates" });
    if (!actions.length) actions.push({ id: "growth", title: "Choose the next growth objective", detail: "The foundation is stable; move into acquisition, sales or capital", path: "/app/work" });
    return actions.slice(0, 5);
  }, [connectedIntegrations, highTasks, openTasks, profileCompletion, snapshot.profile?.website]);

  const recommendations = useMemo(() => {
    const items: Array<{ title: string; detail: string; path: string }> = [];
    if (highTasks.length) items.push({ title: `${highTasks.length} high-priority action${highTasks.length === 1 ? "" : "s"} need ownership`, detail: "Resolve operating risk before adding more work.", path: "/app/operations" });
    if (profileCompletion < 70) items.push({ title: "Company Intelligence will improve with a stronger profile", detail: "Add industry, description, location and company contacts once, then reuse them across modules.", path: "/app/startup-os" });
    if (connectedIntegrations < 2) items.push({ title: "Your operating data is still mostly manual", detail: "Connect approved company-owned services to strengthen live signals.", path: "/app/integrations" });
    if ((preferences?.stage === "revenue" || preferences?.stage === "scaling") && metricValue(snapshot, "revenue") === "No signal") items.push({ title: "Revenue stage without a recorded revenue signal", detail: "Add or connect revenue data so decisions are based on evidence.", path: "/app/revenue" });
    if (!items.length) items.push({ title: "The operating foundation looks controlled", detail: "Use Work to choose the next company objective instead of opening modules at random.", path: "/app/work" });
    return items.slice(0, 3);
  }, [connectedIntegrations, highTasks.length, preferences?.stage, profileCompletion, snapshot]);

  if (session.loading || loading) return <AppShell title="Today" eyebrow="COMPANY COMMAND CENTRE"><div className="phase0-loading"><Activity className="spin"/> Restoring your operating context…</div></AppShell>;
  if (!session.session || session.session.user.is_anonymous) return <AppShell title="Today" eyebrow="COMPANY COMMAND CENTRE"><AuthDeferred /></AppShell>;

  if (!workspaces.length) {
    return <AppShell title="Today" eyebrow="COMPANY COMMAND CENTRE"><section className="phase0-onboarding-card"><Building2/><span>YOUR FIRST COMPANY WORKSPACE</span><h2>Start with one company. Every operating module will share it.</h2><p>Create the company foundation before using revenue, finance, legal, growth, funding and intelligence workflows.</p><Link to="/app/startup-os" className="button button-primary">Create company workspace <ArrowRight size={16}/></Link></section></AppShell>;
  }

  return <AppShell title="Today" eyebrow="COMPANY COMMAND CENTRE">
    <div className="operating-command-centre">
      <section className="operating-hero">
        <div className="operating-hero-copy"><span>{active?.name?.toUpperCase() || "ACTIVE COMPANY"}</span><h2>Focus on what moves the company forward today.</h2><p>Start To Up now prioritises actions, live company signals and unfinished work instead of presenting the full platform at once.</p></div>
        <aside className="operating-stage-card"><span>CURRENT COMPANY STAGE</span><strong>{stageInfo.label}</strong><p>{stageInfo.description}</p><Link to="/app/work" className="button button-secondary">Open guided work</Link></aside>
      </section>

      <section className="operating-section">
        <div className="operating-section-head"><div><span>WHAT NOW</span><h3>Your next actions</h3></div><Link to="/app/operations">Open operations →</Link></div>
        <div className="operating-action-grid">{nextActions.map((item, index) => <Link key={item.id} to={item.path as any} className="operating-action-card"><i>{index + 1}</i><div><strong>{item.title}</strong><span>{item.detail}</span></div><ArrowRight size={16}/></Link>)}</div>
      </section>

      <section className="operating-section">
        <div className="operating-section-head"><div><span>COMPANY PULSE</span><h3>Signals that matter now</h3></div><Link to="/app/startup-os">Company foundation →</Link></div>
        <div className="operating-pulse-grid">
          <article className="operating-pulse-card"><span>Foundation</span><strong>{profileCompletion}%</strong><small>shared company profile completeness</small></article>
          <article className="operating-pulse-card"><span>Execution</span><strong>{execution == null ? "—" : `${execution}%`}</strong><small>{openTasks.length} open company actions</small></article>
          <article className="operating-pulse-card"><span>Integrations</span><strong>{connectedIntegrations}</strong><small>connected operating providers</small></article>
          <article className="operating-pulse-card"><span>Revenue signal</span><strong>{metricValue(snapshot, "revenue")}</strong><small>latest workspace revenue metric</small></article>
          <article className="operating-pulse-card"><span>Risk attention</span><strong>{highTasks.length}</strong><small>high-priority unresolved actions</small></article>
        </div>
      </section>

      <section className="operating-section">
        <div className="operating-section-head"><div><span>COMPANY JOURNEY</span><h3>Know where you are and what comes next</h3></div><Link to="/app/work">Change operating stage →</Link></div>
        <div className="operating-journey">{journeyStages.map((item, index) => <Link key={item.stage} to={item.path as any} className={index === stageIndex ? "active" : index < stageIndex ? "complete" : ""}><b>{item.label}</b><span>{item.verb}</span></Link>)}</div>
      </section>

      <div className="operating-two-column">
        <section className="operating-panel"><header><h3>Continue working</h3><Link to="/app/work">All work</Link></header>{recent.length ? <div className="operating-list">{recent.slice(0, 6).map((item) => <a key={item.path} href={item.path} className="operating-list-row"><i><Clock3 size={14}/></i><div><strong>{item.label}</strong><span>{item.path}</span></div><small>{relativeWorkTime(item.visitedAt)}</small></a>)}</div> : <div className="operating-empty"><strong>No recent work yet.</strong><span>Open a company tool and Start To Up will place it here for one-click continuation.</span><Link className="button button-secondary" to="/app/work">Choose work</Link></div>}</section>
        <section className="operating-panel"><header><h3>Recommended</h3><Link to="/app/intelligence">Intelligence</Link></header><div className="operating-list">{recommendations.map((item) => <article className="operating-recommendation" key={item.title}><Sparkles size={16}/><div><strong>{item.title}</strong><span>{item.detail}</span></div><Link to={item.path as any}>Open</Link></article>)}</div></section>
      </div>

      <div className="operating-two-column">
        <section className="operating-panel"><header><h3>Company timeline</h3><Link to="/app/startup-os">Full activity</Link></header>{snapshot.activity.length ? <div className="operating-list">{snapshot.activity.slice(0, 8).map((item) => <article className="operating-list-row" key={item.id}><i><Activity size={14}/></i><div><strong>{item.summary || String(item.action).replaceAll("_", " ")}</strong><span>{String(item.entity_type || item.action || "company activity").replaceAll("_", " ")}</span></div><small>{item.created_at ? new Date(item.created_at).toLocaleDateString() : ""}</small></article>)}</div> : <div className="operating-empty"><strong>Your company timeline starts here.</strong><span>Audited workspace actions will appear as the company operates.</span></div>}</section>
        <section className="operating-panel"><header><h3>Workspace control</h3><Link to="/app/startup-os">Manage</Link></header><div className="operating-list"><article className="operating-list-row"><i><UsersRound size={14}/></i><div><strong>{snapshot.members.length} workspace member{snapshot.members.length === 1 ? "" : "s"}</strong><span>role-controlled access</span></div><CheckCircle2 size={15}/></article><article className="operating-list-row"><i><ShieldCheck size={14}/></i><div><strong>{snapshot.verifications.filter((item) => item.status === "verified").length} verified record{snapshot.verifications.filter((item) => item.status === "verified").length === 1 ? "" : "s"}</strong><span>public-safe trust signals only</span></div><CheckCircle2 size={15}/></article><article className="operating-list-row"><i><ListTodo size={14}/></i><div><strong>{openTasks.length} open action{openTasks.length === 1 ? "" : "s"}</strong><span>{highTasks.length ? `${highTasks.length} need priority attention` : "no high-priority task signal"}</span></div>{highTasks.length ? <CircleAlert size={15}/> : <Gauge size={15}/>}</article><article className="operating-list-row"><i><PlugZap size={14}/></i><div><strong>{connectedIntegrations} connected integration{connectedIntegrations === 1 ? "" : "s"}</strong><span>company-owned service connections</span></div><ArrowRight size={15}/></article></div></section>
      </div>
    </div>
  </AppShell>;
}
