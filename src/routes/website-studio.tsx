import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Code2, Eye, Github, LayoutTemplate, Palette, Smartphone, Sparkles } from "lucide-react";
import { businessCategories } from "../lib/website-studio";
import "../website-studio.css";

export const Route = createFileRoute("/website-studio")({
  component: WebsiteStudioServicePage,
  head: () => ({
    meta: [
      { title: "Website Studio | Start To Up" },
      {
        name: "description",
        content: "Start To Up Website Studio turns a proven premium website system into responsive, branded websites for businesses across industries, with live preview and managed GitHub publishing.",
      },
    ],
  }),
});

function WebsiteStudioServicePage() {
  return (
    <div className="website-studio-public">
      <header className="landing-header shell-width">
        <Link to="/" preload="intent" aria-label="Start To Up home">
          <img className="brand-logo" src="/brand/start-to-up-logo-primary.png" alt="Start To Up" />
        </Link>
        <nav className="landing-nav" aria-label="Website Studio navigation">
          <a href="#features">Features</a>
          <a href="#categories">Categories</a>
          <a href="#template">Template</a>
        </nav>
        <div className="header-actions">
          <Link preload="intent" to="/app/website-studio" className="button button-primary">Open Website Studio</Link>
        </div>
      </header>

      <main>
        <section className="studio-public-hero">
          <div className="shell-width studio-public-grid">
            <div className="studio-public-copy">
              <span className="section-label">START TO UP WEBSITE STUDIO</span>
              <h1>Build a premium business website without starting from zero.</h1>
              <p>
                Website Studio turns the design discipline behind ResKonnect into a reusable business website system. Choose the category, add the brand, edit the content, preview every device and prepare the finished site for managed GitHub publishing.
              </p>
              <div className="studio-public-actions">
                <Link preload="intent" to="/app/website-studio" className="button button-primary button-large">Build a website <ArrowRight /></Link>
                <a href="#features" className="button button-secondary button-large">See how it works</a>
              </div>
            </div>
            <div className="studio-public-browser" aria-label="Website Studio preview example">
              <header><i /><i /><i /><span>business.preview.start-to-up.co.za</span></header>
              <div className="studio-public-demo">
                <span>RESKONNECT PREMIUM WEBSITE SYSTEM</span>
                <h2>One design system. Any serious business.</h2>
                <p>Professional structure, responsive layouts, clear calls to action and conversion-focused business content.</p>
                <div className="studio-public-demo-grid"><div>Responsive navigation</div><div>Services & proof</div><div>Contact conversion</div></div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="studio-public-section shell-width">
          <div className="studio-public-heading">
            <span>BUILT FOR BUSINESSES WE WORK WITH</span>
            <h2>A managed website builder, not a disposable page generator.</h2>
            <p>Every project keeps its brand, business content, SEO settings, preview state, version history and publication destination together.</p>
          </div>
          <div className="studio-feature-grid">
            <Feature icon={<LayoutTemplate />} title="Proven template system" text="Start with the ResKonnect Premium layout language, then adapt the content and structure to the business category." />
            <Feature icon={<Palette />} title="Brand controls" text="Change logo, colour system, surfaces and corner style once and update the entire generated website." />
            <Feature icon={<Eye />} title="Live preview" text="Edit on the left while desktop, tablet and mobile previews respond immediately on the right." />
            <Feature icon={<Smartphone />} title="Mobile-first output" text="Generated sites include responsive navigation, flexible grids, readable typography and phone-safe calls to action." />
            <Feature icon={<Code2 />} title="Portable website export" text="Download the generated HTML and a structured site blueprint instead of locking the business into one platform forever." />
            <Feature icon={<Github />} title="Managed GitHub publishing" text="Prepare a repository destination and versioned publication request so Start To Up can sync approved sites into GitHub." />
          </div>
        </section>

        <section id="categories" className="studio-public-section" style={{ background: "#f3f6fb" }}>
          <div className="shell-width">
            <div className="studio-public-heading">
              <span>ONE TEMPLATE · MANY BUSINESS MODELS</span>
              <h2>Category-aware starter content.</h2>
              <p>The template changes its language, service defaults, trust points and customer journey according to the type of business.</p>
            </div>
            <div className="studio-category-grid">
              {businessCategories.map((category) => <article key={category.key}><strong>{category.label}</strong><span>{category.description}</span></article>)}
            </div>
          </div>
        </section>

        <section id="template" className="studio-public-section shell-width">
          <div className="studio-source-banner">
            <Sparkles />
            <div><span>CANONICAL TEMPLATE SOURCE</span><h3>ResKonnect Premium</h3><p>Derived from the design system and responsive product patterns in the ResKonnect codebase, while removing student-accommodation-specific application logic so the system can serve any industry.</p></div>
            <Link preload="intent" to="/app/website-studio" className="button">Use this template</Link>
          </div>
        </section>

        <section className="studio-public-section shell-width">
          <div className="studio-public-cta">
            <div><h2>Start with the business. The studio builds the website around it.</h2><p>Set up the category, brand, content and publication destination in one workspace.</p></div>
            <Link preload="intent" to="/app/website-studio" className="button button-large">Open Website Studio <ArrowRight /></Link>
          </div>
        </section>
      </main>
    </div>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <article>{icon}<h3>{title}</h3><p>{text}</p></article>;
}
