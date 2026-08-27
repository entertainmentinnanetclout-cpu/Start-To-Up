import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Blocks,
  Building2,
  Check,
  Code2,
  GraduationCap,
  Handshake,
  LayoutTemplate,
  Lightbulb,
  Mail,
  Network,
  Phone,
  ShieldCheck,
  Target,
  Users,
  WalletCards,
} from "lucide-react";
import { BrandPreloader } from "../components/brand-preloader";
import { CompanyCarousel } from "../components/company-carousel";
import { EditorialShowcasePost } from "../components/editorial-showcase";
import { GenZHero } from "../components/genz-hero";
import { DataState } from "../components/live-data-ui";
import { useEditorialShowcases } from "../lib/start-to-up-data";
import "../genz-landing.css";

export const Route = createFileRoute("/")({ component: Index });

const audiences = [
  "Founders & startups",
  "Innovators & developers",
  "Researchers & technicians",
  "Growing businesses",
  "Investors & experts",
  "Institutions & government",
] as const;

const operatingTips = [
  { icon: Target, title: "Validate before building", text: "Use customer evidence to prove the problem, urgency and willingness to pay before expanding product scope." },
  { icon: WalletCards, title: "Protect runway", text: "Track burn, cash timing and the 13-week forecast. A startup can grow revenue and still run out of cash." },
  { icon: Users, title: "One owner per outcome", text: "Give every critical metric, decision and delivery one directly responsible owner instead of shared ambiguity." },
  { icon: BarChart3, title: "Run a small metric stack", text: "Measure acquisition, activation, retention, revenue and unit economics—not a dashboard full of vanity activity." },
  { icon: Handshake, title: "Build a sales cadence", text: "Every real opportunity needs a stage, owner, next action, decision process and expected close date." },
  { icon: ShieldCheck, title: "Scale repeatability", text: "Document what works before adding people, markets and automation. Scaling chaos makes the company weaker." },
] as const;

function Index() {
  const showcases = useEditorialShowcases();

  return (
    <div className="landing-page company-landing">
      <BrandPreloader />
      <header className="landing-header shell-width">
        <Link preload="intent" to="/" aria-label="Start To Up home">
          <img className="brand-logo" src="/brand/start-to-up-logo-primary.png" alt="Start To Up" decoding="async" />
        </Link>
        <nav className="landing-nav" aria-label="Main navigation">
          <Link preload="intent" to="/startup-playbook">Startup playbook</Link>
          <Link preload="intent" to="/website-studio">Website Studio</Link>
          <a href="#services">Services</a>
          <a href="#network">Network</a>
          <a href="#ventures">Ventures</a>
        </nav>
        <div className="header-actions">
          <a href="#contact" className="button button-ghost">Work with us</a>
          <Link preload="intent" to="/app/home" className="button button-primary">Enter the network</Link>
        </div>
      </header>

      <main>
        <GenZHero />
        <CompanyCarousel />

        <section className="signal-strip" aria-label="Start To Up operating capabilities">
          <div className="shell-width signal-inner">
            <span>VALIDATE</span><i />
            <span>BUILD</span><i />
            <span>SELL</span><i />
            <span>OPERATE</span><i />
            <span>FUND</span><i />
            <span>SCALE</span>
          </div>
        </section>

        <section className="section shell-width startup-authority-section">
          <div className="section-heading startup-authority-heading">
            <span>STARTUP INTELLIGENCE</span>
            <h2>Learn how to run the company—not only how to start one.</h2>
            <p>
              Start To Up combines company-building services with a practical operating playbook for
              validation, product, cash, sales, hiring, investor readiness and controlled growth.
            </p>
          </div>
          <div className="startup-tip-grid">
            {operatingTips.map(({ icon: Icon, title, text }) => (
              <article key={title}>
                <Icon />
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
          <div className="startup-authority-cta">
            <div>
              <strong>12 operating modules. One founder reference.</strong>
              <span>From problem validation to funding and scale.</span>
            </div>
            <Link preload="intent" to="/startup-playbook" className="button button-primary button-large">
              Open the Startup Playbook <ArrowRight />
            </Link>
          </div>
        </section>

        <section id="ventures" className="ventures-section">
          <div className="shell-width">
            <div className="ventures-heading">
              <div>
                <span className="section-label">VENTURES &amp; PRODUCTS</span>
                <h2>Proof lives in what we build.</h2>
              </div>
              <p>
                Start To Up develops and supports products that solve real problems, build communities
                and create measurable paths forward.
              </p>
            </div>
            <DataState loading={showcases.loading} error={showcases.error} empty={!showcases.data.length}>
              <div className="landing-product-stage">
                {showcases.data.slice(0, 1).map((showcase) => (
                  <EditorialShowcasePost compact key={showcase.id} showcase={showcase} />
                ))}
              </div>
            </DataState>
            <div className="venture-pipeline">
              <span>BUILD WITH THE COMPANY</span>
              <strong>Strategy, product, technology, market execution and collaboration can move through one operating relationship.</strong>
              <a href="#contact">Start a venture conversation <ArrowRight /></a>
            </div>
          </div>
        </section>

        <section id="services" className="section shell-width company-services">
          <div className="section-heading">
            <span>START TO UP SERVICES</span>
            <h2>Company-building support from first evidence to scale.</h2>
            <p>
              The work is structured around practical company outcomes: validate the opportunity,
              build the product, establish commercial traction and install systems that can grow.
            </p>
          </div>
          <div className="company-service-grid">
            <ServiceCard icon={<Lightbulb />} title="Venture strategy" text="Problem validation, business modelling, market positioning, founder roadmaps and commercial readiness." />
            <ServiceCard icon={<Code2 />} title="Product & technology" text="Premium websites, platforms, prototypes, business systems and production-minded software development." />
            <ServiceCard icon={<LayoutTemplate />} title="Website Studio" text="Create branded, responsive business websites from premium template systems, preview every device and export deployment-ready source." to="/website-studio" />
            <ServiceCard icon={<Blocks />} title="Brand & go-to-market" text="Brand foundations, product storytelling, launch preparation, distribution and early customer acquisition." />
            <ServiceCard icon={<BarChart3 />} title="Operations & scale" text="Metrics, process design, financial control, partnerships, operating cadence and scalable growth systems." />
            <ServiceCard icon={<GraduationCap />} title="Founder development" text="Practical startup operating education, expert sessions, playbooks and structured company-building programmes." />
            <ServiceCard icon={<Building2 />} title="Institutional ecosystems" text="Innovation, youth entrepreneurship, venture-development and enterprise programmes for institutions." />
          </div>
        </section>

        <section id="network" className="network-company-section">
          <div className="shell-width network-company-grid">
            <div>
              <span className="section-label">THE DIGITAL OPERATING NETWORK</span>
              <h2>Start To Up Network</h2>
              <p>
                A professional network where developers, entrepreneurs, innovators, investors and
                institutions discover serious work and move quickly into project collaboration.
              </p>
              <ul className="company-check-list">
                <li><Check /> Project profiles, Build Reels and milestone journeys</li>
                <li><Check /> Native collaboration rooms, tasks, files and decisions</li>
                <li><Check /> Media, live sessions, pitch rooms and creator intelligence</li>
                <li><Check /> Investor watchlists, protected sharing and trust controls</li>
              </ul>
              <Link preload="intent" to="/app/home" className="button button-primary button-large">
                Enter Start To Up Network <ArrowRight size={18} />
              </Link>
            </div>
            <div className="network-identity-card">
              <img src="/brand/start-to-up-symbol.png" alt="" loading="lazy" decoding="async" />
              <span>ONE STARTUP ECOSYSTEM</span>
              <strong>Learn clearly.<br />Build professionally.<br />Operate intentionally.</strong>
              <div><Network /><span>Professional startup network</span></div>
              <div><Handshake /><span>Structured in-app collaboration</span></div>
              <div><ShieldCheck /><span>Controlled project visibility</span></div>
            </div>
          </div>
        </section>

        <section className="section shell-width audience-section">
          <div className="section-heading">
            <span>BUILT FOR THE ECOSYSTEM</span>
            <h2>One company. One network. Different paths to progress.</h2>
          </div>
          <div className="audience-grid">
            {audiences.map((audience, index) => (
              <article key={audience}><span>0{index + 1}</span><strong>{audience}</strong><ArrowRight /></article>
            ))}
          </div>
        </section>

        <section id="contact" className="section shell-width contact-section">
          <div className="contact-copy">
            <span className="section-label">LET&apos;S BUILD WHAT&apos;S NEXT</span>
            <h2>Bring the ambition. Start To Up helps structure the company around it.</h2>
            <p>
              For startup strategy, digital product development, operations, partnerships,
              investor readiness or institutional programmes, speak directly with Start To Up.
            </p>
          </div>
          <div className="contact-card">
            <a href="mailto:starttoscale@gmail.com"><Mail /><div><span>EMAIL</span><strong>starttoscale@gmail.com</strong></div></a>
            <a href="tel:+27751995752"><Phone /><div><span>CALL / WHATSAPP</span><strong>075 199 5752</strong></div></a>
            <a className="button button-primary button-large" href="mailto:starttoscale@gmail.com?subject=Start%20To%20Up%20Startup%20Enquiry">
              Start a conversation <ArrowRight />
            </a>
          </div>
        </section>
      </main>

      <footer className="landing-footer company-footer">
        <div className="shell-width">
          <div>
            <img src="/brand/start-to-up-logo-white.png" alt="Start To Up" loading="lazy" decoding="async" />
            <p>Connect. Build. Launch. Upscale.</p>
          </div>
          <div className="footer-links">
            <Link preload="intent" to="/startup-playbook">Startup playbook</Link>
            <Link preload="intent" to="/website-studio">Website Studio</Link>
            <a href="#services">Services</a>
            <a href="#network">Network</a>
            <a href="#ventures">Ventures</a>
            <Link preload="intent" to="/company">Company &amp; verification</Link>
          </div>
          <span>© 2026 Start To Up Innovation Group (Pty) Ltd • Reg. 2026/672029/07 • SARS income-tax registered • B-BBEE Level 1 Contributor.</span>
        </div>
      </footer>
    </div>
  );
}

function ServiceCard({ icon, title, text, to }: { icon: React.ReactNode; title: string; text: string; to?: "/website-studio" }) {
  const content = <><div>{icon}</div><h3>{title}</h3><p>{text}</p><ArrowRight /></>;
  return to ? <Link preload="intent" to={to} className="company-service-card">{content}</Link> : <article className="company-service-card">{content}</article>;
}
