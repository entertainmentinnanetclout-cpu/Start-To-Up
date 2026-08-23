import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  Compass,
  Handshake,
  Home,
  Menu,
  MessageCircle,
  Plus,
  Play,
  Radio,
  Search,
  ShieldCheck,
  UserRound,
  WalletCards,
} from "lucide-react";
import type { ReactNode } from "react";

const navigation = [
  { to: "/app/home", label: "Home", icon: Home, primary: false },
  { to: "/app/explore", label: "Explore", icon: Compass, primary: false },
  { to: "/app/create", label: "Create", icon: Plus, primary: true },
  { to: "/app/network", label: "Network", icon: MessageCircle, primary: false },
  { to: "/app/profile", label: "Profile", icon: UserRound, primary: false },
] as const;

const trustNavigation = [
  { to: "/app/collaboration", label: "Collaborate", icon: Handshake },
  { to: "/app/messages", label: "Messages", icon: MessageCircle },
  { to: "/app/organizations", label: "Organizations", icon: Building2 },
  { to: "/app/trust", label: "Trust centre", icon: ShieldCheck },
] as const;

const scaleNavigation = [
  { to: "/app/media", label: "Media V2", icon: Play },
  { to: "/app/sessions", label: "Live studio", icon: Radio },
  { to: "/app/creator", label: "Creator studio", icon: BarChart3 },
  { to: "/app/watchlist", label: "Investor watchlist", icon: WalletCards },
  { to: "/app/programs", label: "Programs", icon: CalendarDays },
  { to: "/app/plans", label: "Plans", icon: WalletCards },
] as const;

const mobileNavigation = [
  navigation[0],
  navigation[1],
  navigation[2],
  { to: "/app/media", label: "Media", icon: Play, primary: false },
  navigation[3],
  navigation[4],
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
  return (
    <div className="app-frame">
      <aside className="desktop-sidebar">
        <Link to="/" aria-label="Start To Up landing page">
          <img className="sidebar-logo" src="/brand/start-to-up-logo-primary.png" alt="Start To Up" />
        </Link>
        <nav aria-label="Application navigation">
          {navigation.map(({ to, label, icon: Icon, primary }) => (
            <Link key={to} to={to} className={`sidebar-link ${path === to ? "active" : ""} ${primary ? "create-link" : ""}`}>
              <Icon size={21} /><span>{label}</span>
            </Link>
          ))}
          <span className="sidebar-section-label">COLLABORATION & TRUST</span>
          {trustNavigation.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className={`sidebar-link ${path === to ? "active" : ""}`}>
              <Icon size={19} /><span>{label}</span>
            </Link>
          ))}
          <span className="sidebar-section-label">MEDIA &amp; SCALE</span>
          {scaleNavigation.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className={`sidebar-link ${path === to ? "active" : ""}`}>
              <Icon size={19} /><span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-trust">
          <img src="/brand/start-to-up-symbol.png" alt="" />
          <strong>Innovation-only network</strong>
          <span>Protected sharing is active.</span>
        </div>
        <Link to="/" className="sidebar-back">← Public website</Link>
      </aside>
      <div className="app-content">
        <header className="app-header">
          <div className="mobile-brand"><img src="/brand/start-to-up-symbol.png" alt="Start To Up" /><Menu size={22} /></div>
          <div><span className="page-eyebrow">{eyebrow ?? "START TO UP"}</span><h1>{title}</h1></div>
          <div className="app-header-actions">
            <label className="app-search"><Search size={18} /><input aria-label="Search Start To Up" placeholder="Search innovations" /></label>
            <Link to="/app/media" aria-label="Media recommendations and notifications" className="icon-button"><Bell size={20} /><i /></Link>
            {action}
          </div>
        </header>
        <main className="app-main">{children}</main>
      </div>
      <nav className="mobile-navigation" aria-label="Mobile navigation">
        {mobileNavigation.map(({ to, label, icon: Icon, primary }) => (
          <Link key={to} to={to} className={`${path === to ? "active" : ""} ${primary ? "mobile-create" : ""}`}>
            <Icon size={primary ? 25 : 21} /><span>{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
