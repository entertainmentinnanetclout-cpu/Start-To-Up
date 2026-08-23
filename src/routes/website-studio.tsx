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
import "../website-studio.css";

export const Route = createFileRoute("/website-studio")({
  component: WebsiteStudioServicePage,
  head: () => ({
    meta: [
      { title: "Website Studio | Start To Up" },
      {
        name: "description",
        content: "Build, customise and export complete business websites with GitHub, Vercel, Supabase and Lovable workflows. Download a portable Vite/React source ZIP ready to deploy without code changes.",
      },
    ],
  }),
});

function WebsiteStudioServicePage() {
  return (
    <div className="website-studio-public">
      <header className="landing-header shell-width">
        <Link to="/" preload="intent" aria-label="Start To Up home"><img className="brand-logo" src="/brand/start-to-up-logo-primary.png" alt="Start To Up" /></Link>
        <nav className="landing-nav" aria-label="Website Studio navigation"><a href="#features">Features</a><a href="#integrations">Integrations</a><a href="#categories">Categories</a><a href="#portability">Source export</a></nav>
        <div className="header-actions"><Link preload="intent" to="/app/website-studio" className="button button-primary">Open Website Studio</Link></div>
      </header>

      <main>
        <section className="studio-public-hero">
          <div className="shell-width studio-public-grid">
            <div className="studio-public-copy">
              <span className="section-label">START TO UP WEBSITE STUDIO V2</span>
              <h1>Build the website. Own the entire project.</h1>
              <p>Website Studio turns the premium design discipline behind ResKonnect into a reusable system for any business. Customise the brand and layout, connect development infrastructure, preview every device, then export the complete Vite/React source project or deploy it through managed workflows.</p>
              <div className="studio-public-actions"><Link preload="intent" to="/app/website-studio" className="button button-primary button-large">Build a website <ArrowRight /></Link><a href="#portability" className="button button-secondary button-large">See the source export</a></div>
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

        <section id="features" className="studio-public-section shell-width">
          <div className="studio-public-heading"><span>MORE THAN A PAGE BUILDER</span><h2>Design controls, operational integrations and portable code.</h2><p>Every project keeps its brand, business content, responsive design settings, SEO, version history, source package and deployment destinations together.</p></div>
          <div className="studio-feature-grid">
            <Feature icon={<LayoutTemplate/>} title="ResKonnect Premium system" text="Start from reusable product-grade layout patterns instead of rebuilding basic website structure for every client."/>
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
            <Link preload="intent" to="/app/website-studio" className="button">Build and export</Link>
          </div>
        </section>

        <section id="categories" className="studio-public-section" style={{ background: "#f3f6fb" }}>
          <div className="shell-width">
            <div className="studio-public-heading"><span>ONE SYSTEM · MANY BUSINESS MODELS</span><h2>Category-aware starter content.</h2><p>Website Studio changes the language, service defaults, trust points and customer journey according to the business type.</p></div>
            <div className="studio-category-grid">{businessCategories.map((category) => <article key={category.key}><strong>{category.label}</strong><span>{category.description}</span></article>)}</div>
          </div>
        </section>

        <section className="studio-public-section shell-width">
          <div className="studio-public-cta"><div><h2>Build it in Start To Up. Take the source anywhere.</h2><p>Create the business website, connect its infrastructure and export a repository-ready project from one workspace.</p></div><Link preload="intent" to="/app/website-studio" className="button button-large">Open Website Studio <ArrowRight /></Link></div>
        </section>
      </main>
    </div>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <article>{icon}<h3>{title}</h3><p>{text}</p></article>;
}
