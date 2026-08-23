import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  Cloud,
  Code2,
  Database,
  Eye,
  FileArchive,
  FolderTree,
  Github,
  LayoutTemplate,
  Palette,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { businessCategories } from "../lib/website-studio";
import { studioTemplates } from "../lib/website-studio-template-catalog";
import "../website-studio.css";
import "../website-studio-templates.css";

export const Route = createFileRoute("/website-studio")({
  component: WebsiteStudioServicePage,
  head: () => ({
    meta: [
      { title: "Website Studio | Start To Up" },
      {
        name: "description",
        content: `Choose from ${studioTemplates.length} premium business website systems, customise the brand, connect GitHub, Vercel, Supabase and Lovable, then export a complete deployment-ready Vite/React source ZIP.`,
      },
    ],
  }),
});

function WebsiteStudioServicePage() {
  return (
    <div className="website-studio-public">
      <header className="landing-header shell-width">
        <Link to="/" preload="intent" aria-label="Start To Up home"><img className="brand-logo" src="/brand/start-to-up-logo-primary.png" alt="Start To Up" /></Link>
        <nav className="landing-nav" aria-label="Website Studio navigation"><a href="#templates">Templates</a><a href="#features">Features</a><a href="#integrations">Integrations</a><a href="#categories">Categories</a><a href="#portability">Source export</a></nav>
        <div className="header-actions"><Link preload="intent" to="/app/website-studio-templates" className="button button-primary">Choose a template</Link></div>
      </header>

      <main>
        <section className="studio-public-hero">
          <div className="shell-width studio-public-grid">
            <div className="studio-public-copy">
              <span className="section-label">START TO UP WEBSITE STUDIO V2</span>
              <h1>Premium templates. Full control. Your source.</h1>
              <p>Start from an original Elementor-quality business system, customise the visual language and customer journey, connect the tools around the site, then export the complete Vite/React project or deploy through managed workflows.</p>
              <div className="studio-public-actions"><Link preload="intent" to="/app/website-studio-templates" className="button button-primary button-large">Explore {studioTemplates.length} templates <ArrowRight /></Link><Link preload="intent" to="/app/website-studio" className="button button-secondary button-large">Open current project</Link></div>
            </div>
            <div className="studio-public-browser" aria-label="Website Studio source project example">
              <header><i/><i/><i/><span>website-studio / client-business</span></header>
              <div className="studio-public-demo">
                <span>PORTABLE SOURCE PROJECT</span>
                <h2>One build. GitHub, Vercel, Supabase and Lovable ready.</h2>
                <p>The downloadable project includes application source, assets, environment templates, deployment configuration and integration handoff files.</p>
                <div className="studio-public-demo-grid"><div>src/ + app/</div><div>assets/ + public/</div><div>env/ + config</div></div>
              </div>
            </div>
          </div>
        </section>

        <section id="templates" className="studio-public-section shell-width">
          <div className="studio-public-heading"><span>PREMIUM TEMPLATE LIBRARY</span><h2>{studioTemplates.length} original starting systems for serious businesses.</h2><p>Each template carries a distinct visual direction, colour architecture, typography, hero treatment, navigation, card system and conversion pattern. Choose one, then change everything.</p></div>
          <div className="template-library-grid">
            {studioTemplates.slice(0, 6).map((template) => <article className={`template-card mood-${template.preview.mood}`} key={template.key}>
              <div className="template-card-preview" style={{ "--tp": template.preview.primary, "--ts": template.preview.secondary, "--ta": template.preview.accent, "--tf": template.preview.surface } as React.CSSProperties}>
                <div className="template-browser-bar"><i/><i/><i/><span>{template.name}</span></div>
                <div className="template-mini-nav"><b/><span/><span/><button/></div>
                <div className="template-mini-hero"><div><small>{template.family}</small><strong/><strong/><p/><div><button/><button/></div></div><aside><i/><i/><i/></aside></div>
                <div className="template-mini-cards"><i/><i/><i/></div>
              </div>
              <div className="template-card-body"><div><span>{template.family}</span><h3>{template.name}</h3><p>{template.description}</p></div><Link preload="intent" to="/app/website-studio-templates" className="button button-primary">View template library</Link></div>
            </article>)}
          </div>
          <div style={{ marginTop: 24, textAlign: "center" }}><Link preload="intent" to="/app/website-studio-templates" className="button button-primary button-large">Browse all {studioTemplates.length} templates <ArrowRight/></Link></div>
        </section>

        <section id="features" className="studio-public-section shell-width">
          <div className="studio-public-heading"><span>MORE THAN A PAGE BUILDER</span><h2>Design controls, operational integrations and portable code.</h2><p>Every project keeps its brand, business content, responsive design settings, SEO, version history, source package and deployment destinations together.</p></div>
          <div className="studio-feature-grid">
            <Feature icon={<LayoutTemplate/>} title={`${studioTemplates.length} premium systems`} text="Choose an original design direction for SaaS, property, food, fashion, legal, healthcare, education, events, institutions and more."/>
            <Feature icon={<Palette/>} title="Advanced customisation" text="Control colours, typography, hero layout, navigation style, buttons, cards, radius, content width, spacing, galleries and sections."/>
            <Feature icon={<Eye/>} title="Live responsive preview" text="Desktop, tablet and mobile previews update immediately as the website configuration changes."/>
            <Feature icon={<Smartphone/>} title="Mobile-first output" text="Generated websites contain responsive grids, navigation, calls to action, content hierarchy and conversion-ready contact sections."/>
            <Feature icon={<FileArchive/>} title="Complete code ZIP" text="Download a real source project with app, src, assets, public, env, API, Supabase, GitHub and Lovable folders plus build configuration."/>
            <Feature icon={<Code2/>} title="No platform lock-in" text="The ZIP can be developed locally, committed to GitHub and deployed to Vercel as an independent project."/>
          </div>
        </section>

        <section id="integrations" className="studio-public-section" style={{ background: "#f3f6fb" }}>
          <div className="shell-width">
            <div className="studio-public-heading"><span>INTEGRATION CONTROL PLANE</span><h2>Connect the tools around the website.</h2><p>Start To Up remains the website control plane while each specialist service keeps a clear responsibility.</p></div>
            <div className="studio-feature-grid">
              <Feature icon={<Github/>} title="GitHub source control" text="Publish the same full source tree produced by the ZIP exporter through a managed GitHub App workflow."/>
              <Feature icon={<Cloud/>} title="Vercel deployment" text="Prepare or launch the generated Vite project with the correct install, build and dist output configuration."/>
              <Feature icon={<Database/>} title="Supabase backend" text="Choose Start To Up managed enquiry forms, no backend, or a dedicated external Supabase project using only its public browser credentials."/>
              <Feature icon={<Sparkles/>} title="Lovable development bridge" text="Store the Lovable project/editor/preview connection and ship project knowledge files so advanced AI edits can continue from the same GitHub source."/>
            </div>
          </div>
        </section>

        <section id="portability" className="studio-public-section shell-width">
          <div className="studio-source-banner">
            <FolderTree/>
            <div><span>DEPLOYABLE PROJECT EXPORT</span><h3>Not a screenshot. Not one HTML file. The source tree.</h3><p>The export includes <strong>app/</strong>, <strong>src/</strong>, <strong>assets/</strong>, <strong>public/</strong>, <strong>api/</strong>, <strong>env/</strong>, <strong>scripts/</strong>, <strong>supabase/</strong>, <strong>.github/</strong>, <strong>.lovable/</strong>, package configuration, Vite/TypeScript files, Vercel configuration and deployment documentation.</p></div>
            <Link preload="intent" to="/app/website-studio-templates" className="button">Choose and build</Link>
          </div>
        </section>

        <section id="categories" className="studio-public-section" style={{ background: "#f3f6fb" }}>
          <div className="shell-width">
            <div className="studio-public-heading"><span>ONE SYSTEM · MANY BUSINESS MODELS</span><h2>Category-aware starter content.</h2><p>Website Studio changes the language, service defaults, trust points and customer journey according to the business type.</p></div>
            <div className="studio-category-grid">{businessCategories.map((category) => <article key={category.key}><strong>{category.label}</strong><span>{category.description}</span></article>)}</div>
          </div>
        </section>

        <section className="studio-public-section shell-width">
          <div className="studio-public-cta"><div><h2>Choose the direction. Make it yours. Take the source anywhere.</h2><p>Start with premium design quality, then own the complete website repository and deployment path.</p></div><Link preload="intent" to="/app/website-studio-templates" className="button button-large">Choose a template <ArrowRight /></Link></div>
        </section>
      </main>
    </div>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <article>{icon}<h3>{title}</h3><p>{text}</p></article>;
}