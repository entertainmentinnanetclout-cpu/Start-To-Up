import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  Lightbulb,
  LockKeyhole,
  Network,
  Play,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";

// No head() here: the home route inherits title/description/og/twitter from
// __root.tsx, and ships no og:image so serve-time hosting can inject the
// project's social preview (explicit og:image or latest screenshot).
export const Route = createFileRoute("/")({
  component: Index,
});

// IMPORTANT: Replace this placeholder. See ./README.md for routing conventions.
function Index() {
  return (
    <div className="landing-page">
      <header className="landing-header shell-width">
        <Link to="/" aria-label="Start To Up home">
          <img
            className="brand-logo"
            src="/brand/start-to-up-logo-primary.png"
            alt="Start To Up — From Ideas to Impact"
          />
        </Link>
        <nav className="landing-nav" aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#protection">Protection</a>
          <a href="#community">Community</a>
        </nav>
        <div className="header-actions">
          <Link to="/auth" className="button button-ghost">
            Sign in
          </Link>
          <Link to="/onboarding" className="button button-primary">
            Join the network
          </Link>
        </div>
      </header>

      <main>
        <section className="hero shell-width">
          <div className="hero-copy">
            <div className="eyebrow">
              <Sparkles size={15} /> Africa's protected innovation network
            </div>
            <h1>
              Turn what you are building into <span>visible impact.</span>
            </h1>
            <p className="hero-lead">
              Share projects, document progress, find serious collaborators and connect your
              innovation with the people and opportunities that can move it forward.
            </p>
            <div className="hero-actions">
              <Link to="/onboarding" className="button button-primary button-large">
                Join the Innovation Network <ArrowRight size={18} />
              </Link>
              <Link to="/app/explore" className="button button-secondary button-large">
                <Play size={17} /> Explore innovations
              </Link>
            </div>
            <div className="trust-row">
              <span>
                <ShieldCheck size={17} /> Protected sharing
              </span>
              <span>
                <BadgeCheck size={17} /> Contribution history
              </span>
              <span>
                <Users size={17} /> Serious collaborators
              </span>
            </div>
          </div>
          <div className="hero-visual" aria-label="Start To Up innovation feed preview">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <article className="hero-feed-card">
              <div className="feed-card-head">
                <div className="avatar avatar-gradient">NK</div>
                <div>
                  <strong>Naledi Khumalo</strong>
                  <span>Engineer · Pretoria</span>
                </div>
                <span className="stage-badge">Prototype</span>
              </div>
              <div className="prototype-visual">
                <div className="prototype-grid" />
                <div className="prototype-device">
                  <Lightbulb size={34} />
                  <span>SolarSense</span>
                </div>
              </div>
              <div className="feed-card-body">
                <span className="content-kicker">BUILD UPDATE · CLEAN ENERGY</span>
                <h3>Our low-cost solar monitor passed its first field test.</h3>
                <div className="progress-line">
                  <span />
                </div>
                <div className="feed-stats">
                  <span>1.2K supporters</span>
                  <span>34 can help</span>
                  <span>18 collaborators</span>
                </div>
              </div>
            </article>
            <div className="floating-card floating-top">
              <TrendingUp size={18} />
              <div>
                <strong>+24%</strong>
                <span>Build progress</span>
              </div>
            </div>
            <div className="floating-card floating-bottom">
              <Network size={18} />
              <div>
                <strong>8 matches</strong>
                <span>Recommended collaborators</span>
              </div>
            </div>
          </div>
        </section>

        <section className="signal-strip" aria-label="Platform audiences">
          <div className="shell-width signal-inner">
            <span>FOUNDERS</span>
            <i />
            <span>DEVELOPERS</span>
            <i />
            <span>RESEARCHERS</span>
            <i />
            <span>TECHNICIANS</span>
            <i />
            <span>INVESTORS</span>
            <i />
            <span>INSTITUTIONS</span>
          </div>
        </section>

        <section id="how-it-works" className="section shell-width">
          <div className="section-heading">
            <span>BUILT FOR PROGRESS</span>
            <h2>More than a social feed.</h2>
            <p>Every interaction is designed to move genuine innovation forward.</p>
          </div>
          <div className="feature-grid">
            <FeatureCard
              number="01"
              icon={<Lightbulb />}
              title="Show what you're building"
              text="Turn prototypes, research and technical work into rich project profiles and visual Build Reels."
            />
            <FeatureCard
              number="02"
              icon={<Network />}
              title="Find the missing person"
              text="Discover co-founders, engineers, technicians, researchers, mentors and institutional partners."
            />
            <FeatureCard
              number="03"
              icon={<TrendingUp />}
              title="Prove your progress"
              text="Document milestones, contributions and evidence in a chronological Build Journey."
            />
          </div>
        </section>

        <section id="protection" className="protection-section">
          <div className="shell-width protection-grid">
            <div className="protection-mark">
              <img src="/brand/start-to-up-symbol.png" alt="" />
              <div className="protection-ring">
                <LockKeyhole />
              </div>
            </div>
            <div className="protection-copy">
              <span className="section-label">SHARE WITH CONTROL</span>
              <h2>Your work deserves more than a disclaimer.</h2>
              <p>
                Projects begin privately. You decide who can see them, when they can access them and
                what confidentiality terms apply.
              </p>
              <ul>
                <li>
                  <ShieldCheck /> Four visibility levels, private by default
                </li>
                <li>
                  <ShieldCheck /> Protected access requests and confidentiality acceptance
                </li>
                <li>
                  <ShieldCheck /> Timestamped evidence and contribution history
                </li>
              </ul>
              <p className="legal-note">
                Protection tools support evidence and access control; they do not automatically
                create a patent or guarantee against copying.
              </p>
            </div>
          </div>
        </section>

        <section id="community" className="section shell-width final-cta">
          <img src="/brand/start-to-up-symbol.png" alt="" />
          <span className="section-label">FROM IDEAS TO IMPACT</span>
          <h2>The next breakthrough may already be under construction.</h2>
          <p>Join the network built for the people doing the work.</p>
          <Link to="/onboarding" className="button button-primary button-large">
            Create your Innovation Passport <ArrowRight size={18} />
          </Link>
        </section>
      </main>
      <footer className="landing-footer">
        <div className="shell-width">
          <img src="/brand/start-to-up-logo-white.png" alt="Start To Up" />
          <p>Share safely. Build visibly. Grow together.</p>
          <span>© 2026 Start To Up. Legal policies require professional review before launch.</span>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  number,
  icon,
  title,
  text,
}: {
  number: string;
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <article className="feature-card">
      <div className="feature-card-top">
        <span>{number}</span>
        <div>{icon}</div>
      </div>
      <h3>{title}</h3>
      <p>{text}</p>
      <ArrowRight size={19} />
    </article>
  );
}
