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
  Lightbulb,
  Mail,
  Network,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { BrandPreloader } from "../components/brand-preloader";
import { CompanyCarousel } from "../components/company-carousel";
import { EditorialShowcasePost } from "../components/editorial-showcase";
import { DataState } from "../components/live-data-ui";
import { useEditorialShowcases } from "../lib/start-to-up-data";

export const Route = createFileRoute("/")({ component: Index });

const audiences = [
  "Founders & startups",
  "Innovators & developers",
  "Researchers & technicians",
  "Growing businesses",
  "Investors & experts",
  "Institutions & government",
] as const;

function Index() {
  const showcases = useEditorialShowcases();
  return (
    <div className="landing-page company-landing">
      <BrandPreloader />
      <header className="landing-header shell-width">
        <Link to="/" aria-label="Start To Up home">
          <img className="brand-logo" src="/brand/start-to-up-logo-primary.png" alt="Start To Up" />
        </Link>
        <nav className="landing-nav" aria-label="Main navigation">
          <a href="#services">Services</a>
          <a href="#network">Network</a>
          <a href="#ventures">Ventures</a>
          <a href="#contact">Contact</a>
        </nav>
        <div className="header-actions">
          <a href="#contact" className="button button-ghost">
            Work with us
          </a>
          <Link to="/app/home" className="button button-primary">
            Enter the network
          </Link>
        </div>
      </header>

      <main>
        <CompanyCarousel />

        <section className="signal-strip" aria-label="Start To Up capabilities">
          <div className="shell-width signal-inner">
            <span>STRATEGY</span>
            <i />
            <span>PRODUCT</span>
            <i />
            <span>TECHNOLOGY</span>
            <i />
            <span>BRANDING</span>
            <i />
            <span>NETWORK</span>
            <i />
            <span>GROWTH</span>
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
                Start To Up develops and supports products that solve real problems, build
                communities and create measurable paths forward.
              </p>
            </div>
            <DataState
              loading={showcases.loading}
              error={showcases.error}
              empty={!showcases.data.length}
            >
              <div className="landing-product-stage">
                {showcases.data.slice(0, 1).map((showcase) => (
                  <EditorialShowcasePost compact key={showcase.id} showcase={showcase} />
                ))}
              </div>
            </DataState>
            <div className="venture-pipeline">
              <span>NEXT IN THE PIPELINE</span>
              <strong>
                More ventures are being designed around innovation, digital infrastructure and youth
                advancement.
              </strong>
              <a href="#contact">
                Build a venture with us <ArrowRight />
              </a>
            </div>
          </div>
        </section>

        <section id="services" className="section shell-width company-services">
          <div className="section-heading">
            <span>START TO UP SERVICES</span>
            <h2>Professional support for every stage of the build.</h2>
            <p>
              Focused assistance for founders and businesses that need more than advice—they need a
              practical route forward.
            </p>
          </div>
          <div className="company-service-grid">
            <ServiceCard
              icon={<Lightbulb />}
              title="Venture strategy"
              text="Idea validation, business modelling, market positioning, roadmaps and founder readiness."
            />
            <ServiceCard
              icon={<Code2 />}
              title="Digital products"
              text="Premium websites, platforms, business systems, prototypes and software development."
            />
            <ServiceCard
              icon={<Blocks />}
              title="Brand & launch"
              text="Brand foundations, digital presence, product storytelling and go-to-market preparation."
            />
            <ServiceCard
              icon={<BarChart3 />}
              title="Growth & upscale"
              text="Operational improvement, digital transformation, partnerships and scalable growth systems."
            />
            <ServiceCard
              icon={<GraduationCap />}
              title="Founder development"
              text="Workshops, expert sessions, practical learning and structured venture-building programmes."
            />
            <ServiceCard
              icon={<Building2 />}
              title="Ecosystem programmes"
              text="Innovation, youth entrepreneurship and enterprise-development programmes for institutions."
            />
          </div>
        </section>

        <section id="network" className="network-company-section">
          <div className="shell-width network-company-grid">
            <div>
              <span className="section-label">THE DIGITAL ENGINE</span>
              <h2>Start To Up Network</h2>
              <p>
                A focused social network where serious builders showcase work, document progress,
                find collaborators, learn from experts and connect with opportunity.
              </p>
              <ul className="company-check-list">
                <li>
                  <Check /> Project profiles, Build Reels and milestone journeys
                </li>
                <li>
                  <Check /> Founder, researcher, developer and technician discovery
                </li>
                <li>
                  <Check /> Protected sharing and contribution evidence
                </li>
                <li>
                  <Check /> Collaboration, expert programmes and innovation media
                </li>
              </ul>
              <Link to="/app/home" className="button button-primary button-large">
                Enter Start To Up Network <ArrowRight size={18} />
              </Link>
            </div>
            <div className="network-identity-card">
              <img src="/brand/start-to-up-symbol.png" alt="" />
              <span>ONE ECOSYSTEM</span>
              <strong>
                Connect socially.
                <br />
                Build professionally.
                <br />
                Grow intentionally.
              </strong>
              <div>
                <Network />
                <span>Innovation-only community</span>
              </div>
              <div>
                <Handshake />
                <span>Structured collaboration</span>
              </div>
              <div>
                <ShieldCheck />
                <span>Controlled project visibility</span>
              </div>
            </div>
          </div>
        </section>

        <section className="section shell-width audience-section">
          <div className="section-heading">
            <span>BUILT FOR THE ECOSYSTEM</span>
            <h2>One platform. Different paths to progress.</h2>
          </div>
          <div className="audience-grid">
            {audiences.map((audience, index) => (
              <article key={audience}>
                <span>0{index + 1}</span>
                <strong>{audience}</strong>
                <ArrowRight />
              </article>
            ))}
          </div>
        </section>

        <section id="contact" className="section shell-width contact-section">
          <div className="contact-copy">
            <span className="section-label">LET&apos;S BUILD WHAT&apos;S NEXT</span>
            <h2>Bring us the ambition. We’ll help shape the route forward.</h2>
            <p>
              For startup support, digital product development, partnerships or institutional
              programmes, speak directly with Start To Up.
            </p>
          </div>
          <div className="contact-card">
            <a href="mailto:starttoscale@gmail.com">
              <Mail />
              <div>
                <span>EMAIL</span>
                <strong>starttoscale@gmail.com</strong>
              </div>
            </a>
            <a href="tel:+27751995752">
              <Phone />
              <div>
                <span>CALL / WHATSAPP</span>
                <strong>075 199 5752</strong>
              </div>
            </a>
            <a
              className="button button-primary button-large"
              href="mailto:starttoscale@gmail.com?subject=Start%20To%20Up%20Enquiry"
            >
              Start a conversation <ArrowRight />
            </a>
          </div>
        </section>
      </main>

      <footer className="landing-footer company-footer">
        <div className="shell-width">
          <div>
            <img src="/brand/start-to-up-logo-white.png" alt="Start To Up" />
            <p>Connect. Build. Launch. Upscale.</p>
          </div>
          <div className="footer-links">
            <a href="#services">Services</a>
            <a href="#network">Network</a>
            <a href="#ventures">Ventures</a>
            <Link to="/company">Company &amp; founder</Link>
            <a href="#contact">Contact</a>
          </div>
          <span>
            © 2026 Start To Up. Start To Up Innovation Group registration pending CIPC confirmation.
          </span>
        </div>
      </footer>
    </div>
  );
}

function ServiceCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <article className="company-service-card">
      <div>{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
      <ArrowRight />
    </article>
  );
}
