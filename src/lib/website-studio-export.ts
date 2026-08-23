import { normalizeWebsiteDraft, type WebsiteStudioDraft } from "./website-studio";

export type GeneratedProjectFiles = Record<string, string>;

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "ST";
}

function json(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function envLine(key: string, value: string) {
  return value ? `${key}=${value.replace(/\r?\n/g, "")}` : `# ${key}=`;
}

function siteConfigSource(draft: WebsiteStudioDraft) {
  return `export const siteConfig = ${json(draft)} as const;\n`;
}

function packageJson(draft: WebsiteStudioDraft) {
  return json({
    name: draft.slug || "start-to-up-site",
    private: true,
    version: "1.0.0",
    type: "module",
    scripts: {
      dev: "vite",
      build: "tsc -b && vite build",
      preview: "vite preview",
      check: "tsc -b --pretty false",
    },
    dependencies: {
      "@supabase/supabase-js": "^2.112.3",
      "lucide-react": "^0.575.0",
      react: "^19.2.0",
      "react-dom": "^19.2.0",
    },
    devDependencies: {
      "@types/react": "^19.2.0",
      "@types/react-dom": "^19.2.0",
      "@vitejs/plugin-react": "^5.2.0",
      typescript: "^5.8.3",
      vite: "^8.1.5",
    },
  });
}

function brandSvg(draft: WebsiteStudioDraft) {
  const mark = initials(draft.businessName);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="${draft.businessName.replaceAll('"', "&quot;")}"><rect width="512" height="512" rx="128" fill="${draft.brand.secondary}"/><circle cx="388" cy="124" r="96" fill="${draft.brand.accent}" opacity=".9"/><path d="M72 352C168 170 302 118 442 196v188H72Z" fill="${draft.brand.primary}"/><text x="256" y="292" text-anchor="middle" font-family="Arial,sans-serif" font-size="136" font-weight="800" fill="white">${mark}</text></svg>`;
}

function appTsx() {
  return `import type { CSSProperties } from "react";
import { ArrowRight, CheckCircle2, Mail, MapPin, Phone } from "lucide-react";
import { siteConfig } from "./site-config";
import { ContactForm } from "./components/ContactForm";
import "./styles.css";

const site = siteConfig.site;
const brand = siteConfig.brand;

function App() {
  const variables = {
    "--primary": brand.primary,
    "--secondary": brand.secondary,
    "--accent": brand.accent,
    "--surface": brand.surface,
    "--text": brand.text,
    "--radius": \`${brand.radius}px\`,
    "--max": \`${brand.maxWidth}px\`,
    "--section-space": \`${brand.sectionSpacing}px\`,
  } as CSSProperties;

  return (
    <div style={variables} className={\`site card-${brand.cardStyle} nav-${brand.navStyle} button-${brand.buttonStyle}\`}>
      {site.showAnnouncement ? <div className="announcement">{site.announcement}</div> : null}
      <header className="site-header">
        <div className="shell nav-inner">
          <a className="brand" href="#top">
            {brand.logoUrl ? <img src={brand.logoUrl} alt={siteConfig.businessName} /> : <><img className="brand-symbol" src="/assets/brand-mark.svg" alt="" /><strong>{brand.logoText}</strong></>}
          </a>
          <nav><a href="#services">Services</a><a href="#about">About</a><a href="#contact">Contact</a></nav>
          <a className="button primary" href="#contact">{site.primaryCta}<ArrowRight size={16}/></a>
        </div>
      </header>

      <main id="top">
        <section className={\`hero hero-${brand.heroStyle}\`}>
          <div className="shell hero-grid">
            <div className="hero-copy">
              <span className="kicker">{siteConfig.businessName} · {site.location}</span>
              <h1>{site.headline}</h1>
              <p>{site.tagline}</p>
              <div className="hero-actions"><a className="button primary" href="#contact">{site.primaryCta}<ArrowRight size={17}/></a><a className="button secondary" href="#services">{site.secondaryCta}</a></div>
            </div>
            {site.heroImageUrl ? <div className="hero-visual"><img src={site.heroImageUrl} alt={siteConfig.businessName}/></div> : <aside className="hero-card"><span>WELCOME TO {siteConfig.businessName.toUpperCase()}</span><strong>{site.description}</strong><p>Premium digital presence built with Start To Up Website Studio.</p></aside>}
          </div>
        </section>

        {site.showHighlights ? <section className="trust"><div className="shell trust-grid">{site.highlights.map((item) => <article key={item}><CheckCircle2 size={16}/>{item}</article>)}</div></section> : null}
        {site.showStats ? <section className="stats"><div className="shell stats-grid">{site.stats.map((item) => <article key={item.label}><strong>{item.value}</strong><span>{item.label}</span></article>)}</div></section> : null}

        {site.showServices ? <section id="services" className="section"><div className="shell"><SectionHead label="WHAT WE DO" title="Services designed around what your customer needs next." text={site.description}/><div className="services">{site.services.map((service, index) => <article key={service}><span>0{index + 1}</span><h3>{service}</h3><p>Speak to {siteConfig.businessName} about a solution shaped around your requirements.</p></article>)}</div></div></section> : null}

        <section id="about" className="section alt"><div className="shell"><SectionHead label={\`ABOUT ${siteConfig.businessName.toUpperCase()}\`} title={site.headline} text={site.description}/></div></section>

        {site.showProcess ? <section className="section"><div className="shell"><SectionHead label="HOW IT WORKS" title="A clear route from interest to outcome."/><div className="process">{site.process.map((step, index) => <article key={step}><span>0{index + 1}</span><strong>{step}</strong></article>)}</div></div></section> : null}

        {site.showGallery && site.gallery.length ? <section className="section alt"><div className="shell"><SectionHead label="GALLERY" title="See the work and experience."/><div className="gallery">{site.gallery.map((url) => <img key={url} src={url} alt={siteConfig.businessName} loading="lazy"/>)}</div></div></section> : null}

        {site.showTestimonials ? <section className="section alt"><div className="shell"><SectionHead label="CLIENT EXPERIENCE" title="Trust is built in the delivery."/><div className="testimonials">{site.testimonials.map((quote) => <blockquote key={quote}>“{quote}”</blockquote>)}</div></div></section> : null}

        {site.showContact ? <section id="contact" className="section"><div className="shell contact"><div><span className="kicker light">LET'S TALK</span><h2>Ready to take the next step?</h2><p>Contact {siteConfig.businessName} and let us help you move forward.</p><div className="contact-links"><a href={\`mailto:${siteConfig.contact.email}\`}><Mail/> {siteConfig.contact.email}</a><a href={\`tel:${siteConfig.contact.phone.replace(/\\s/g, "")}\`}><Phone/> {siteConfig.contact.phone}</a><span><MapPin/> {siteConfig.contact.address}</span></div></div><ContactForm/></div></section> : null}
      </main>

      <footer><div className="shell footer-inner"><strong>{siteConfig.businessName}</strong><span>Website powered by Start To Up Website Studio.</span></div></footer>
    </div>
  );
}

function SectionHead({ label, title, text }: { label: string; title: string; text?: string }) {
  return <div className="section-head"><span>{label}</span><h2>{title}</h2>{text ? <p>{text}</p> : null}</div>;
}

export default App;
`;
}

function contactFormTsx() {
  return `import { useState } from "react";
import { Send } from "lucide-react";
import { submitLead } from "../lib/lead-submit";
import { siteConfig } from "../site-config";

export function ContactForm() {
  const [state, setState] = useState<"idle"|"sending"|"sent"|"error">("idle");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setState("sending");
    try {
      await submitLead({
        fullName: String(form.get("fullName") || ""),
        email: String(form.get("email") || ""),
        phone: String(form.get("phone") || ""),
        message: String(form.get("message") || ""),
        website: String(form.get("website") || ""),
      });
      event.currentTarget.reset();
      setState("sent");
    } catch {
      setState("error");
    }
  }
  return <form className="contact-form" onSubmit={submit}>
    <input name="website" className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" />
    <label>Name<input name="fullName" required /></label>
    <div className="form-row"><label>Email<input type="email" name="email" required /></label><label>Phone<input name="phone" /></label></div>
    <label>How can we help?<textarea name="message" required rows={5}/></label>
    <button className="button form-submit" disabled={state === "sending"}>{state === "sending" ? "Sending…" : <>Send enquiry <Send size={16}/></>}</button>
    {state === "sent" ? <p className="form-status success">Thank you. Your enquiry has been sent.</p> : null}
    {state === "error" ? <p className="form-status">We couldn't send the form. Email us at <a href={\`mailto:${siteConfig.contact.email}\`}>{siteConfig.contact.email}</a>.</p> : null}
  </form>;
}
`;
}

function leadSubmitTs() {
  return `import { createClient } from "@supabase/supabase-js";

type Lead = { fullName: string; email: string; phone: string; message: string; website?: string };

const managedEndpoint = import.meta.env.VITE_STUDIO_FORM_ENDPOINT as string | undefined;
const projectToken = import.meta.env.VITE_STUDIO_PROJECT_TOKEN as string | undefined;
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export async function submitLead(lead: Lead) {
  if (lead.website) return;
  if (managedEndpoint && projectToken) {
    const response = await fetch(managedEndpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectToken, ...lead, sourceUrl: window.location.href }) });
    if (!response.ok) throw new Error("FORM_SUBMIT_FAILED");
    return;
  }
  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { error } = await supabase.from("contact_submissions").insert({ full_name: lead.fullName, email: lead.email, phone: lead.phone, message: lead.message, source_url: window.location.href });
    if (error) throw error;
    return;
  }
  throw new Error("FORM_BACKEND_NOT_CONFIGURED");
}
`;
}

function stylesCss(draft: WebsiteStudioDraft) {
  return `*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;font-family:"${draft.brand.fontFamily}",Inter,system-ui,-apple-system,sans-serif;color:var(--text);background:#fff}.site{min-height:100vh}.shell{width:min(var(--max),calc(100% - 40px));margin:auto}.announcement{padding:9px 20px;text-align:center;background:var(--secondary);color:#fff;font-size:12px;font-weight:750}.site-header{background:#fff;border-bottom:1px solid #eef1f5;position:relative;z-index:20}.nav-glass .site-header{position:sticky;top:0;background:rgba(255,255,255,.84);backdrop-filter:blur(18px)}.nav-dark .site-header{background:var(--secondary);border-color:transparent}.nav-inner{min-height:76px;display:flex;align-items:center;justify-content:space-between;gap:20px}.brand{display:flex;align-items:center;gap:9px;text-decoration:none;color:var(--secondary)}.nav-dark .brand,.nav-dark .nav-inner nav a{color:#fff}.brand img{max-height:48px;max-width:190px}.brand-symbol{width:34px;height:34px}.brand strong{font-size:16px;letter-spacing:.025em}.nav-inner nav{display:flex;gap:24px}.nav-inner nav a{text-decoration:none;color:#596477;font-size:13px;font-weight:750}.button{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:44px;padding:0 18px;border-radius:12px;font-weight:800;text-decoration:none;border:0;cursor:pointer}.button-pill .button{border-radius:999px}.button-square .button{border-radius:5px}.primary{background:linear-gradient(120deg,var(--primary),var(--accent));color:#fff}.secondary{border:1px solid #dce3ee;color:var(--secondary);background:#fff}.hero{padding:88px 0 82px;background:radial-gradient(circle at 84% 8%,color-mix(in srgb,var(--accent) 18%,transparent),transparent 32%),linear-gradient(180deg,#fbfcff,var(--surface))}.hero-grid{display:grid;grid-template-columns:1.05fr .95fr;gap:58px;align-items:center}.hero-centered .hero-grid,.hero-minimal .hero-grid{display:block;text-align:center;max-width:900px}.hero-centered .hero-copy,.hero-minimal .hero-copy{margin:auto}.hero-centered .hero-actions,.hero-minimal .hero-actions{justify-content:center}.hero-centered .hero-card,.hero-minimal .hero-card,.hero-centered .hero-visual,.hero-minimal .hero-visual{display:none}.kicker{display:inline-flex;padding:8px 11px;border-radius:999px;background:color-mix(in srgb,var(--primary) 9%,white);color:var(--primary);font-size:10px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}.kicker.light{background:rgba(255,255,255,.1);color:#fff}.hero h1{font-size:clamp(44px,6vw,78px);line-height:.98;letter-spacing:-.055em;color:var(--secondary);margin:18px 0}.hero p{font-size:18px;line-height:1.7;color:#5d6779;max-width:720px}.hero-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:26px}.hero-card,.hero-visual{min-height:380px;border-radius:calc(var(--radius) + 8px);overflow:hidden;box-shadow:0 30px 80px rgba(7,20,73,.18)}.hero-card{padding:34px;display:flex;flex-direction:column;justify-content:flex-end;background:linear-gradient(145deg,var(--secondary),color-mix(in srgb,var(--primary) 68%,#061235));color:#fff}.hero-card>span{font-size:10px;letter-spacing:.13em;font-weight:900;opacity:.62}.hero-card strong{font-size:28px;line-height:1.18;margin:14px 0}.hero-card p{font-size:14px;color:rgba(255,255,255,.72)}.hero-visual img{width:100%;height:100%;min-height:380px;object-fit:cover}.trust,.stats{border-bottom:1px solid #edf0f5}.trust-grid,.stats-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:18px 0}.trust-grid article,.stats-grid article{padding:15px;border:1px solid #e6eaf0;border-radius:var(--radius);background:#fff;text-align:center}.trust-grid article{display:flex;gap:7px;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:#40506a}.stats-grid strong{display:block;font-size:26px;color:var(--secondary)}.stats-grid span{font-size:11px;color:#748099}.section{padding:var(--section-space) 0}.section.alt{background:var(--surface)}.section-head{max-width:740px;margin-bottom:34px}.section-head>span{font-size:10px;font-weight:900;letter-spacing:.13em;color:var(--primary)}.section-head h2{font-size:clamp(34px,4vw,52px);line-height:1.04;letter-spacing:-.04em;color:var(--secondary);margin:10px 0}.section-head p{color:#667287;line-height:1.7}.services{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.services article,.process article,.testimonials blockquote{padding:24px;border-radius:var(--radius);border:1px solid #e3e8f0;background:#fff}.card-elevated .services article,.card-elevated .process article,.card-elevated .testimonials blockquote{box-shadow:0 16px 42px rgba(7,20,73,.07)}.card-glass .services article,.card-glass .testimonials blockquote{background:rgba(255,255,255,.7);backdrop-filter:blur(12px)}.services article>span{font-size:10px;font-weight:900;color:var(--primary)}.services h3{font-size:20px;color:var(--secondary);margin:16px 0 8px}.services p{font-size:13px;line-height:1.6;color:#748096}.process{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.process article{background:var(--secondary);color:#fff}.process article span{display:block;color:var(--accent);font-size:10px;margin-bottom:24px}.gallery{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.gallery img{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:var(--radius)}.testimonials{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}.testimonials blockquote{margin:0;font-size:18px;line-height:1.55;color:#34425a}.contact{display:grid;grid-template-columns:.85fr 1.15fr;gap:34px;padding:42px;border-radius:calc(var(--radius) + 8px);background:linear-gradient(135deg,var(--secondary),color-mix(in srgb,var(--primary) 72%,#071449));color:#fff}.contact h2{font-size:clamp(32px,4vw,50px);margin:13px 0}.contact>div>p{color:rgba(255,255,255,.72);line-height:1.65}.contact-links{display:grid;gap:9px;margin-top:20px}.contact-links a,.contact-links span{display:flex;align-items:center;gap:8px;color:#fff;text-decoration:none;font-size:13px}.contact-links svg{width:16px}.contact-form{padding:22px;border-radius:var(--radius);background:#fff;color:var(--text);display:grid;gap:12px}.contact-form label{display:grid;gap:6px;font-size:10px;font-weight:900;letter-spacing:.05em;color:#52617b}.contact-form input,.contact-form textarea{width:100%;border:1px solid #dfe5ee;border-radius:11px;padding:11px;font:inherit}.form-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}.form-submit{background:var(--primary);color:#fff}.form-status{margin:0;font-size:11px;color:#9a3c44}.form-status.success{color:#087f70}.form-status a{color:inherit}.hp{position:absolute!important;left:-10000px!important;opacity:0!important}footer{padding:34px 0;color:#738096;font-size:12px}.footer-inner{display:flex;justify-content:space-between;gap:20px}
@media(max-width:800px){.shell{width:min(100% - 28px,var(--max))}.nav-inner nav{display:none}.nav-inner{min-height:68px}.nav-inner>.button{padding:0 12px;font-size:12px}.hero{padding:54px 0}.hero-grid,.contact{grid-template-columns:1fr}.hero-grid{gap:28px}.hero h1{font-size:clamp(40px,13vw,64px)}.services{grid-template-columns:1fr 1fr}.process,.gallery,.testimonials,.trust-grid,.stats-grid{grid-template-columns:1fr}.section{padding:58px 0}.footer-inner{flex-direction:column}.contact{padding:28px}.form-row{grid-template-columns:1fr}}
@media(max-width:520px){.services{grid-template-columns:1fr}.hero-card,.hero-visual,.hero-visual img{min-height:300px}.hero p{font-size:16px}.brand strong{display:none}}
`;
}

function readme(draft: WebsiteStudioDraft) {
  return `# ${draft.businessName}\n\nProduction-ready website generated by **Start To Up Website Studio** using the ResKonnect Premium design system.\n\n## Run locally\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n\n## Build\n\n\`\`\`bash\nnpm run build\n\`\`\`\n\n## Deploy to Vercel\n\nImport this repository into Vercel. The included \`vercel.json\` and Vite configuration are already set. No code changes are required.\n\n## Environment\n\nPublic browser configuration is documented in \`.env.example\`. If this export was created with Start To Up managed forms, \`.env.production\` already contains the public form endpoint and project token. Never commit service-role keys, database passwords, GitHub private keys, or Vercel access tokens.\n\n## Integrations\n\n- GitHub: repository-ready source tree.\n- Vercel: Vite production configuration included.\n- Supabase: optional managed form endpoint or external publishable client configuration.\n- Lovable: see \`LOVABLE.md\`; this project uses a standard Vite + React structure that can be imported through GitHub.\n`;
}

function deploymentMd(draft: WebsiteStudioDraft) {
  return `# Deployment\n\n## GitHub\nCreate or import a repository and upload the complete contents of this folder. Keep the folder structure unchanged.\n\n## Vercel\n1. Add the GitHub repository to Vercel.\n2. Framework: Vite (auto-detected).\n3. Install command: \`npm install\`.\n4. Build command: \`npm run build\`.\n5. Output directory: \`dist\`.\n6. Deploy.\n\nNo source changes are required.\n\nExpected project name: **${draft.integrations.vercel.projectName || draft.slug}**.\n`;
}

function lovableMd(draft: WebsiteStudioDraft) {
  return `# Lovable handoff\n\nThis site was generated by Start To Up Website Studio from the ResKonnect Premium template system.\n\n## Canonical rules\n- Preserve \`src/site-config.ts\` as the business content source.\n- Preserve brand colours and responsive behavior unless explicitly asked to redesign them.\n- Keep the project deployable with \`npm run build\`.\n- Do not expose private credentials in client code.\n- Use the existing Supabase integration adapter if backend features are added.\n\n## Business\n- Name: ${draft.businessName}\n- Category: ${draft.category}\n- Primary goal: ${draft.site.primaryCta}\n\nImport this repository into Lovable through its GitHub workflow, then use this file as project knowledge.\n`;
}

function supabaseMigration() {
  return `create table if not exists public.contact_submissions (\n  id uuid primary key default gen_random_uuid(),\n  full_name text,\n  email text,\n  phone text,\n  message text not null,\n  source_url text,\n  created_at timestamptz not null default now()\n);\n\nalter table public.contact_submissions enable row level security;\n\n-- Only enable direct anonymous inserts if this dedicated project is intended for public website forms.\ncreate policy \"public website contact insert\" on public.contact_submissions for insert to anon with check (char_length(message) between 1 and 5000);\n`;
}

export function generateDeployableProjectFiles(raw: WebsiteStudioDraft): GeneratedProjectFiles {
  const draft = normalizeWebsiteDraft(raw);
  const managed = draft.integrations.supabase.mode === "managed";
  const external = draft.integrations.supabase.mode === "external";
  const envProduction = [
    managed ? envLine("VITE_STUDIO_FORM_ENDPOINT", draft.integrations.supabase.managedFormEndpoint) : "# Managed Start To Up forms disabled",
    managed ? envLine("VITE_STUDIO_PROJECT_TOKEN", draft.integrations.supabase.publicSubmitToken) : "# VITE_STUDIO_PROJECT_TOKEN=",
    external ? envLine("VITE_SUPABASE_URL", draft.integrations.supabase.url) : "# VITE_SUPABASE_URL=",
    external ? envLine("VITE_SUPABASE_PUBLISHABLE_KEY", draft.integrations.supabase.publishableKey) : "# VITE_SUPABASE_PUBLISHABLE_KEY=",
  ].join("\n") + "\n";

  return {
    "package.json": packageJson(draft) + "\n",
    "index.html": `<!doctype html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/><meta name="description" content="${draft.seo.description.replaceAll('"', "&quot;")}"/><meta name="theme-color" content="${draft.brand.secondary}"/><link rel="icon" href="/assets/brand-mark.svg"/><title>${draft.seo.title.replaceAll("<", "&lt;")}</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>\n`,
    "vite.config.ts": `import { defineConfig } from "vite";\nimport react from "@vitejs/plugin-react";\n\nexport default defineConfig({ plugins: [react()], server: { host: "0.0.0.0", port: 5173 } });\n`,
    "tsconfig.json": json({ files: [], references: [{ path: "./tsconfig.app.json" }, { path: "./tsconfig.node.json" }] }) + "\n",
    "tsconfig.app.json": json({ compilerOptions: { target: "ES2022", useDefineForClassFields: true, lib: ["ES2022", "DOM", "DOM.Iterable"], allowJs: false, skipLibCheck: true, esModuleInterop: true, allowSyntheticDefaultImports: true, strict: true, forceConsistentCasingInFileNames: true, module: "ESNext", moduleResolution: "Bundler", resolveJsonModule: true, isolatedModules: true, noEmit: true, jsx: "react-jsx" }, include: ["src"] }) + "\n",
    "tsconfig.node.json": json({ compilerOptions: { composite: true, skipLibCheck: true, module: "ESNext", moduleResolution: "Bundler", allowImportingTsExtensions: true }, include: ["vite.config.ts"] }) + "\n",
    "vercel.json": json({ buildCommand: "npm run build", installCommand: "npm install", outputDirectory: "dist", cleanUrls: true }) + "\n",
    ".gitignore": "node_modules\ndist\n.env\n.env.local\n.vercel\n.DS_Store\n*.log\n",
    ".env.example": "# All VITE_* values are public browser configuration. Never add private/server keys here.\nVITE_STUDIO_FORM_ENDPOINT=\nVITE_STUDIO_PROJECT_TOKEN=\nVITE_SUPABASE_URL=\nVITE_SUPABASE_PUBLISHABLE_KEY=\n",
    ".env.production": envProduction,
    "README.md": readme(draft),
    "DEPLOYMENT.md": deploymentMd(draft),
    "LOVABLE.md": lovableMd(draft),
    ".lovable/README.md": "Use ../LOVABLE.md as the canonical project handoff instructions.\n",
    ".github/workflows/build.yml": `name: Build\non:\n  push:\n  pull_request:\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n        with:\n          node-version: 22\n          cache: npm\n      - run: npm install\n      - run: npm run build\n`,
    "app/site.json": json(draft),
    "app/integrations.json": json({ github: draft.github, vercel: draft.integrations.vercel, supabase: { ...draft.integrations.supabase, publishableKey: draft.integrations.supabase.publishableKey ? "configured-public-key" : "" }, lovable: draft.integrations.lovable }),
    "app/README.md": "Portable Website Studio blueprint. The running React application lives in /src.\n",
    "env/README.md": "Environment templates only. Runtime Vite variables live in root .env files or Vercel Environment Variables.\n",
    "env/vercel.env.example": "VITE_STUDIO_FORM_ENDPOINT=\nVITE_STUDIO_PROJECT_TOKEN=\nVITE_SUPABASE_URL=\nVITE_SUPABASE_PUBLISHABLE_KEY=\n",
    "api/health.js": `export default function handler(_req, res) { res.status(200).json({ ok: true, app: ${JSON.stringify(draft.businessName)}, generatedBy: "Start To Up Website Studio" }); }\n`,
    "scripts/verify-export.mjs": `import { access } from "node:fs/promises";\nconst required=["package.json","index.html","vite.config.ts","src/main.tsx","src/App.tsx","src/styles.css","vercel.json"];\nfor(const file of required) await access(file);\nconsole.log("Website Studio export structure OK");\n`,
    "public/assets/brand-mark.svg": brandSvg(draft),
    "public/robots.txt": `${draft.seo.indexable ? "User-agent: *\\nAllow: /" : "User-agent: *\\nDisallow: /"}\n`,
    "public/manifest.webmanifest": json({ name: draft.businessName, short_name: draft.businessName.slice(0, 20), start_url: "/", display: "standalone", background_color: "#ffffff", theme_color: draft.brand.secondary, icons: [] }),
    "assets/README.md": "Add source brand photography, campaign artwork and other editable assets here. Public runtime assets belong in /public/assets.\n",
    "src/assets/.gitkeep": "",
    "src/vite-env.d.ts": "/// <reference types=\"vite/client\" />\n",
    "src/main.tsx": `import { StrictMode } from "react";\nimport { createRoot } from "react-dom/client";\nimport App from "./App";\n\ncreateRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);\n`,
    "src/App.tsx": appTsx(),
    "src/styles.css": stylesCss(draft),
    "src/site-config.ts": siteConfigSource(draft),
    "src/components/ContactForm.tsx": contactFormTsx(),
    "src/lib/lead-submit.ts": leadSubmitTs(),
    "supabase/migrations/001_contact_submissions.sql": supabaseMigration(),
    "supabase/README.md": "Only needed when using a dedicated external Supabase project. The exported site works without running this migration unless you select External Supabase for form storage.\n",
  };
}

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function u16(value: number) {
  const out = new Uint8Array(2); new DataView(out.buffer).setUint16(0, value, true); return out;
}
function u32(value: number) {
  const out = new Uint8Array(4); new DataView(out.buffer).setUint32(0, value >>> 0, true); return out;
}
function concat(parts: Uint8Array[]) {
  const size = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(size); let offset = 0; for (const part of parts) { out.set(part, offset); offset += part.length; } return out;
}
function dosTime(date = new Date()) {
  const year = Math.max(1980, date.getFullYear());
  const time = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const day = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { time, day };
}

export function createZipBlob(files: GeneratedProjectFiles, rootFolder: string): Blob {
  const encoder = new TextEncoder();
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;
  const stamp = dosTime();
  for (const [path, content] of Object.entries(files)) {
    const fileName = encoder.encode(`${rootFolder}/${path}`.replace(/\/+/g, "/"));
    const data = encoder.encode(content);
    const crc = crc32(data);
    const local = concat([u32(0x04034b50), u16(20), u16(0x0800), u16(0), u16(stamp.time), u16(stamp.day), u32(crc), u32(data.length), u32(data.length), u16(fileName.length), u16(0), fileName, data]);
    locals.push(local);
    const central = concat([u32(0x02014b50), u16(20), u16(20), u16(0x0800), u16(0), u16(stamp.time), u16(stamp.day), u32(crc), u32(data.length), u32(data.length), u16(fileName.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), fileName]);
    centrals.push(central);
    offset += local.length;
  }
  const centralBytes = concat(centrals);
  const end = concat([u32(0x06054b50), u16(0), u16(0), u16(centrals.length), u16(centrals.length), u32(centralBytes.length), u32(offset), u16(0)]);
  return new Blob([concat([...locals, centralBytes, end])], { type: "application/zip" });
}

export function downloadProjectZip(draft: WebsiteStudioDraft) {
  const normalized = normalizeWebsiteDraft(draft);
  const files = generateDeployableProjectFiles(normalized);
  const blob = createZipBlob(files, normalized.slug || "website");
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${normalized.slug || "website"}-source.zip`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 2500);
  return { files: Object.keys(files), bytes: blob.size };
}
