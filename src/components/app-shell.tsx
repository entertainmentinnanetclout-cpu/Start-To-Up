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
  X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

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
  { to: "/app/media", label: "Media", icon: Play },
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
  navigation[4],
] as const;

const mobileMoreNavigation = [
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

  useEffect(() => setMobileMenuOpen(false), [path]);
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

  return (
    <div className="app-frame">
      <aside className="desktop-sidebar">
        <Link to="/" preload="intent" aria-label="Start To Up landing page">
          <img className="sidebar-logo" src="/brand/start-to-up-logo-primary.png" alt="Start To Up" decoding="async" />
        </Link>
        <nav aria-label="Application navigation">
          {navigation.map(({ to, label, icon: Icon, primary }) => (
            <Link preload="intent" key={to} to={to} className={`sidebar-link ${path === to ? "active" : ""} ${primary ? "create-link" : ""}`}>
              <Icon size={21} /><span>{label}</span>
            </Link>
          ))}
          <span className="sidebar-section-label">COLLABORATION &amp; TRUST</span>
          {trustNavigation.map(({ to, label, icon: Icon }) => (
            <Link preload="intent" key={to} to={to} className={`sidebar-link ${path === to ? "active" : ""}`}>
              <Icon size={19} /><span>{label}</span>
            </Link>
          ))}
          <span className="sidebar-section-label">MEDIA &amp; SCALE</span>
          {scaleNavigation.map(({ to, label, icon: Icon }) => (
            <Link preload="intent" key={to} to={to} className={`sidebar-link ${path === to ? "active" : ""}`}>
              <Icon size={19} /><span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-trust">
          <img src="/brand/start-to-up-symbol.png" alt="" loading="lazy" decoding="async" />
          <strong>Innovation-only network</strong>
          <span>Protected sharing is active.</span>
        </div>
        <Link preload="intent" to="/" className="sidebar-back">← Public website</Link>
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
          <Link
            preload="intent"
            key={to}
            to={to}
            aria-current={path === to ? "page" : undefined}
            className={`${path === to ? "active" : ""} ${primary ? "mobile-create" : ""}`}
          >
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
              <div>
                <span>START TO UP</span>
                <strong>Everything you need to build.</strong>
              </div>
              <button type="button" onClick={() => setMobileMenuOpen(false)} aria-label="Close navigation menu"><X /></button>
            </header>
            <div className="mobile-menu-grid">
              {mobileMoreNavigation.map(({ to, label, icon: Icon, description }) => (
                <Link preload="intent" key={to} to={to} className={path === to ? "active" : ""}>
                  <Icon />
                  <div><strong>{label}</strong><span>{description}</span></div>
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
    </div>
  );
}
