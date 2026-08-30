import { Link, useRouterState } from "@tanstack/react-router";
import {
  BadgeDollarSign,
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  Compass,
  Handshake,
  Home,
  LayoutDashboard,
  LayoutTemplate,
  LogOut,
  Menu,
  MessageCircle,
  PanelLeftClose,
  PanelLeftOpen,
  PlugZap,
  Plus,
  Play,
  Radio,
  Search,
  ShieldCheck,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "../integrations/supabase/client";
import { recordSessionActivity } from "../lib/startup-os-foundation";
import { WebsiteStudioV6Enhancements } from "./website-studio-v6-enhancements";
import "../app-shell-v6.css";
import "../startup-os.css";

const navigation = [
  { to: "/app/home", label: "Home", icon: Home, primary: false },
  { to: "/app/explore", label: "Explore", icon: Compass, primary: false },
  { to: "/app/create", label: "Create", icon: Plus, primary: true },
  { to: "/app/network", label: "Network", icon: MessageCircle, primary: false },
  { to: "/app/profile", label: "Profile", icon: UserRound, primary: false },
] as const;

const startupOsNavigation = [
  { to: "/app/startup-os", label: "Startup OS", icon: LayoutDashboard },
  { to: "/app/validate", label: "Validate & research", icon: Compass },
  { to: "/app/revenue", label: "Revenue OS", icon: BadgeDollarSign },
  { to: "/app/integrations", label: "Integrations", icon: PlugZap },
] as const;

const trustNavigation = [
  { to: "/app/collaboration", label: "Collaborate", icon: Handshake },
  { to: "/app/messages", label: "Messages", icon: MessageCircle },
  { to: "/app/organizations", label: "Organizations", icon: Building2 },
  { to: "/app/trust", label: "Trust centre", icon: ShieldCheck },
] as const;

const scaleNavigation = [
  { to: "/app/media", label: "Media", icon: Play },
  { to: "/app/sessions", label: "Live studio", icon: Radio },
  { to: "/app/creator", label: "Creator studio", icon: BarChart3 },
  { to: "/app/watchlist", label: "Investor watchlist", icon: WalletCards },
  { to: "/app/website-studio-templates", label: "Website templates", icon: LayoutTemplate },
  { to: "/app/website-studio-v6", label: "Website studio", icon: LayoutTemplate },
  { to: "/app/programs", label: "Programs", icon: CalendarDays },
  { to: "/app/plans", label: "Plans", icon: WalletCards },
] as const;

const mobileNavigation = [
  navigation[0],
  navigation[1],
  navigation[2],
  { to: "/app/startup-os", label: "Startup OS", icon: LayoutDashboard, primary: false },
  navigation[4],
] as const;

const mobileMoreNavigation = [
  { to: "/app/startup-os", label: "Startup OS", icon: LayoutDashboard, description: "Your secure company operating workspace" },
  { to: "/app/validate", label: "Validate & research", icon: Compass, description: "Validate ideas, markets, companies and customer evidence" },
  { to: "/app/revenue", label: "Revenue OS", icon: BadgeDollarSign, description: "CRM, pipeline, proposals, quotes, invoices and customer operations" },
  { to: "/app/integrations", label: "Integrations", icon: PlugZap, description: "Connect external services in three guided steps" },
  { to: "/app/website-studio-templates", label: "Website templates", icon: LayoutTemplate, description: "Choose from premium business starters" },
  { to: "/app/website-studio-v6", label: "Website studio", icon: LayoutTemplate, description: "Build, customize, integrate, export and deploy websites" },
  { to: "/app/collaboration", label: "Collaboration rooms", icon: Handshake, description: "Build with teams inside Start To Up" },
  { to: "/app/messages", label: "Messages", icon: MessageCircle, description: "Continue project conversations" },
  { to: "/app/network", label: "Network", icon: Compass, description: "People, ventures and institutions" },
  { to: "/app/sessions", label: "Live studio", icon: Radio, description: "Live sessions, co-streams and pitches" },
  { to: "/app/creator", label: "Creator studio", icon: BarChart3, description: "Media performance and audience insight" },
  { to: "/app/watchlist", label: "Investor watchlist", icon: WalletCards, description: "Private venture diligence" },
  { to: "/app/organizations", label: "Organizations", icon: Building2, description: "Institution and company spaces" },
  { to: "/app/trust", label: "Trust centre", icon: ShieldCheck, description: "Verification, reporting and protection" },
] as const;

export function AppShell({
  children,
  title,
  eyebrow,
  action,
}: {
  children: ReactNode;
  title: string;
  eyebrow?: string;
  action?: ReactNode;
}) {
  const path = useRouterState({ select: (state) => state.location.pathname });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("start-to-up-sidebar-collapsed") === "true";
  });
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => setMobileMenuOpen(false), [path]);
  useEffect(() => {
    window.localStorage.setItem("start-to-up-sidebar-collapsed", String(sidebarCollapsed));
  }, [sidebarCollapsed]);
  useEffect(() => {
    let heartbeat: ReturnType<typeof window.setInterval> | undefined;
    void supabase.auth.getSession().then(({ data }) => {
      const active = Boolean(data.session);
      setSignedIn(active);
      if (active) {
        void recordSessionActivity();
        heartbeat = window.setInterval(() => void recordSessionActivity(), 5 * 60 * 1000);
      }
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session));
      if (session) void recordSessionActivity();
    });
    return () => {
      if (heartbeat) window.clearInterval(heartbeat);
      data.subscription.unsubscribe();
    };
  }, []);
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && setMobileMenuOpen(false);
    document.addEventListener("keydown", onKeyDown);
    document.body.classList.add("mobile-menu-locked");
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("mobile-menu-locked");
    };
  }, [mobileMenuOpen]);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.assign("/");
  }

  return (
    <div className={`app-frame ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <aside className="desktop-sidebar">
        <div className="sidebar-topline">
          <Link to="/" preload="intent" aria-label="Start To Up landing page">
            <img className="sidebar-logo" src="/brand/start-to-up-logo-primary.png" alt="Start To Up" decoding="async" />
          </Link>
          <button type="button" className="sidebar-collapse-button" onClick={() => setSidebarCollapsed((value) => !value)} aria-label={sidebarCollapsed ? "Expand navigation" : "Collapse navigation"} title={sidebarCollapsed ? "Expand navigation" : "Collapse navigation"}>
            {sidebarCollapsed ? <PanelLeftOpen size={18}/> : <PanelLeftClose size={18}/>}<span>{sidebarCollapsed ? "Expand" : "Collapse"}</span>
          </button>
        </div>
        <nav className="desktop-sidebar-scroll" aria-label="Application navigation">
          {navigation.map(({ to, label, icon: Icon, primary }) => (
            <Link preload="intent" key={to} to={to} title={label} className={`sidebar-link ${path === to ? "active" : ""} ${primary ? "create-link" : ""}`}>
              <Icon size={21} /><span>{label}</span>
            </Link>
          ))}
          <span className="sidebar-section-label">STARTUP OS</span>
          {startupOsNavigation.map(({ to, label, icon: Icon }) => (
            <Link preload="intent" key={to} to={to} title={label} className={`sidebar-link ${path === to ? "active" : ""}`}>
              <Icon size={19} /><span>{label}</span>
            </Link>
          ))}
          <span className="sidebar-section-label">COLLABORATION &amp; TRUST</span>
          {trustNavigation.map(({ to, label, icon: Icon }) => (
            <Link preload="intent" key={to} to={to} title={label} className={`sidebar-link ${path === to ? "active" : ""}`}>
              <Icon size={19} /><span>{label}</span>
            </Link>
          ))}
          <span className="sidebar-section-label">MEDIA &amp; SCALE</span>
          {scaleNavigation.map(({ to, label, icon: Icon }) => (
            <Link preload="intent" key={to} to={to} title={label} className={`sidebar-link ${path === to ? "active" : ""}`}>
              <Icon size={19} /><span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-footer-zone">
          {!sidebarCollapsed ? <div className="sidebar-trust">
            <img src="/brand/start-to-up-symbol.png" alt="" loading="lazy" decoding="async" />
            <strong>Secure company workspace</strong>
            <span>Sessions, permissions and protected sharing are active.</span>
          </div> : null}
          {signedIn ? <button className="sidebar-session-action" onClick={() => void signOut()} title="Sign out"><LogOut size={16}/><span>Sign out</span></button> : <Link to="/auth" className="sidebar-session-action" title="Sign in"><UserRound size={16}/><span>Sign in</span></Link>}
          <Link preload="intent" to="/" className="sidebar-back" title="Public website">← <span>Public website</span></Link>
        </div>
      </aside>

      <div className="app-content">
        <header className="app-header">
          <div className="mobile-brand">
            <img src="/brand/start-to-up-symbol.png" alt="Start To Up" decoding="async" />
            <button type="button" className="mobile-menu-trigger" onClick={() => setMobileMenuOpen(true)} aria-label="Open navigation menu" aria-expanded={mobileMenuOpen}>
              <Menu size={22} />
            </button>
          </div>
          <div><span className="page-eyebrow">{eyebrow ?? "START TO UP"}</span><h1>{title}</h1></div>
          <div className="app-header-actions">
            <label className="app-search"><Search size={18} /><input aria-label="Search Start To Up" placeholder="Search innovations" /></label>
            <Link preload="intent" to="/app/media" aria-label="Media recommendations and notifications" className="icon-button"><Bell size={20} /><i /></Link>
            {action}
          </div>
        </header>
        <main className="app-main">{children}</main>
      </div>

      <nav className="mobile-navigation" aria-label="Mobile navigation">
        {mobileNavigation.map(({ to, label, icon: Icon, primary }) => (
          <Link preload="intent" key={to} to={to} aria-current={path === to ? "page" : undefined} className={`${path === to ? "active" : ""} ${primary ? "mobile-create" : ""}`}>
            <span className="mobile-nav-icon"><Icon size={primary ? 24 : 21} /></span>
            <span className="mobile-nav-label">{label}</span>
          </Link>
        ))}
      </nav>

      {mobileMenuOpen ? (
        <div className="mobile-menu-layer" role="dialog" aria-modal="true" aria-label="Start To Up navigation">
          <button type="button" className="mobile-menu-backdrop" aria-label="Close menu" onClick={() => setMobileMenuOpen(false)} />
          <section className="mobile-menu-sheet">
            <header>
              <div><span>START TO UP</span><strong>Everything you need to build.</strong></div>
              <button type="button" onClick={() => setMobileMenuOpen(false)} aria-label="Close navigation menu"><X /></button>
            </header>
            <div className="mobile-menu-grid">
              {mobileMoreNavigation.map(({ to, label, icon: Icon, description }) => (
                <Link preload="intent" key={to} to={to} className={path === to ? "active" : ""}>
                  <Icon /><div><strong>{label}</strong><span>{description}</span></div>
                </Link>
              ))}
            </div>
            <footer>
              <Link preload="intent" to="/startup-playbook">Startup playbook</Link>
              <Link preload="intent" to="/">Public website</Link>
            </footer>
          </section>
        </div>
      ) : null}
      {path === "/app/website-studio-v6" ? <WebsiteStudioV6Enhancements/> : null}
    </div>
  );
}
