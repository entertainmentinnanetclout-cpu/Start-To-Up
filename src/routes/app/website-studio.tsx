import { Link, createFileRoute } from "@tanstack/react-router";
import {
  BriefcaseBusiness,
  Check,
  Cloud,
  Code2,
  Database,
  Download,
  ExternalLink,
  FileArchive,
  FileJson,
  FolderTree,
  Github,
  LayoutTemplate,
  Link2,
  Monitor,
  Palette,
  Plus,
  Rocket,
  Save,
  Search,
  Settings2,
  Smartphone,
  Sparkles,
  Tablet,
  Type,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AppShell } from "../../components/app-shell";
import {
  applyCategoryPreset,
  businessCategories,
  buildPublicationManifest,
  createWebsiteDraft,
  generateWebsiteHtml,
  normalizeWebsiteDraft,
  slugify,
  type BusinessCategoryKey,
  type PreviewDevice,
  type StudioIntegrations,
  type WebsiteStudioDraft,
} from "../../lib/website-studio";
import {
  canUseWebsiteStudio,
  createWebsiteStudioVersion,
  getWebsiteStudioUser,
  listPublicationJobs,
  listStudioDeployments,
  listStudioIntegrations,
  listWebsiteStudioProjects,
  markWebsiteStudioExported,
  queueGithubPublication,
  queueVercelDeployment,
  runGithubPublication,
  runVercelDeployment,
  saveStudioIntegration,
  saveWebsiteStudioProject,
} from "../../lib/website-studio-data";
import {
  downloadProjectZip,
  generateDeployableProjectFiles,
} from "../../lib/website-studio-export";
import "../../website-studio.css";

export const Route = createFileRoute("/app/website-studio")({ component: WebsiteStudioPage });

type StudioTab = "business" | "brand" | "layout" | "content" | "seo" | "integrations" | "export";

const tabs: Array<{ key: StudioTab; label: string; icon: typeof BriefcaseBusiness }> = [
  { key: "business", label: "Business", icon: BriefcaseBusiness },
  { key: "brand", label: "Brand", icon: Palette },
  { key: "layout", label: "Layout", icon: Settings2 },
  { key: "content", label: "Content", icon: Type },
  { key: "seo", label: "SEO", icon: Search },
  { key: "integrations", label: "Integrations", icon: Link2 },
  { key: "export", label: "Export", icon: FileArchive },
];

const sourceFolders = [
  "app/", "src/", "src/components/", "src/lib/", "src/assets/", "public/assets/", "assets/", "api/", "env/", "scripts/", "supabase/", ".github/", ".lovable/",
];

function freshDraft() {
  const draft = createWebsiteDraft();
  return normalizeWebsiteDraft({
    ...draft,
    integrations: {
      ...draft.integrations,
      supabase: { ...draft.integrations.supabase, mode: "managed" },
    },
  });
}

function restoreLocalDraft(): WebsiteStudioDraft {
  if (typeof window === "undefined") return freshDraft();
  try {
    const saved = window.localStorage.getItem("start-to-up-website-studio-draft");
    return saved ? normalizeWebsiteDraft(JSON.parse(saved) as WebsiteStudioDraft) : freshDraft();
  } catch {
    return freshDraft();
  }
}

function WebsiteStudioPage() {
  const [draft, setDraft] = useState<WebsiteStudioDraft>(() => restoreLocalDraft());
  const [projects, setProjects] = useState<WebsiteStudioDraft[]>([]);
  const [publicationJobs, setPublicationJobs] = useState<any[]>([]);
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [deployments, setDeployments] = useState<any[]>([]);
  const [device, setDevice] = useState<PreviewDevice>("desktop");
  const [tab, setTab] = useState<StudioTab>("business");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState<"github" | "vercel" | null>(null);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [accessAllowed, setAccessAllowed] = useState(true);
  const [notice, setNotice] = useState("Live preview updates as you edit.");

  const previewHtml = useMemo(() => generateWebsiteHtml(draft), [draft]);
  const sourceFiles = useMemo(() => generateDeployableProjectFiles(draft), [draft]);
  const sourceFileNames = useMemo(() => Object.keys(sourceFiles).sort(), [sourceFiles]);

  useEffect(() => {
    const timer = window.setTimeout(() => window.localStorage.setItem("start-to-up-website-studio-draft", JSON.stringify(draft)), 180);
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
        setProjects(await listWebsiteStudioProjects());
      } catch {
        setNotice("Your local draft is ready. Managed projects can be loaded again when the workspace reconnects.");
      }
    })();
  }, []);

  useEffect(() => {
    if (!draft.id || !signedIn) {
      setPublicationJobs([]);
      setIntegrations([]);
      setDeployments([]);
      return;
    }
    void refreshOperations(draft.id);
  }, [draft.id, signedIn]);

  async function refreshOperations(projectId: string) {
    const [jobs, linked, deploys] = await Promise.all([
      listPublicationJobs(projectId).catch(() => []),
      listStudioIntegrations(projectId).catch(() => []),
      listStudioDeployments(projectId).catch(() => []),
    ]);
    setPublicationJobs(jobs);
    setIntegrations(linked);
    setDeployments(deploys);
  }

  function patch<K extends keyof WebsiteStudioDraft>(key: K, value: WebsiteStudioDraft[K]) {
    setDraft((current) => normalizeWebsiteDraft({ ...current, [key]: value }));
  }

  function patchSite<K extends keyof WebsiteStudioDraft["site"]>(key: K, value: WebsiteStudioDraft["site"][K]) {
    setDraft((current) => normalizeWebsiteDraft({ ...current, site: { ...current.site, [key]: value } }));
  }

  function patchBrand<K extends keyof WebsiteStudioDraft["brand"]>(key: K, value: WebsiteStudioDraft["brand"][K]) {
    setDraft((current) => normalizeWebsiteDraft({ ...current, brand: { ...current.brand, [key]: value } }));
  }

  function patchContact<K extends keyof WebsiteStudioDraft["contact"]>(key: K, value: WebsiteStudioDraft["contact"][K]) {
    setDraft((current) => normalizeWebsiteDraft({ ...current, contact: { ...current.contact, [key]: value } }));
  }

  function patchSeo<K extends keyof WebsiteStudioDraft["seo"]>(key: K, value: WebsiteStudioDraft["seo"][K]) {
    setDraft((current) => normalizeWebsiteDraft({ ...current, seo: { ...current.seo, [key]: value } }));
  }

  function patchGithub(key: keyof WebsiteStudioDraft["github"], value: string) {
    setDraft((current) => normalizeWebsiteDraft({ ...current, github: { ...current.github, [key]: value } }));
  }

  function patchIntegration<P extends keyof StudioIntegrations, K extends keyof StudioIntegrations[P]>(provider: P, key: K, value: StudioIntegrations[P][K]) {
    setDraft((current) => normalizeWebsiteDraft({
      ...current,
      integrations: {
        ...current.integrations,
        [provider]: { ...current.integrations[provider], [key]: value },
      },
    }));
  }

  function updateList(key: "services" | "highlights" | "process" | "testimonials" | "gallery", index: number, value: string) {
    setDraft((current) => {
      const values = [...current.site[key]];
      values[index] = value;
      return normalizeWebsiteDraft({ ...current, site: { ...current.site, [key]: values } });
    });
  }

  function updateStat(index: number, key: "value" | "label", value: string) {
    setDraft((current) => {
      const stats = current.site.stats.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item);
      return normalizeWebsiteDraft({ ...current, site: { ...current.site, stats } });
    });
  }

  function changeBusinessName(value: string) {
    setDraft((current) => {
      const nextSlug = slugify(value);
      return normalizeWebsiteDraft({
        ...current,
        businessName: value,
        slug: nextSlug,
        projectName: current.projectName === `${current.businessName} Website` ? `${value || "Your Business"} Website` : current.projectName,
        brand: { ...current.brand, logoText: current.brand.logoText === current.businessName.toUpperCase() ? value.toUpperCase() : current.brand.logoText },
        seo: { ...current.seo, title: current.seo.title === `${current.businessName} | Official Website` ? `${value || "Your Business"} | Official Website` : current.seo.title },
        github: { ...current.github, repository: current.github.repository === slugify(current.businessName) ? nextSlug : current.github.repository },
        integrations: { ...current.integrations, vercel: { ...current.integrations.vercel, projectName: current.integrations.vercel.projectName === slugify(current.businessName) ? nextSlug : current.integrations.vercel.projectName } },
      });
    });
  }

  function newProject() {
    setDraft(freshDraft());
    setTab("business");
    setNotice("New Website Studio V2 project created. Managed forms are enabled by default after the first save.");
  }

  async function ensureSaved() {
    const saved = await saveWebsiteStudioProject(draft);
    setDraft(saved);
    setSignedIn(true);
    await createWebsiteStudioVersion(saved).catch(() => undefined);
    setProjects(await listWebsiteStudioProjects().catch(() => projects));
    if (saved.id) await refreshOperations(saved.id);
    return saved;
  }

  async function saveProject() {
    setSaving(true);
    try {
      await ensureSaved();
      setNotice("Saved with design, integration and export configuration.");
    } catch (error) {
      if (error instanceof Error && error.message === "SIGN_IN_REQUIRED") {
        setSignedIn(false);
        setNotice("The draft is safe on this device. Sign in to save managed integrations and form routing.");
      } else {
        setNotice("The local draft is safe. Managed save can be retried.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function publishGithub() {
    setPublishing("github");
    try {
      const saved = await ensureSaved();
      const job = await queueGithubPublication(saved, "private");
      const result = await runGithubPublication(job.id).catch(() => ({ status: "ready" }));
      if (saved.id) await refreshOperations(saved.id);
      setNotice(result?.status === "synced" ? "Full source project synced to GitHub." : "Full source project is GitHub-ready. Managed GitHub authorization can finish the sync when connected.");
    } catch (error) {
      if (error instanceof Error && error.message === "SIGN_IN_REQUIRED") setSignedIn(false);
      setNotice("The source project is safe. GitHub publishing can be retried without rebuilding the site.");
    } finally {
      setPublishing(null);
    }
  }

  async function deployVercel() {
    setPublishing("vercel");
    try {
      const saved = await ensureSaved();
      const job = await queueVercelDeployment(saved);
      const result = await runVercelDeployment(job.id).catch(() => ({ status: "ready" }));
      if (saved.id) await refreshOperations(saved.id);
      if (result?.url) {
        setDraft((current) => normalizeWebsiteDraft({ ...current, integrations: { ...current.integrations, vercel: { ...current.integrations.vercel, deploymentUrl: result.url, projectId: result.projectId || current.integrations.vercel.projectId } } }));
        setNotice(`Vercel deployment created: ${result.url}`);
      } else {
        setNotice("The project is Vercel-ready. Server deployment authorization can complete the publish without source changes.");
      }
    } catch (error) {
      if (error instanceof Error && error.message === "SIGN_IN_REQUIRED") setSignedIn(false);
      setNotice("The ZIP/source project remains deployable. Managed Vercel deployment can be retried.");
    } finally {
      setPublishing(null);
    }
  }

  async function saveLovableBridge() {
    try {
      const saved = await ensureSaved();
      if (!saved.id) return;
      const status = saved.integrations.lovable.projectId || saved.integrations.lovable.editorUrl ? "connected" : "ready";
      await saveStudioIntegration(saved.id, "lovable", status, saved.integrations.lovable, saved.integrations.lovable.projectId, saved.integrations.lovable.editorUrl || saved.integrations.lovable.previewUrl);
      await refreshOperations(saved.id);
      setNotice("Lovable project bridge saved. GitHub remains the canonical source and the ZIP includes Lovable handoff knowledge.");
    } catch {
      setNotice("Save the project before connecting its Lovable workspace.");
    }
  }

  async function saveSupabaseMode() {
    try {
      const saved = await ensureSaved();
      if (!saved.id) return;
      const status = saved.integrations.supabase.mode === "none" ? "disconnected" : "connected";
      await saveStudioIntegration(saved.id, "supabase", status, {
        mode: saved.integrations.supabase.mode,
        projectRef: saved.integrations.supabase.projectRef,
        url: saved.integrations.supabase.url,
        managedFormEndpoint: saved.integrations.supabase.managedFormEndpoint,
      }, saved.integrations.supabase.projectRef, saved.integrations.supabase.url || saved.integrations.supabase.managedFormEndpoint);
      await refreshOperations(saved.id);
      setNotice(saved.integrations.supabase.mode === "managed" ? "Start To Up managed forms connected. Exported websites can submit enquiries immediately." : "Supabase integration settings saved.");
    } catch {
      setNotice("Save the project before connecting its managed backend.");
    }
  }

  async function exportZip() {
    try {
      let exportDraft = draft;
      if (draft.integrations.supabase.mode === "managed" && !draft.integrations.supabase.publicSubmitToken) {
        exportDraft = await ensureSaved();
      }
      const result = await downloadProjectZip(exportDraft);
      if (exportDraft.id) await markWebsiteStudioExported(exportDraft.id).catch(() => undefined);
      setNotice(`Full source ZIP exported: ${result.files.length} files, ready for GitHub and Vercel.`);
    } catch (error) {
      if (error instanceof Error && error.message === "SIGN_IN_REQUIRED") {
        setSignedIn(false);
        setNotice("Sign in once to issue a managed form token, or switch Supabase mode to None/External before exporting.");
      } else {
        setNotice("The project is safe. Try the ZIP export again.");
      }
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

  function openFullPreview() {
    const url = URL.createObjectURL(new Blob([previewHtml], { type: "text/html" }));
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  if (!accessAllowed && signedIn) {
    return <AppShell title="Website Studio" eyebrow="MANAGED BUSINESS WEBSITE SERVICE"><section className="studio-access-card"><LayoutTemplate/><span>MANAGED ACCESS</span><h2>Website Studio is currently reserved for Start To Up administrators.</h2><p>Your projects remain protected.</p><Link to="/website-studio" className="button button-primary">View service</Link></section></AppShell>;
  }

  return (
    <AppShell title="Website Studio V2" eyebrow="DESIGN · INTEGRATE · EXPORT · DEPLOY" action={<Link preload="intent" to="/website-studio" className="button button-secondary">Service overview</Link>}>
      <section className="studio-command-bar">
        <div><span><Sparkles/> PORTABLE BUSINESS WEBSITE OPERATING STUDIO</span><h2>Build once. Own the source. Deploy anywhere.</h2><p>ResKonnect-derived premium design controls with GitHub, Vercel, Supabase and Lovable workflows plus a complete deployable source ZIP.</p></div>
        <div className="studio-command-actions"><button className="button button-secondary" onClick={newProject}><Plus/> New site</button><button className="button button-primary" onClick={() => void saveProject()} disabled={saving}><Save/> {saving ? "Saving" : "Save"}</button></div>
      </section>

      <div className="studio-status-line" role="status"><span>{notice}</span>{signedIn === false ? <Link to="/auth">Sign in to use managed integrations →</Link> : null}</div>

      <section className="studio-project-strip" aria-label="Website projects">
        <button className={!draft.id ? "active" : ""} onClick={newProject}><Plus/><span><strong>New website</strong><small>Start fresh</small></span></button>
        {projects.map((project) => <button className={draft.id === project.id ? "active" : ""} key={project.id} onClick={() => { setDraft(normalizeWebsiteDraft(project)); setNotice(`${project.businessName} loaded.`); }}><LayoutTemplate/><span><strong>{project.businessName}</strong><small>{project.category.replaceAll("-", " ")}</small></span></button>)}
      </section>

      <div className="studio-workbench">
        <aside className="studio-editor">
          <nav className="studio-tabs" aria-label="Website Studio controls">
            {tabs.map(({ key, label, icon: Icon }) => <button key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}><Icon/><span>{label}</span></button>)}
          </nav>

          <div className="studio-panel-scroll">
            {tab === "business" ? <EditorSection title="Business setup" description="Choose the business category and define the project identity.">
              <Field label="Business name"><input value={draft.businessName} onChange={(event) => changeBusinessName(event.target.value)}/></Field>
              <Field label="Project name"><input value={draft.projectName} onChange={(event) => patch("projectName", event.target.value)}/></Field>
              <Field label="Business category"><select value={draft.category} onChange={(event) => setDraft((current) => applyCategoryPreset(current, event.target.value as BusinessCategoryKey))}>{businessCategories.map((item) => <option value={item.key} key={item.key}>{item.label}</option>)}</select></Field>
              <Field label="Location"><input value={draft.site.location} onChange={(event) => patchSite("location", event.target.value)}/></Field>
              <div className="studio-template-card"><LayoutTemplate/><div><span>ACTIVE TEMPLATE</span><strong>ResKonnect Premium</strong><p>Product-grade structure generalized for any serious business category.</p></div><Check/></div>
            </EditorSection> : null}

            {tab === "brand" ? <EditorSection title="Brand system" description="Control the visual identity globally.">
              <Field label="Logo text"><input value={draft.brand.logoText} onChange={(event) => patchBrand("logoText", event.target.value)}/></Field>
              <Field label="Logo image URL"><input placeholder="https://…" value={draft.brand.logoUrl} onChange={(event) => patchBrand("logoUrl", event.target.value)}/></Field>
              <Field label="Favicon URL"><input placeholder="https://…" value={draft.brand.faviconUrl} onChange={(event) => patchBrand("faviconUrl", event.target.value)}/></Field>
              <div className="studio-colour-grid">
                <ColourField label="Primary" value={draft.brand.primary} onChange={(value) => patchBrand("primary", value)}/>
                <ColourField label="Secondary" value={draft.brand.secondary} onChange={(value) => patchBrand("secondary", value)}/>
                <ColourField label="Accent" value={draft.brand.accent} onChange={(value) => patchBrand("accent", value)}/>
                <ColourField label="Surface" value={draft.brand.surface} onChange={(value) => patchBrand("surface", value)}/>
              </div>
              <Field label="Body text colour"><input type="color" value={draft.brand.text} onChange={(event) => patchBrand("text", event.target.value)}/></Field>
              <Field label="Font family"><select value={draft.brand.fontFamily} onChange={(event) => patchBrand("fontFamily", event.target.value as WebsiteStudioDraft["brand"]["fontFamily"])}><option>Inter</option><option>Manrope</option><option>Poppins</option><option>DM Sans</option></select></Field>
            </EditorSection> : null}

            {tab === "layout" ? <EditorSection title="Site customisation" description="Change the website system without editing code.">
              <Field label="Hero layout"><select value={draft.brand.heroStyle} onChange={(event) => patchBrand("heroStyle", event.target.value as WebsiteStudioDraft["brand"]["heroStyle"])}><option value="split">Split visual</option><option value="centered">Centered</option><option value="minimal">Minimal</option></select></Field>
              <Field label="Navigation"><select value={draft.brand.navStyle} onChange={(event) => patchBrand("navStyle", event.target.value as WebsiteStudioDraft["brand"]["navStyle"])}><option value="clean">Clean</option><option value="glass">Sticky glass</option><option value="dark">Dark</option></select></Field>
              <Field label="Cards"><select value={draft.brand.cardStyle} onChange={(event) => patchBrand("cardStyle", event.target.value as WebsiteStudioDraft["brand"]["cardStyle"])}><option value="elevated">Elevated</option><option value="bordered">Bordered</option><option value="glass">Glass</option></select></Field>
              <Field label="Buttons"><select value={draft.brand.buttonStyle} onChange={(event) => patchBrand("buttonStyle", event.target.value as WebsiteStudioDraft["brand"]["buttonStyle"])}><option value="soft">Soft corners</option><option value="pill">Pill</option><option value="square">Square</option></select></Field>
              <Field label={`Corner radius · ${draft.brand.radius}px`}><input type="range" min="4" max="40" value={draft.brand.radius} onChange={(event) => patchBrand("radius", Number(event.target.value))}/></Field>
              <Field label={`Content width · ${draft.brand.maxWidth}px`}><input type="range" min="960" max="1440" step="20" value={draft.brand.maxWidth} onChange={(event) => patchBrand("maxWidth", Number(event.target.value))}/></Field>
              <Field label={`Section spacing · ${draft.brand.sectionSpacing}px`}><input type="range" min="48" max="130" step="2" value={draft.brand.sectionSpacing} onChange={(event) => patchBrand("sectionSpacing", Number(event.target.value))}/></Field>
              <Field label="Hero image URL"><input placeholder="https://…" value={draft.site.heroImageUrl} onChange={(event) => patchSite("heroImageUrl", event.target.value)}/></Field>
              <Field label="Announcement"><input value={draft.site.announcement} onChange={(event) => patchSite("announcement", event.target.value)}/></Field>
              <div className="studio-section-toggles">
                <Toggle label="Announcement" checked={draft.site.showAnnouncement} onChange={(value) => patchSite("showAnnouncement", value)}/>
                <Toggle label="Stats" checked={draft.site.showStats} onChange={(value) => patchSite("showStats", value)}/>
                <Toggle label="Gallery" checked={draft.site.showGallery} onChange={(value) => patchSite("showGallery", value)}/>
              </div>
            </EditorSection> : null}

            {tab === "content" ? <EditorSection title="Website content" description="Change the story, proof and customer journey.">
              <Field label="Headline"><textarea value={draft.site.headline} onChange={(event) => patchSite("headline", event.target.value)}/></Field>
              <Field label="Tagline"><textarea value={draft.site.tagline} onChange={(event) => patchSite("tagline", event.target.value)}/></Field>
              <Field label="Description"><textarea value={draft.site.description} onChange={(event) => patchSite("description", event.target.value)}/></Field>
              <div className="studio-mini-grid"><Field label="Primary CTA"><input value={draft.site.primaryCta} onChange={(event) => patchSite("primaryCta", event.target.value)}/></Field><Field label="Secondary CTA"><input value={draft.site.secondaryCta} onChange={(event) => patchSite("secondaryCta", event.target.value)}/></Field></div>
              <ListEditor label="Services" values={draft.site.services} onChange={(i, value) => updateList("services", i, value)}/>
              <ListEditor label="Trust highlights" values={draft.site.highlights} onChange={(i, value) => updateList("highlights", i, value)}/>
              <ListEditor label="Process" values={draft.site.process} onChange={(i, value) => updateList("process", i, value)}/>
              <ListEditor label="Testimonials" values={draft.site.testimonials} onChange={(i, value) => updateList("testimonials", i, value)}/>
              <div className="studio-list-editor"><span>Stats</span>{draft.site.stats.map((item, index) => <div className="studio-inline-inputs" key={`${item.label}-${index}`}><input value={item.value} onChange={(event) => updateStat(index, "value", event.target.value)}/><input value={item.label} onChange={(event) => updateStat(index, "label", event.target.value)}/></div>)}</div>
              <ListEditor label="Gallery image URLs" values={draft.site.gallery.length ? draft.site.gallery : ["", "", ""]} onChange={(i, value) => {
                const gallery = draft.site.gallery.length ? [...draft.site.gallery] : ["", "", ""];
                gallery[i] = value;
                patchSite("gallery", gallery);
              }}/>
              <div className="studio-section-toggles"><Toggle label="Services" checked={draft.site.showServices} onChange={(value) => patchSite("showServices", value)}/><Toggle label="Trust" checked={draft.site.showHighlights} onChange={(value) => patchSite("showHighlights", value)}/><Toggle label="Process" checked={draft.site.showProcess} onChange={(value) => patchSite("showProcess", value)}/><Toggle label="Testimonials" checked={draft.site.showTestimonials} onChange={(value) => patchSite("showTestimonials", value)}/><Toggle label="Contact" checked={draft.site.showContact} onChange={(value) => patchSite("showContact", value)}/></div>
            </EditorSection> : null}

            {tab === "seo" ? <EditorSection title="SEO & contact" description="Search metadata and customer contact details ship inside every export.">
              <Field label="SEO title"><input value={draft.seo.title} onChange={(event) => patchSeo("title", event.target.value)}/></Field>
              <Field label="Meta description"><textarea value={draft.seo.description} onChange={(event) => patchSeo("description", event.target.value)}/></Field>
              <Field label="Keywords"><textarea value={draft.seo.keywords} onChange={(event) => patchSeo("keywords", event.target.value)}/></Field>
              <Field label="Open Graph image URL"><input value={draft.seo.ogImageUrl} onChange={(event) => patchSeo("ogImageUrl", event.target.value)}/></Field>
              <Toggle label="Allow search indexing" checked={draft.seo.indexable} onChange={(value) => patchSeo("indexable", value)}/>
              <div className="studio-divider"/>
              <Field label="Email"><input type="email" value={draft.contact.email} onChange={(event) => patchContact("email", event.target.value)}/></Field>
              <div className="studio-mini-grid"><Field label="Phone"><input value={draft.contact.phone} onChange={(event) => patchContact("phone", event.target.value)}/></Field><Field label="WhatsApp"><input value={draft.contact.whatsapp} onChange={(event) => patchContact("whatsapp", event.target.value)}/></Field></div>
              <Field label="Address"><input value={draft.contact.address} onChange={(event) => patchContact("address", event.target.value)}/></Field>
              <Field label="Website"><input value={draft.contact.website} onChange={(event) => patchContact("website", event.target.value)}/></Field>
              <div className="studio-mini-grid"><Field label="Instagram"><input value={draft.contact.instagram} onChange={(event) => patchContact("instagram", event.target.value)}/></Field><Field label="LinkedIn"><input value={draft.contact.linkedin} onChange={(event) => patchContact("linkedin", event.target.value)}/></Field></div>
            </EditorSection> : null}

            {tab === "integrations" ? <EditorSection title="Integrations" description="Keep source control, hosting, backend and AI-development handoff in one workspace.">
              <IntegrationCard icon={<Github/>} name="GitHub" state={integrationState(integrations, "github", draft.github.owner && draft.github.repository ? "ready" : "disconnected")} description="Full source tree publication through the Start To Up GitHub App.">
                <Field label="Repository owner"><input value={draft.github.owner} onChange={(event) => patchGithub("owner", event.target.value)}/></Field>
                <Field label="Repository"><input value={draft.github.repository} onChange={(event) => patchGithub("repository", event.target.value)}/></Field>
                <Field label="Branch"><input value={draft.github.branch} onChange={(event) => patchGithub("branch", event.target.value)}/></Field>
                <button className="button button-primary" onClick={() => void publishGithub()} disabled={publishing !== null}><Github/> {publishing === "github" ? "Publishing…" : "Publish source to GitHub"}</button>
              </IntegrationCard>

              <IntegrationCard icon={<Cloud/>} name="Vercel" state={integrationState(integrations, "vercel", draft.integrations.vercel.projectName ? "ready" : "disconnected")} description="Create/deploy the generated Vite project using server-side Vercel authorization.">
                <Field label="Vercel project name"><input value={draft.integrations.vercel.projectName} onChange={(event) => patchIntegration("vercel", "projectName", event.target.value)}/></Field>
                <Field label="Team ID (optional)"><input placeholder="team_…" value={draft.integrations.vercel.teamId} onChange={(event) => patchIntegration("vercel", "teamId", event.target.value)}/></Field>
                <Toggle label="Production deployment" checked={draft.integrations.vercel.production} onChange={(value) => patchIntegration("vercel", "production", value)}/>
                <button className="button button-primary" onClick={() => void deployVercel()} disabled={publishing !== null}><Rocket/> {publishing === "vercel" ? "Deploying…" : "Deploy to Vercel"}</button>
                {draft.integrations.vercel.deploymentUrl ? <a className="studio-integration-link" href={draft.integrations.vercel.deploymentUrl} target="_blank" rel="noreferrer">Open deployment <ExternalLink/></a> : null}
              </IntegrationCard>

              <IntegrationCard icon={<Database/>} name="Supabase" state={draft.integrations.supabase.mode === "none" ? "disconnected" : "connected"} description="Use Start To Up managed forms or connect a dedicated client Supabase project.">
                <Field label="Backend mode"><select value={draft.integrations.supabase.mode} onChange={(event) => patchIntegration("supabase", "mode", event.target.value as WebsiteStudioDraft["integrations"]["supabase"]["mode"])}><option value="managed">Start To Up managed forms</option><option value="external">External Supabase project</option><option value="none">No backend</option></select></Field>
                {draft.integrations.supabase.mode === "managed" ? <div className="studio-managed-note"><Check/><div><strong>Zero-edit managed forms</strong><span>The saved project receives a public scoped form token. No database secret is placed in the website.</span></div></div> : null}
                {draft.integrations.supabase.mode === "external" ? <><Field label="Project ref"><input value={draft.integrations.supabase.projectRef} onChange={(event) => patchIntegration("supabase", "projectRef", event.target.value)}/></Field><Field label="Project URL"><input placeholder="https://…supabase.co" value={draft.integrations.supabase.url} onChange={(event) => patchIntegration("supabase", "url", event.target.value)}/></Field><Field label="Publishable key"><input value={draft.integrations.supabase.publishableKey} onChange={(event) => patchIntegration("supabase", "publishableKey", event.target.value)}/></Field><p className="studio-security-note">Only the public publishable browser key belongs here. Never enter a service-role key.</p></> : null}
                <button className="button button-secondary" onClick={() => void saveSupabaseMode()}><Database/> Save backend connection</button>
              </IntegrationCard>

              <IntegrationCard icon={<Sparkles/>} name="Lovable" state={integrationState(integrations, "lovable", draft.integrations.lovable.projectId || draft.integrations.lovable.editorUrl ? "connected" : "ready")} description="Bridge the generated GitHub project into Lovable for advanced AI edits while keeping GitHub canonical.">
                <Field label="Lovable project ID"><input value={draft.integrations.lovable.projectId} onChange={(event) => patchIntegration("lovable", "projectId", event.target.value)}/></Field>
                <Field label="Editor URL"><input placeholder="https://lovable.dev/projects/…" value={draft.integrations.lovable.editorUrl} onChange={(event) => patchIntegration("lovable", "editorUrl", event.target.value)}/></Field>
                <Field label="Preview URL"><input placeholder="https://…lovable.app" value={draft.integrations.lovable.previewUrl} onChange={(event) => patchIntegration("lovable", "previewUrl", event.target.value)}/></Field>
                <button className="button button-secondary" onClick={() => void saveLovableBridge()}><Link2/> Save Lovable bridge</button>
                {draft.integrations.lovable.editorUrl ? <a className="studio-integration-link" href={draft.integrations.lovable.editorUrl} target="_blank" rel="noreferrer">Open Lovable editor <ExternalLink/></a> : null}
              </IntegrationCard>
            </EditorSection> : null}

            {tab === "export" ? <EditorSection title="Portable source export" description="Download the complete code project—not a flattened webpage.">
              <button className="studio-zip-hero" onClick={() => void exportZip()}><FileArchive/><div><span>FULL SOURCE PROJECT</span><strong>Download deployable ZIP</strong><p>{sourceFileNames.length} generated files · Vite + React + TypeScript · GitHub/Vercel ready</p></div><Download/></button>
              <div className="studio-portability-badges"><span><Check/> npm install</span><span><Check/> npm run build</span><span><Check/> GitHub ready</span><span><Check/> Vercel ready</span></div>
              <div className="studio-source-tree"><header><FolderTree/><div><span>PROJECT STRUCTURE</span><strong>{draft.slug}/</strong></div></header><div className="studio-folder-grid">{sourceFolders.map((folder) => <span key={folder}>▾ {folder}</span>)}</div><details><summary>Show generated files</summary><div className="studio-file-list">{sourceFileNames.map((file) => <code key={file}>{file}</code>)}</div></details></div>
              <div className="studio-export-grid"><button onClick={() => downloadFile(previewHtml, `${draft.slug}.html`, "text/html;charset=utf-8")}><Code2/><strong>Single HTML</strong><span>Quick static copy</span></button><button onClick={() => downloadFile(JSON.stringify(buildPublicationManifest(draft), null, 2), `${draft.slug}-blueprint.json`, "application/json;charset=utf-8")}><FileJson/><strong>Blueprint</strong><span>Portable site config</span></button></div>
              <div className="studio-export-readiness"><strong>What ships in the ZIP</strong><p><code>app/</code>, <code>src/</code>, <code>assets/</code>, <code>public/</code>, <code>api/</code>, <code>env/</code>, <code>supabase/</code>, <code>.github/</code>, <code>.lovable/</code>, <code>package.json</code>, <code>index.html</code>, TypeScript/Vite config, Vercel config, environment templates, README and deployment instructions.</p></div>
              {publicationJobs.length ? <div className="studio-job-list"><span>RECENT PUBLICATION JOBS</span>{publicationJobs.slice(0, 6).map((job) => <div key={job.id}><strong>{String(job.provider).toUpperCase()} · {job.status}</strong><small>{job.client_message || "Project package stored"}</small></div>)}</div> : null}
              {deployments.length ? <div className="studio-job-list"><span>RECENT DEPLOYMENTS</span>{deployments.slice(0, 5).map((deployment) => <div key={deployment.id}><strong>VERCEL · {deployment.status}</strong><small>{deployment.production_url || deployment.preview_url || deployment.external_deployment_id}</small></div>)}</div> : null}
            </EditorSection> : null}
          </div>
        </aside>

        <section className="studio-preview-area">
          <header className="studio-preview-toolbar"><div><span>LIVE GENERATED WEBSITE</span><strong>{draft.businessName}</strong></div><div className="studio-preview-actions"><div className="studio-device-switcher"><button className={device === "desktop" ? "active" : ""} onClick={() => setDevice("desktop")} aria-label="Desktop preview"><Monitor/></button><button className={device === "tablet" ? "active" : ""} onClick={() => setDevice("tablet")} aria-label="Tablet preview"><Tablet/></button><button className={device === "mobile" ? "active" : ""} onClick={() => setDevice("mobile")} aria-label="Mobile preview"><Smartphone/></button></div><button className="studio-open-preview" onClick={openFullPreview}><ExternalLink/> Full preview</button></div></header>
          <div className={`studio-preview-shell device-${device}`}><div className="studio-browser-bar"><i/><i/><i/><span>{draft.contact.website || `https://${draft.slug}.example.com`}</span></div><iframe title={`${draft.businessName} website preview`} srcDoc={previewHtml} sandbox="allow-forms allow-scripts allow-popups"/></div>
        </section>
      </div>
    </AppShell>
  );
}

function integrationState(rows: any[], provider: string, fallback: string) {
  return String(rows.find((row) => row.provider === provider)?.status || fallback);
}

function EditorSection({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <section className="studio-editor-section"><header><h3>{title}</h3><p>{description}</p></header>{children}</section>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="studio-field"><span>{label}</span>{children}</label>;
}

function ColourField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="studio-colour-field"><span>{label}</span><div><input type="color" value={value} onChange={(event) => onChange(event.target.value)}/><input value={value} onChange={(event) => onChange(event.target.value)}/></div></label>;
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="studio-toggle"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)}/><span>{label}</span></label>;
}

function ListEditor({ label, values, onChange }: { label: string; values: readonly string[]; onChange: (index: number, value: string) => void }) {
  return <div className="studio-list-editor"><span>{label}</span>{values.map((value, index) => <input key={`${label}-${index}`} value={value} onChange={(event) => onChange(index, event.target.value)}/>)}</div>;
}

function IntegrationCard({ icon, name, state, description, children }: { icon: ReactNode; name: string; state: string; description: string; children: ReactNode }) {
  return <section className="studio-integration-card"><header><div className="studio-integration-icon">{icon}</div><div><span>{name}</span><strong>{description}</strong></div><i data-state={state}>{state.replaceAll("_", " ")}</i></header><div className="studio-integration-body">{children}</div></section>;
}
