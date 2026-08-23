import { Link, createFileRoute } from "@tanstack/react-router";
import {
  BriefcaseBusiness,
  Check,
  Download,
  ExternalLink,
  FileJson,
  Github,
  LayoutTemplate,
  Monitor,
  Palette,
  Plus,
  Save,
  Search,
  Smartphone,
  Sparkles,
  Tablet,
  Type,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../../components/app-shell";
import {
  applyCategoryPreset,
  businessCategories,
  buildPublicationManifest,
  createWebsiteDraft,
  generateWebsiteHtml,
  slugify,
  type BusinessCategoryKey,
  type PreviewDevice,
  type WebsiteStudioDraft,
} from "../../lib/website-studio";
import {
  canUseWebsiteStudio,
  createWebsiteStudioVersion,
  getWebsiteStudioUser,
  listPublicationJobs,
  listWebsiteStudioProjects,
  queueGithubPublication,
  saveWebsiteStudioProject,
} from "../../lib/website-studio-data";
import "../../website-studio.css";

export const Route = createFileRoute("/app/website-studio")({
  component: WebsiteStudioPage,
});

type StudioTab = "business" | "brand" | "content" | "seo" | "publish";

const tabs: Array<{ key: StudioTab; label: string; icon: typeof BriefcaseBusiness }> = [
  { key: "business", label: "Business", icon: BriefcaseBusiness },
  { key: "brand", label: "Brand", icon: Palette },
  { key: "content", label: "Content", icon: Type },
  { key: "seo", label: "SEO & contact", icon: Search },
  { key: "publish", label: "Publish", icon: Github },
];

function restoreLocalDraft(): WebsiteStudioDraft {
  if (typeof window === "undefined") return createWebsiteDraft();
  try {
    const saved = window.localStorage.getItem("start-to-up-website-studio-draft");
    return saved ? (JSON.parse(saved) as WebsiteStudioDraft) : createWebsiteDraft();
  } catch {
    return createWebsiteDraft();
  }
}

function WebsiteStudioPage() {
  const [draft, setDraft] = useState<WebsiteStudioDraft>(() => restoreLocalDraft());
  const [projects, setProjects] = useState<WebsiteStudioDraft[]>([]);
  const [publicationJobs, setPublicationJobs] = useState<any[]>([]);
  const [device, setDevice] = useState<PreviewDevice>("desktop");
  const [tab, setTab] = useState<StudioTab>("business");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [accessAllowed, setAccessAllowed] = useState(true);
  const [notice, setNotice] = useState("Live preview updates as you edit.");

  const previewHtml = useMemo(() => generateWebsiteHtml(draft), [draft]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      window.localStorage.setItem("start-to-up-website-studio-draft", JSON.stringify(draft));
    }, 180);
    return () => window.clearTimeout(timer);
  }, [draft]);

  useEffect(() => {
    void (async () => {
      const user = await getWebsiteStudioUser();
      setSignedIn(Boolean(user));
      if (!user) return;
      const allowed = await canUseWebsiteStudio();
      setAccessAllowed(allowed);
      if (!allowed) return;
      try {
        const rows = await listWebsiteStudioProjects();
        setProjects(rows);
      } catch {
        setNotice("Your local draft is ready. Cloud projects can be loaded again when the workspace reconnects.");
      }
    })();
  }, []);

  useEffect(() => {
    if (!draft.id || !signedIn) {
      setPublicationJobs([]);
      return;
    }
    void listPublicationJobs(draft.id).then(setPublicationJobs).catch(() => setPublicationJobs([]));
  }, [draft.id, signedIn]);

  function patch<K extends keyof WebsiteStudioDraft>(key: K, value: WebsiteStudioDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function patchSite<K extends keyof WebsiteStudioDraft["site"]>(key: K, value: WebsiteStudioDraft["site"][K]) {
    setDraft((current) => ({ ...current, site: { ...current.site, [key]: value } }));
  }

  function patchBrand<K extends keyof WebsiteStudioDraft["brand"]>(key: K, value: WebsiteStudioDraft["brand"][K]) {
    setDraft((current) => ({ ...current, brand: { ...current.brand, [key]: value } }));
  }

  function patchContact<K extends keyof WebsiteStudioDraft["contact"]>(key: K, value: WebsiteStudioDraft["contact"][K]) {
    setDraft((current) => ({ ...current, contact: { ...current.contact, [key]: value } }));
  }

  function patchSeo<K extends keyof WebsiteStudioDraft["seo"]>(key: K, value: WebsiteStudioDraft["seo"][K]) {
    setDraft((current) => ({ ...current, seo: { ...current.seo, [key]: value } }));
  }

  function updateList(key: "services" | "highlights" | "process" | "testimonials", index: number, value: string) {
    setDraft((current) => {
      const list = [...current.site[key]];
      list[index] = value;
      return { ...current, site: { ...current.site, [key]: list } };
    });
  }

  function changeBusinessName(value: string) {
    setDraft((current) => {
      const nextSlug = slugify(value);
      const oldAutoProject = `${current.businessName} Website`;
      const oldAutoSeo = `${current.businessName} | Official Website`;
      return {
        ...current,
        businessName: value,
        slug: nextSlug,
        projectName: current.projectName === oldAutoProject ? `${value || "Your Business"} Website` : current.projectName,
        brand: {
          ...current.brand,
          logoText: current.brand.logoText === current.businessName.toUpperCase() ? value.toUpperCase() : current.brand.logoText,
        },
        seo: {
          ...current.seo,
          title: current.seo.title === oldAutoSeo ? `${value || "Your Business"} | Official Website` : current.seo.title,
        },
        github: {
          ...current.github,
          repository: current.github.repository === slugify(current.businessName) ? nextSlug : current.github.repository,
        },
      };
    });
  }

  function changeCategory(value: BusinessCategoryKey) {
    setDraft((current) => applyCategoryPreset(current, value));
  }

  function newProject() {
    const next = createWebsiteDraft();
    setDraft(next);
    setTab("business");
    setNotice("New website workspace created. Choose the business category and replace the starter content.");
  }

  async function saveProject() {
    setSaving(true);
    try {
      const saved = await saveWebsiteStudioProject(draft);
      setDraft(saved);
      await createWebsiteStudioVersion(saved).catch(() => undefined);
      const rows = await listWebsiteStudioProjects();
      setProjects(rows);
      setSignedIn(true);
      setNotice("Saved to your Start To Up Website Studio workspace.");
    } catch (error) {
      if (error instanceof Error && error.message === "SIGN_IN_REQUIRED") {
        setSignedIn(false);
        setNotice("Draft kept safely on this device. Sign in when you want to save it to the managed workspace.");
      } else {
        setNotice("The local draft is safe. Try saving the managed copy again in a moment.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function prepareGithub() {
    setPublishing(true);
    try {
      let saved = draft;
      if (!saved.id) {
        saved = await saveWebsiteStudioProject(saved);
        setDraft(saved);
      } else {
        saved = await saveWebsiteStudioProject(saved);
        setDraft(saved);
      }
      await createWebsiteStudioVersion(saved).catch(() => undefined);
      await queueGithubPublication(saved, "private");
      const jobs = await listPublicationJobs(saved.id!);
      setPublicationJobs(jobs);
      setNotice("GitHub publication package prepared. Start To Up can now review and sync this website to the selected repository.");
      setSignedIn(true);
    } catch (error) {
      if (error instanceof Error && error.message === "SIGN_IN_REQUIRED") {
        setSignedIn(false);
        setNotice("Sign in to your client workspace before requesting managed GitHub publishing.");
      } else {
        setNotice("The website is still safe in the editor. Save the project before preparing GitHub publishing again.");
      }
    } finally {
      setPublishing(false);
    }
  }

  function downloadFile(content: string, fileName: string, type: string) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1200);
  }

  function downloadHtml() {
    downloadFile(previewHtml, `${draft.slug || "website"}.html`, "text/html;charset=utf-8");
    setNotice("Production-ready HTML exported from the current preview.");
  }

  function downloadBlueprint() {
    downloadFile(
      JSON.stringify(buildPublicationManifest(draft), null, 2),
      `${draft.slug || "website"}-blueprint.json`,
      "application/json;charset=utf-8",
    );
    setNotice("Site blueprint exported. It can be used to reproduce or migrate this website later.");
  }

  function openFullPreview() {
    const url = URL.createObjectURL(new Blob([previewHtml], { type: "text/html" }));
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  if (!accessAllowed && signedIn) {
    return (
      <AppShell title="Website Studio" eyebrow="MANAGED BUSINESS WEBSITE SERVICE">
        <section className="studio-access-card">
          <LayoutTemplate />
          <span>MANAGED ACCESS</span>
          <h2>Website Studio is currently reserved for Start To Up administrators.</h2>
          <p>Your projects remain protected. Contact Start To Up if you need an update or new website build.</p>
          <Link to="/website-studio" className="button button-primary">View Website Studio service</Link>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Website Studio"
      eyebrow="BUILD · PREVIEW · VERSION · PUBLISH"
      action={<Link preload="intent" to="/website-studio" className="button button-secondary">Service overview</Link>}
    >
      <section className="studio-command-bar">
        <div>
          <span><Sparkles /> RESKONNECT PREMIUM TEMPLATE SYSTEM</span>
          <h2>Turn one proven website system into a premium site for any business.</h2>
          <p>Business-specific content. Reusable design system. Real responsive preview. Managed GitHub publishing.</p>
        </div>
        <div className="studio-command-actions">
          <button type="button" className="button button-secondary" onClick={newProject}><Plus /> New site</button>
          <button type="button" className="button button-primary" onClick={() => void saveProject()} disabled={saving}><Save /> {saving ? "Saving" : "Save"}</button>
        </div>
      </section>

      <div className="studio-status-line" role="status">
        <span>{notice}</span>
        {signedIn === false ? <Link to="/auth">Sign in to save →</Link> : null}
      </div>

      <section className="studio-project-strip" aria-label="Website projects">
        <button type="button" className={!draft.id ? "active" : ""} onClick={newProject}>
          <Plus /><span><strong>New website</strong><small>Start fresh</small></span>
        </button>
        {projects.map((project) => (
          <button type="button" className={draft.id === project.id ? "active" : ""} key={project.id} onClick={() => { setDraft(project); setNotice(`${project.businessName} loaded.`); }}>
            <LayoutTemplate /><span><strong>{project.businessName}</strong><small>{project.category.replaceAll("-", " ")}</small></span>
          </button>
        ))}
      </section>

      <div className="studio-workbench">
        <aside className="studio-editor">
          <nav className="studio-tabs" aria-label="Website editor sections">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button type="button" key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}>
                <Icon /><span>{label}</span>
              </button>
            ))}
          </nav>

          <div className="studio-panel-scroll">
            {tab === "business" ? (
              <EditorSection title="Business setup" description="Choose what kind of business this website represents. The template automatically adapts its starter content.">
                <Field label="Business name"><input value={draft.businessName} onChange={(event) => changeBusinessName(event.target.value)} /></Field>
                <Field label="Project name"><input value={draft.projectName} onChange={(event) => patch("projectName", event.target.value)} /></Field>
                <Field label="Business category">
                  <select value={draft.category} onChange={(event) => changeCategory(event.target.value as BusinessCategoryKey)}>
                    {businessCategories.map((category) => <option value={category.key} key={category.key}>{category.label}</option>)}
                  </select>
                </Field>
                <Field label="Location"><input value={draft.site.location} onChange={(event) => patchSite("location", event.target.value)} /></Field>
                <div className="studio-template-card">
                  <LayoutTemplate />
                  <div><span>ACTIVE TEMPLATE</span><strong>ResKonnect Premium</strong><p>Responsive product-grade layout language adapted from the ResKonnect platform without accommodation-specific logic.</p></div>
                  <Check />
                </div>
              </EditorSection>
            ) : null}

            {tab === "brand" ? (
              <EditorSection title="Brand system" description="Set the brand once. The entire website preview responds automatically.">
                <Field label="Logo text"><input value={draft.brand.logoText} onChange={(event) => patchBrand("logoText", event.target.value)} /></Field>
                <Field label="Logo image URL"><input placeholder="https://..." value={draft.brand.logoUrl} onChange={(event) => patchBrand("logoUrl", event.target.value)} /></Field>
                <div className="studio-colour-grid">
                  <ColourField label="Primary" value={draft.brand.primary} onChange={(value) => patchBrand("primary", value)} />
                  <ColourField label="Secondary" value={draft.brand.secondary} onChange={(value) => patchBrand("secondary", value)} />
                  <ColourField label="Accent" value={draft.brand.accent} onChange={(value) => patchBrand("accent", value)} />
                  <ColourField label="Surface" value={draft.brand.surface} onChange={(value) => patchBrand("surface", value)} />
                </div>
                <Field label={`Corner style · ${draft.brand.radius}px`}><input type="range" min="8" max="36" value={draft.brand.radius} onChange={(event) => patchBrand("radius", Number(event.target.value))} /></Field>
              </EditorSection>
            ) : null}

            {tab === "content" ? (
              <EditorSection title="Website content" description="Edit the main story and section content. Changes appear instantly in preview.">
                <Field label="Headline"><textarea value={draft.site.headline} onChange={(event) => patchSite("headline", event.target.value)} /></Field>
                <Field label="Tagline"><textarea value={draft.site.tagline} onChange={(event) => patchSite("tagline", event.target.value)} /></Field>
                <Field label="Business description"><textarea value={draft.site.description} onChange={(event) => patchSite("description", event.target.value)} /></Field>
                <div className="studio-mini-grid">
                  <Field label="Primary CTA"><input value={draft.site.primaryCta} onChange={(event) => patchSite("primaryCta", event.target.value)} /></Field>
                  <Field label="Secondary CTA"><input value={draft.site.secondaryCta} onChange={(event) => patchSite("secondaryCta", event.target.value)} /></Field>
                </div>
                <ListEditor title="Services" items={draft.site.services} onChange={(index, value) => updateList("services", index, value)} />
                <ListEditor title="Trust highlights" items={draft.site.highlights} onChange={(index, value) => updateList("highlights", index, value)} />
                <ListEditor title="Customer journey" items={draft.site.process} onChange={(index, value) => updateList("process", index, value)} />
                <ListEditor title="Testimonials" items={draft.site.testimonials} onChange={(index, value) => updateList("testimonials", index, value)} />
                <div className="studio-section-toggles">
                  <Toggle label="Services" checked={draft.site.showServices} onChange={(value) => patchSite("showServices", value)} />
                  <Toggle label="Trust" checked={draft.site.showHighlights} onChange={(value) => patchSite("showHighlights", value)} />
                  <Toggle label="Process" checked={draft.site.showProcess} onChange={(value) => patchSite("showProcess", value)} />
                  <Toggle label="Testimonials" checked={draft.site.showTestimonials} onChange={(value) => patchSite("showTestimonials", value)} />
                  <Toggle label="Contact" checked={draft.site.showContact} onChange={(value) => patchSite("showContact", value)} />
                </div>
              </EditorSection>
            ) : null}

            {tab === "seo" ? (
              <EditorSection title="SEO & contact" description="Prepare the site for search discovery and make the customer action path obvious.">
                <Field label="SEO title"><input value={draft.seo.title} onChange={(event) => patchSeo("title", event.target.value)} /></Field>
                <Field label="Meta description"><textarea value={draft.seo.description} onChange={(event) => patchSeo("description", event.target.value)} /></Field>
                <Field label="Keywords"><input value={draft.seo.keywords} onChange={(event) => patchSeo("keywords", event.target.value)} /></Field>
                <Field label="Email"><input type="email" value={draft.contact.email} onChange={(event) => patchContact("email", event.target.value)} /></Field>
                <Field label="Phone"><input value={draft.contact.phone} onChange={(event) => patchContact("phone", event.target.value)} /></Field>
                <Field label="WhatsApp"><input value={draft.contact.whatsapp} onChange={(event) => patchContact("whatsapp", event.target.value)} /></Field>
                <Field label="Address"><textarea value={draft.contact.address} onChange={(event) => patchContact("address", event.target.value)} /></Field>
              </EditorSection>
            ) : null}

            {tab === "publish" ? (
              <EditorSection title="Preview, export & GitHub" description="Keep a portable copy of the site and prepare a managed repository publication when the business is ready.">
                <div className="studio-export-grid">
                  <button type="button" onClick={downloadHtml}><Download /><strong>Export HTML</strong><span>Production-ready single-page site</span></button>
                  <button type="button" onClick={downloadBlueprint}><FileJson /><strong>Export blueprint</strong><span>Portable Website Studio configuration</span></button>
                </div>
                <div className="studio-github-card">
                  <header><Github /><div><span>MANAGED GITHUB PUBLISHING</span><strong>Repository destination</strong></div></header>
                  <div className="studio-mini-grid">
                    <Field label="GitHub owner"><input value={draft.github.owner} onChange={(event) => setDraft((current) => ({ ...current, github: { ...current.github, owner: event.target.value } }))} /></Field>
                    <Field label="Repository"><input value={draft.github.repository} onChange={(event) => setDraft((current) => ({ ...current, github: { ...current.github, repository: event.target.value } }))} /></Field>
                  </div>
                  <Field label="Branch"><input value={draft.github.branch} onChange={(event) => setDraft((current) => ({ ...current, github: { ...current.github, branch: event.target.value } }))} /></Field>
                  <button type="button" className="button button-primary" disabled={publishing} onClick={() => void prepareGithub()}><Github /> {publishing ? "Preparing" : "Prepare GitHub publication"}</button>
                  <p>Website Studio prepares the versioned site package and repository target. Start To Up completes the managed sync after the GitHub connection is authorized.</p>
                </div>
                {publicationJobs.length ? (
                  <div className="studio-job-list">
                    <span>RECENT PUBLICATION REQUESTS</span>
                    {publicationJobs.map((job) => <div key={job.id}><strong>{job.repository_owner || draft.github.owner}/{job.repository_name || draft.github.repository}</strong><small>{String(job.status).replaceAll("_", " ")} · {new Date(job.created_at).toLocaleString()}</small></div>)}
                  </div>
                ) : null}
              </EditorSection>
            ) : null}
          </div>
        </aside>

        <section className="studio-preview-area">
          <header className="studio-preview-toolbar">
            <div>
              <span>LIVE WEBSITE PREVIEW</span>
              <strong>{draft.businessName || "Your Business"}</strong>
            </div>
            <div className="studio-device-switcher" aria-label="Preview device">
              <button type="button" aria-label="Desktop preview" className={device === "desktop" ? "active" : ""} onClick={() => setDevice("desktop")}><Monitor /></button>
              <button type="button" aria-label="Tablet preview" className={device === "tablet" ? "active" : ""} onClick={() => setDevice("tablet")}><Tablet /></button>
              <button type="button" aria-label="Mobile preview" className={device === "mobile" ? "active" : ""} onClick={() => setDevice("mobile")}><Smartphone /></button>
              <button type="button" aria-label="Open full preview" onClick={openFullPreview}><ExternalLink /></button>
            </div>
          </header>
          <div className={`studio-preview-shell device-${device}`}>
            <div className="studio-browser-bar"><i /><i /><i /><span>{draft.slug}.preview.start-to-up.co.za</span></div>
            <iframe title={`${draft.businessName} website preview`} srcDoc={previewHtml} sandbox="allow-forms allow-popups allow-same-origin" />
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function EditorSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <section className="studio-editor-section"><header><h3>{title}</h3><p>{description}</p></header>{children}</section>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="studio-field"><span>{label}</span>{children}</label>;
}

function ColourField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="studio-colour-field"><span>{label}</span><div><input type="color" value={value} onChange={(event) => onChange(event.target.value)} /><input value={value} onChange={(event) => onChange(event.target.value)} /></div></label>;
}

function ListEditor({ title, items, onChange }: { title: string; items: string[]; onChange: (index: number, value: string) => void }) {
  return <div className="studio-list-editor"><span>{title}</span>{items.map((item, index) => <input key={`${title}-${index}`} value={item} onChange={(event) => onChange(index, event.target.value)} />)}</div>;
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="studio-toggle"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><span>{label}</span></label>;
}
