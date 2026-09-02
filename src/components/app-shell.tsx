import { Link, useRouterState } from "@tanstack/react-router";
import {
  BadgeDollarSign,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Cloud,
  CloudOff,
  Compass,
  Handshake,
  Home,
  Inbox,
  LayoutDashboard,
  LayoutTemplate,
  LoaderCircle,
  LogOut,
  Menu,
  MessageCircle,
  PanelLeftClose,
  PanelLeftOpen,
  PlugZap,
  Plus,
  Radio,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserRound,
  WalletCards,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "../integrations/supabase/client";
import { listStartupWorkspaces, recordSessionActivity, type StartupWorkspace } from "../lib/startup-os-foundation";
import {
  operatingRoutes,
  personaOptions,
  readOperatingPreferences,
  readSavedViews,
  recordRecentWork,
  routeLabel,
  saveCurrentView,
  saveOperatingPreferences,
  stageOptions,
  suggestedRoutePaths,
  type CompanyStage,
  type OperatingPersona,
  type OperatingPreferences,
  type SavedView,
} from "../lib/ux-operating-layer";
import { OperatingCreateLauncher } from "./operating-create-launcher";
import { WebsiteStudioV6Enhancements } from "./website-studio-v6-enhancements";
import "../app-shell-v6.css";
import "../startup-os.css";
import "../ux-operating-layer.css";
import "../website-studio-power-tools.css";

const primaryNavigation = [
  { to: "/app/home", label: "Today", icon: Home },
  { to: "/app/work", label: "Work", icon: BriefcaseBusiness },
  { to: "/app/create", label: "Create", icon: Plus, primary: true },
  { to: "/app/inbox", label: "Inbox", icon: Inbox },
  { to: "/app/profile", label: "Me", icon: UserRound },
] as const;

const allTools = [
  { to: "/app/startup-os", label: "Company foundation", icon: LayoutDashboard },
  { to: "/app/validate", label: "Validate & research", icon: Compass },
  { to: "/app/revenue", label: "Revenue OS", icon: BadgeDollarSign },
  { to: "/app/growth", label: "Growth", icon: TrendingUp },
  { to: "/app/operations", label: "Operations", icon: BriefcaseBusiness },
  { to: "/app/compliance", label: "Legal & compliance", icon: ShieldCheck },
  { to: "/app/funding", label: "Funding & investors", icon: WalletCards },
  { to: "/app/opportunities", label: "Opportunities", icon: Handshake },
  { to: "/app/intelligence", label: "Intelligence", icon: Sparkles },
  { to: "/app/integrations", label: "Integrations", icon: PlugZap },
  { to: "/app/website-studio-templates", label: "Website templates", icon: LayoutTemplate },
  { to: "/app/website-studio-v6", label: "Website Studio", icon: LayoutTemplate },
  { to: "/app/collaboration", label: "Collaboration", icon: Handshake },
  { to: "/app/messages", label: "Messages", icon: MessageCircle },
  { to: "/app/network", label: "Network", icon: Compass },
  { to: "/app/sessions", label: "Live studio", icon: Radio },
  { to: "/app/creator", label: "Creator studio", icon: BarChart3 },
  { to: "/app/watchlist", label: "Investor watchlist", icon: WalletCards },
  { to: "/app/organizations", label: "Organizations", icon: Building2 },
  { to: "/app/trust", label: "Trust centre", icon: ShieldCheck },
  { to: "/app/programs", label: "Programs", icon: CalendarDays },
] as const;

type SaveState = "idle" | "saving" | "saved" | "unsaved" | "offline";
type SaveStateDetail = { state: SaveState; label?: string };
type EntityPeek = {
  kind?: string;
  name: string;
  subtitle?: string;
  detail?: string;
  badge?: string;
  links?: Array<{ label: string; path: string }>;
};

const screenHelp: Record<string, { title: string; description: string; steps: string[] }> = {
  "/app/home": { title: "Today", description: "Your company operating screen. It prioritises work that needs attention instead of showing every possible metric.", steps: ["Review the next actions.", "Check the company pulse for missing signals.", "Continue the most recent piece of work."] },
  "/app/work": { title: "Work", description: "A task-based launcher for every Start To Up capability.", steps: ["Start with the recommended tools for your stage.", "Use the company journey when you are unsure what comes next.", "Save recurring views for faster return visits."] },
  "/app/inbox": { title: "Inbox", description: "One place for conversations, company actions and audited activity.", steps: ["Handle high-priority actions first.", "Open project conversations from Messages.", "Use filters to focus on one workstream."] },
  "/app/website-studio-v6": { title: "Website Studio", description: "Build and publish a production website from one shared draft.", steps: ["Select any visible element in the preview.", "Use Focus mode when you need more canvas space.", "Run Publish check before production release."] },
  "/app/website-studio-v6-pro": { title: "Website Studio Pro", description: "A direct visual editing workspace using the same canonical website draft.", steps: ["Tap or click an element once to select it.", "Adjust content, design, layout or responsive rules.", "Run Publish check before release."] },
};

export function AppShell({ children, title, eyebrow, action }: { children: ReactNode; title: string; eyebrow?: string; action?: ReactNode; }) {
  const path = useRouterState({ select: (state) => state.location.pathname });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => typeof window === "undefined" ? false : window.localStorage.getItem("start-to-up-sidebar-collapsed") === "true");
  const [allToolsOpen, setAllToolsOpen] = useState(() => typeof window !== "undefined" && window.localStorage.getItem("start-to-up-all-tools-open") === "true");
  const [signedIn, setSignedIn] = useState(false);
  const [workspaces, setWorkspaces] = useState<StartupWorkspace[]>([]);
  const [workspaceId, setWorkspaceId] = useState(() => typeof window === "undefined" ? "" : window.localStorage.getItem("start-to-up-active-workspace") || "");
  const [preferences, setPreferences] = useState<OperatingPreferences | null>(() => readOperatingPreferences());
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);
  const [persona, setPersona] = useState<OperatingPersona>(() => readOperatingPreferences()?.persona || "founder");
  const [stage, setStage] = useState<CompanyStage>(() => readOperatingPreferences()?.stage || "launching");
  const [savedViews, setSavedViews] = useState<SavedView[]>(() => readSavedViews());
  const [saveState, setSaveState] = useState<SaveState>(() => typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "idle");
  const [saveLabel, setSaveLabel] = useState("");
  const [entityPeek, setEntityPeek] = useState<EntityPeek | null>(null);

  const activeWorkspace = useMemo(() => workspaces.find((workspace) => workspace.organization_id === workspaceId) || workspaces[0], [workspaces, workspaceId]);
  const suggestedPaths = useMemo(() => suggestedRoutePaths(preferences), [preferences]);
  const suggestedTools = useMemo(() => suggestedPaths.map((suggested) => allTools.find((tool) => tool.to === suggested)).filter(Boolean) as Array<(typeof allTools)[number]>, [suggestedPaths]);
  const help = screenHelp[path] || { title, description: "This screen is part of your active Start To Up workspace.", steps: ["Use Command Search for any task or module.", "Switch the active company from the header when needed.", "Use Work when you want a guided route instead of navigating modules manually."] };

  useEffect(() => { setMobileMenuOpen(false); setHelpOpen(false); setEntityPeek(null); recordRecentWork(path, title); }, [path, title]);
  useEffect(() => { window.localStorage.setItem("start-to-up-sidebar-collapsed", String(sidebarCollapsed)); }, [sidebarCollapsed]);
  useEffect(() => { window.localStorage.setItem("start-to-up-all-tools-open", String(allToolsOpen)); }, [allToolsOpen]);

  useEffect(() => {
    let heartbeat: ReturnType<typeof window.setInterval> | undefined;
    let alive = true;
    async function syncWorkspaceState(active: boolean) {
      setSignedIn(active);
      if (!active) { setWorkspaces([]); return; }
      void recordSessionActivity();
      try {
        const rows = await listStartupWorkspaces();
        if (!alive) return;
        setWorkspaces(rows);
        const stored = window.localStorage.getItem("start-to-up-active-workspace") || "";
        const next = rows.some((workspace) => workspace.organization_id === stored) ? stored : rows[0]?.organization_id || "";
        setWorkspaceId(next);
        if (next) window.localStorage.setItem("start-to-up-active-workspace", next);
      } catch { if (alive) setWorkspaces([]); }
    }
    void supabase.auth.getSession().then(({ data }) => {
      const active = Boolean(data.session);
      void syncWorkspaceState(active);
      if (active) heartbeat = window.setInterval(() => void recordSessionActivity(), 5 * 60 * 1000);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => void syncWorkspaceState(Boolean(session)));
    return () => { alive = false; if (heartbeat) window.clearInterval(heartbeat); data.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (signedIn && !preferences && !onboardingDismissed) setOnboardingOpen(true);
  }, [signedIn, preferences, onboardingDismissed]);

  useEffect(() => {
    const onPreference = () => setPreferences(readOperatingPreferences());
    const onViews = () => setSavedViews(readSavedViews());
    const onSaveState = (event: Event) => {
      const detail = (event as CustomEvent<SaveStateDetail>).detail;
      if (!detail || !["idle", "saving", "saved", "unsaved", "offline"].includes(detail.state)) return;
      setSaveState(detail.state);
      setSaveLabel(detail.label || "");
      if (detail.state === "saved") window.setTimeout(() => setSaveState((current) => current === "saved" ? "idle" : current), 2800);
    };
    const onEntityPeek = (event: Event) => {
      const detail = (event as CustomEvent<EntityPeek>).detail;
      if (detail?.name) setEntityPeek(detail);
    };
    const onOffline = () => { setSaveState("offline"); setSaveLabel("Offline"); };
    const onOnline = () => { setSaveState("idle"); setSaveLabel(""); };
    window.addEventListener("start-to-up:operating-preferences", onPreference);
    window.addEventListener("start-to-up:saved-views", onViews);
    window.addEventListener("start-to-up:save-state", onSaveState as EventListener);
    window.addEventListener("start-to-up:entity-peek", onEntityPeek as EventListener);
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("start-to-up:operating-preferences", onPreference);
      window.removeEventListener("start-to-up:saved-views", onViews);
      window.removeEventListener("start-to-up:save-state", onSaveState as EventListener);
      window.removeEventListener("start-to-up:entity-peek", onEntityPeek as EventListener);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setCommandOpen(true); return; }
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === "c") { event.preventDefault(); window.location.assign("/app/create"); return; }
      if (typing || event.metaKey || event.ctrlKey) return;
      if (event.altKey && event.key.toLowerCase() === "h") { event.preventDefault(); window.location.assign("/app/home"); }
      if (event.altKey && event.key.toLowerCase() === "w") { event.preventDefault(); window.location.assign("/app/work"); }
      if (event.altKey && event.key.toLowerCase() === "i") { event.preventDefault(); window.location.assign("/app/inbox"); }
      if (event.key === "Escape") { setCommandOpen(false); setMobileMenuOpen(false); setHelpOpen(false); setEntityPeek(null); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen && !commandOpen && !onboardingOpen && !entityPeek) return;
    document.body.classList.add("mobile-menu-locked");
    return () => document.body.classList.remove("mobile-menu-locked");
  }, [mobileMenuOpen, commandOpen, onboardingOpen, entityPeek]);

  async function signOut() { await supabase.auth.signOut(); window.location.assign("/"); }
  function changeWorkspace(id: string) {
    setWorkspaceId(id);
    window.localStorage.setItem("start-to-up-active-workspace", id);
    window.dispatchEvent(new CustomEvent("start-to-up:workspace-change", { detail: { organizationId: id } }));
    window.location.reload();
  }
  function openWorkspacePeek() {
    if (!activeWorkspace) return;
    setEntityPeek({
      kind: "Company workspace",
      name: activeWorkspace.name,
      subtitle: `${activeWorkspace.role} access`,
      detail: activeWorkspace.is_verified ? "Verified workspace. Company modules share this active operating context." : "Active company workspace. Verification status can be managed from the Trust Centre.",
      badge: activeWorkspace.is_verified ? "Verified" : "Workspace",
      links: [
        { label: "Company foundation", path: "/app/startup-os" },
        { label: "Operations", path: "/app/operations" },
        { label: "Trust centre", path: "/app/trust" },
      ],
    });
  }
  function finishOnboarding() {
    const next = saveOperatingPreferences(persona, stage) || null;
    setPreferences(next);
    setOnboardingOpen(false);
  }
  function go(destination: string) { setCommandOpen(false); setMobileMenuOpen(false); window.location.assign(destination); }

  const search = commandQuery.trim().toLowerCase();
  const filteredRoutes = operatingRoutes.filter((route) => !search || `${route.label} ${route.description} ${route.keywords.join(" ")}`.toLowerCase().includes(search));
  const quickActions = [
    { label: "Create a lead or opportunity", description: "Open Revenue OS", path: "/app/revenue", keywords: "lead sales crm opportunity" },
    { label: "Create a marketing campaign", description: "Open Growth", path: "/app/growth", keywords: "marketing growth campaign content" },
    { label: "Create or review a contract", description: "Open Legal & compliance", path: "/app/compliance", keywords: "legal contract agreement compliance" },
    { label: "Add an investor", description: "Open Funding & investors", path: "/app/funding", keywords: "funding investor capital" },
    { label: "Build a website", description: "Choose a Website Studio template", path: "/app/website-studio-templates", keywords: "website site builder design" },
    { label: "Create a project", description: "Publish work to the network", path: "/app/create?mode=project", keywords: "project create build" },
  ].filter((item) => !search || `${item.label} ${item.description} ${item.keywords}`.toLowerCase().includes(search));
  const saveText = saveLabel || (saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : saveState === "unsaved" ? "Unsaved changes" : saveState === "offline" ? "Offline" : "");
  const SaveIcon = saveState === "saving" ? LoaderCircle : saveState === "saved" ? CheckCircle2 : saveState === "offline" ? CloudOff : Cloud;

  return <div className={`app-frame ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
    <aside className="desktop-sidebar">
      <div className="sidebar-topline">
        <Link to="/" preload="intent" aria-label="Start To Up landing page"><img className="sidebar-logo" src="/brand/start-to-up-logo-primary.png" alt="Start To Up" decoding="async" /></Link>
        <button type="button" className="sidebar-collapse-button" onClick={() => setSidebarCollapsed((value) => !value)} aria-label={sidebarCollapsed ? "Expand navigation" : "Collapse navigation"} title={sidebarCollapsed ? "Expand navigation" : "Collapse navigation"}>{sidebarCollapsed ? <PanelLeftOpen size={18}/> : <PanelLeftClose size={18}/>}<span>{sidebarCollapsed ? "Expand" : "Collapse"}</span></button>
      </div>
      <nav className="desktop-sidebar-scroll" aria-label="Application navigation">
        <div className="operating-sidebar-primary">
          {primaryNavigation.map(({ to, label, icon: Icon, ...item }) => <Link preload="intent" key={to} to={to} title={label} className={`sidebar-link ${path === to ? "active" : ""} ${"primary" in item && item.primary ? "create-link" : ""}`}><Icon size={20}/><span>{label}</span></Link>)}
        </div>
        {suggestedTools.length ? <><span className="sidebar-section-label">FOR YOU</span>{suggestedTools.slice(0, 4).map(({ to, label, icon: Icon }) => <Link preload="intent" key={to} to={to} title={label} className={`sidebar-link ${path === to ? "active" : ""}`}><Icon size={18}/><span>{label}</span></Link>)}</> : null}
        <span className="sidebar-section-label">TOOLS</span>
        <button className="operating-all-tools-toggle" type="button" onClick={() => setAllToolsOpen((value) => !value)} aria-expanded={allToolsOpen}><span>All tools</span>{allToolsOpen ? <ChevronDown size={15}/> : <ChevronRight size={15}/>}</button>
        {allToolsOpen ? <div className="operating-all-tools">{allTools.map(({ to, label, icon: Icon }) => <Link preload="intent" key={to} to={to} title={label} className={`sidebar-link ${path === to ? "active" : ""}`}><Icon size={18}/><span>{label}</span></Link>)}</div> : null}
      </nav>
      <div className="sidebar-footer-zone">
        {!sidebarCollapsed && activeWorkspace ? <button className="sidebar-trust operating-sidebar-company" type="button" onClick={openWorkspacePeek}><Building2/><strong className="operating-workspace-sidebar-copy">{activeWorkspace.name}</strong><span className="operating-workspace-sidebar-copy">Active company workspace · open details</span></button> : null}
        {signedIn ? <button className="sidebar-session-action" onClick={() => void signOut()} title="Sign out"><LogOut size={16}/><span>Sign out</span></button> : <Link to="/auth" className="sidebar-session-action" title="Sign in"><UserRound size={16}/><span>Sign in</span></Link>}
        <Link preload="intent" to="/" className="sidebar-back" title="Public website">← <span>Public website</span></Link>
      </div>
    </aside>

    <div className="app-content">
      <header className="app-header">
        <div className="mobile-brand"><img src="/brand/start-to-up-symbol.png" alt="Start To Up" decoding="async"/><button type="button" className="mobile-menu-trigger" onClick={() => setMobileMenuOpen(true)} aria-label="Open navigation menu" aria-expanded={mobileMenuOpen}><Menu size={22}/></button></div>
        <div><span className="page-eyebrow operating-company-kicker">{eyebrow ?? "START TO UP"}{activeWorkspace ? <><span>·</span><b>{activeWorkspace.name}</b></> : null}</span><h1>{title}</h1></div>
        <div className="app-header-actions">
          {saveState !== "idle" ? <span className={`operating-save-state ${saveState}`} role="status"><SaveIcon className={saveState === "saving" ? "spin" : ""} size={13}/>{saveText}</span> : null}
          {signedIn && workspaces.length ? <div className="operating-workspace-switcher"><span>ACTIVE COMPANY</span><div><select value={activeWorkspace?.organization_id || ""} onChange={(event) => changeWorkspace(event.target.value)} aria-label="Active company workspace">{workspaces.map((workspace) => <option key={workspace.organization_id} value={workspace.organization_id}>{workspace.name}</option>)}</select><button type="button" onClick={openWorkspacePeek} aria-label="Open active company details"><Building2 size={14}/></button></div></div> : null}
          <button className="operating-header-button" type="button" onClick={() => setCommandOpen(true)}><Search size={17}/><span>Command search</span><kbd>⌘K</kbd></button>
          <button className="icon-button" type="button" onClick={() => setHelpOpen((value) => !value)} aria-label="Explain this screen"><CircleHelp size={20}/></button>
          <Link preload="intent" to="/app/inbox" aria-label="Inbox" className="icon-button"><Bell size={20}/><i/></Link>
          {action}
        </div>
      </header>
      <main className="app-main">{path === "/app/create" ? <OperatingCreateLauncher/> : null}{children}</main>
    </div>

    <nav className="mobile-navigation" aria-label="Mobile navigation">{primaryNavigation.map(({ to, label, icon: Icon, ...item }) => <Link preload="intent" key={to} to={to} aria-current={path === to ? "page" : undefined} className={`${path === to ? "active" : ""} ${"primary" in item && item.primary ? "mobile-create" : ""}`}><span className="mobile-nav-icon"><Icon size={"primary" in item && item.primary ? 24 : 21}/></span><span className="mobile-nav-label">{label}</span></Link>)}</nav>

    {helpOpen ? <aside className="operating-help-popover" role="dialog" aria-label="Screen guide"><header><h3>{help.title}</h3><button type="button" onClick={() => setHelpOpen(false)} aria-label="Close screen guide"><X size={18}/></button></header><p>{help.description}</p><ol>{help.steps.map((step) => <li key={step}>{step}</li>)}</ol></aside> : null}

    {entityPeek ? <div className="operating-entity-layer" role="dialog" aria-modal="true" aria-label={`${entityPeek.name} details`}><button type="button" className="operating-entity-backdrop" onClick={() => setEntityPeek(null)} aria-label="Close entity details"/><aside className="operating-entity-drawer"><header><div><span>{entityPeek.kind || "DETAILS"}</span><h2>{entityPeek.name}</h2><p>{entityPeek.subtitle || "Start To Up entity"}</p></div><button type="button" onClick={() => setEntityPeek(null)} aria-label="Close entity details"><X/></button></header><div className="operating-entity-body">{entityPeek.badge ? <b className="operating-entity-badge">{entityPeek.badge}</b> : null}{entityPeek.detail ? <p>{entityPeek.detail}</p> : null}<div className="operating-entity-actions">{(entityPeek.links || []).map((link) => <a href={link.path} key={`${link.path}-${link.label}`}>{link.label}<ChevronRight size={14}/></a>)}</div><small>Any module can open this same non-destructive peek surface through the shared `start-to-up:entity-peek` contract.</small></div></aside></div> : null}

    {mobileMenuOpen ? <div className="mobile-menu-layer" role="dialog" aria-modal="true" aria-label="Start To Up navigation"><button type="button" className="mobile-menu-backdrop" aria-label="Close menu" onClick={() => setMobileMenuOpen(false)}/><section className="mobile-menu-sheet"><header><div><span>START TO UP</span><strong>{activeWorkspace?.name || "Your operating workspace"}</strong></div><button type="button" onClick={() => setMobileMenuOpen(false)} aria-label="Close navigation menu"><X/></button></header><div className="mobile-menu-grid"><div className="operating-mobile-menu-summary"><strong>{preferences ? `${personaOptions.find((item) => item.value === preferences.persona)?.label} · ${stageOptions.find((item) => item.value === preferences.stage)?.label}` : "Personalise Start To Up"}</strong><span>{preferences ? "Your recommended tools adapt to this operating context." : "Choose your role and company stage to simplify the workspace."}</span>{!preferences ? <button className="button button-secondary" type="button" onClick={() => { setMobileMenuOpen(false); setOnboardingOpen(true); }}>Set up my workspace</button> : null}</div>{workspaces.length ? <label className="operating-mobile-company"><span>ACTIVE COMPANY</span><select value={activeWorkspace?.organization_id || ""} onChange={(event) => changeWorkspace(event.target.value)}>{workspaces.map((workspace) => <option key={workspace.organization_id} value={workspace.organization_id}>{workspace.name}</option>)}</select></label> : null}<div className="operating-mobile-tool-grid">{suggestedTools.map(({ to, label }) => <Link key={to} to={to}><strong>{label}</strong><span>{operatingRoutes.find((route) => route.path === to)?.description || "Open tool"}</span></Link>)}</div><Link to="/app/work" className="rail-link">Open all work tools <ChevronRight size={15}/></Link></div><footer><Link preload="intent" to="/startup-playbook">Startup playbook</Link><Link preload="intent" to="/">Public website</Link></footer></section></div> : null}

    {commandOpen ? <div className="operating-command-layer" role="dialog" aria-modal="true" aria-label="Command search"><button className="operating-command-backdrop" type="button" aria-label="Close command search" onClick={() => setCommandOpen(false)}/><section className="operating-command"><header><div><span>COMMAND CENTRE</span><h2>Go anywhere. Start any job.</h2><p>Search by outcome instead of remembering which module contains the feature.</p></div><button className="operating-modal-close" onClick={() => setCommandOpen(false)} aria-label="Close command search"><X/></button></header><div className="operating-command-search"><label><Search size={19}/><input autoFocus value={commandQuery} onChange={(event) => setCommandQuery(event.target.value)} placeholder="Try ‘invoice’, ‘website’, ‘investor’, ‘contract’…"/></label></div><div className="operating-command-list">{quickActions.length ? <><div className="operating-command-group">Quick actions</div>{quickActions.map((item) => <button type="button" key={item.label} className="operating-command-item" onClick={() => go(item.path)}><span className="operating-command-icon"><Zap size={16}/></span><div><strong>{item.label}</strong><span>{item.description}</span></div></button>)}</> : null}{filteredRoutes.length ? <><div className="operating-command-group">Destinations</div>{filteredRoutes.slice(0, 14).map((item) => <button type="button" key={item.path} className="operating-command-item" onClick={() => go(item.path)}><span className="operating-command-icon"><ChevronRight size={16}/></span><div><strong>{item.label}</strong><span>{item.description}</span></div><kbd>{item.group}</kbd></button>)}</> : null}{savedViews.length ? <><div className="operating-command-group">Saved views</div>{savedViews.slice(0, 6).map((item) => <button type="button" key={item.id} className="operating-command-item" onClick={() => go(item.path)}><span className="operating-command-icon"><Check size={16}/></span><div><strong>{item.name}</strong><span>{routeLabel(item.path)}</span></div></button>)}</> : null}{!quickActions.length && !filteredRoutes.length ? <div className="operating-command-empty">No matching task or destination. Try a broader word.</div> : null}<button type="button" className="operating-command-item" onClick={() => { saveCurrentView(`${routeLabel(path)} view`, `${path}${window.location.search}`); setSavedViews(readSavedViews()); }}><span className="operating-command-icon"><Plus size={16}/></span><div><strong>Save current view</strong><span>Return to this route and filter state from Command Search.</span></div><kbd>Saved views</kbd></button></div></section></div> : null}

    {onboardingOpen ? <div className="operating-modal-layer" role="dialog" aria-modal="true" aria-label="Personalise Start To Up"><button className="operating-modal-backdrop" aria-label="Close onboarding" onClick={() => { setOnboardingOpen(false); setOnboardingDismissed(true); }}/><section className="operating-modal"><header><div><span>PERSONAL OPERATING LAYER</span><h2>Make Start To Up fit the work you actually do.</h2><p>Choose your role and company stage. We use this only to prioritise navigation, recommendations and the company journey; no capability is removed.</p></div><button className="operating-modal-close" onClick={() => { setOnboardingOpen(false); setOnboardingDismissed(true); }} aria-label="Close onboarding"><X/></button></header><div className="operating-onboarding-body"><div className="operating-choice-group"><strong>1. Which role best describes you?</strong><div className="operating-choice-grid">{personaOptions.map((option) => <button type="button" key={option.value} className={persona === option.value ? "active" : ""} onClick={() => setPersona(option.value)}><strong>{option.label}</strong><span>{option.description}</span></button>)}</div></div><div className="operating-choice-group"><strong>2. Where is the company right now?</strong><div className="operating-choice-grid">{stageOptions.map((option) => <button type="button" key={option.value} className={stage === option.value ? "active" : ""} onClick={() => setStage(option.value)}><strong>{option.label}</strong><span>{option.description}</span></button>)}</div></div><div className="operating-modal-actions"><small>You can change this later from Work.</small><button className="button button-primary" type="button" onClick={finishOnboarding}>Personalise my workspace</button></div></div></section></div> : null}

    {path === "/app/website-studio-v6" ? <WebsiteStudioV6Enhancements/> : path === "/app/website-studio-v6-pro" ? <WebsiteStudioV6Enhancements frameSelector='.v6pro-preview-frame iframe[title="Interactive exact template preview"]' forceExactPreview={false} showIntegrations={false}/> : null}
  </div>;
}
