import { Link, createFileRoute } from "@tanstack/react-router";
import {
  Check,
  Cloud,
  Database,
  Download,
  ExternalLink,
  Github,
  LayoutTemplate,
  Monitor,
  Palette,
  Rocket,
  Save,
  Smartphone,
  Sparkles,
  Tablet,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../../components/app-shell";
import { businessCategories, normalizeWebsiteDraft, type WebsiteStudioDraft } from "../../lib/website-studio";
import { studioTemplates } from "../../lib/website-studio-template-catalog";
import { downloadProjectZip, generateDeployableProjectFiles } from "../../lib/website-studio-export";
import { getStructuralFamily, renderStructuralWebsiteHtml, structuralFamilyLabels } from "../../lib/website-studio-structural";
import {
  canUseWebsiteStudio,
  createWebsiteStudioVersion,
  getWebsiteStudioUser,
  queueGithubPublication,
  queueVercelDeployment,
  runGithubPublication,
  runVercelDeployment,
  saveStudioIntegration,
  saveWebsiteStudioProject,
} from "../../lib/website-studio-data";
import "../../website-studio.css";
import "../../website-studio-templates.css";

export const Route = createFileRoute("/app/website-studio-v4")({ component: WebsiteStudioV4Page });

type Tab = "structure" | "brand" | "content" | "integrations" | "export";
type Device = "desktop" | "tablet" | "mobile";

function restoreDraft(): WebsiteStudioDraft {
  if (typeof window === "undefined") return normalizeWebsiteDraft(null);
  try {
    return normalizeWebsiteDraft(JSON.parse(window.localStorage.getItem("start-to-up-website-studio-draft") || "null"));
  } catch {
    return normalizeWebsiteDraft(null);
  }
}

function WebsiteStudioV4Page() {
  const [draft, setDraft] = useState<WebsiteStudioDraft>(() => restoreDraft());
  const [tab, setTab] = useState<Tab>("structure");
  const [device, setDevice] = useState<Device>("desktop");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState<"github" | "vercel" | null>(null);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [allowed, setAllowed] = useState(true);
  const [notice, setNotice] = useState("Structural preview is live.");

  const family = getStructuralFamily(draft);
  const previewHtml = useMemo(() => renderStructuralWebsiteHtml(draft), [draft]);
  const files = useMemo(() => generateDeployableProjectFiles(draft), [draft]);
  const template = studioTemplates.find((item) => item.key === String(draft.templateKey));

  useEffect(() => {
    const timer = window.setTimeout(() => window.localStorage.setItem("start-to-up-website-studio-draft", JSON.stringify(draft)), 150);
    return () => window.clearTimeout(timer);
  }, [draft]);

  useEffect(() => {
    void (async () => {
      const user = await getWebsiteStudioUser();
      setSignedIn(Boolean(user));
      if (!user) return;
      setAllowed(await canUseWebsiteStudio());
    })();
  }, []);

  function patchSite<K extends keyof WebsiteStudioDraft["site"]>(key: K, value: WebsiteStudioDraft["site"][K]) {
    setDraft((current) => normalizeWebsiteDraft({ ...current, site: { ...current.site, [key]: value } }));
  }
  function patchBrand<K extends keyof WebsiteStudioDraft["brand"]>(key: K, value: WebsiteStudioDraft["brand"][K]) {
    setDraft((current) => normalizeWebsiteDraft({ ...current, brand: { ...current.brand, [key]: value } }));
  }
  function patchContact<K extends keyof WebsiteStudioDraft["contact"]>(key: K, value: WebsiteStudioDraft["contact"][K]) {
    setDraft((current) => normalizeWebsiteDraft({ ...current, contact: { ...current.contact, [key]: value } }));
  }
  function patchList(key: "services" | "highlights" | "process" | "testimonials", index: number, value: string) {
    setDraft((current) => {
      const values = [...current.site[key]];
      values[index] = value;
      return normalizeWebsiteDraft({ ...current, site: { ...current.site, [key]: values } });
    });
  }

  async function save() {
    setSaving(true);
    try {
      const saved = await saveWebsiteStudioProject(draft);
      setDraft(saved);
      await createWebsiteStudioVersion(saved).catch(() => undefined);
      setSignedIn(true);
      setNotice("Saved with structural family, content and integrations.");
    } catch (error) {
      if (error instanceof Error && error.message === "SIGN_IN_REQUIRED") setSignedIn(false);
      setNotice("Local draft is safe. Sign in to save the managed project.");
    } finally {
      setSaving(false);
    }
  }

  async function publishGithub() {
    setPublishing("github");
    try {
      const saved = await saveWebsiteStudioProject(draft);
      setDraft(saved);
      const job = await queueGithubPublication(saved, "private");
      const result = await runGithubPublication(job.id).catch(() => ({ status: "ready" }));
      setNotice(result?.status === "synced" ? "Structural source synced to GitHub." : "Full structural source is GitHub-ready.");
    } catch {
      setNotice("GitHub publication can be retried without rebuilding the site.");
    } finally {
      setPublishing(null);
    }
  }

  async function deployVercel() {
    setPublishing("vercel");
    try {
      const saved = await saveWebsiteStudioProject(draft);
      setDraft(saved);
      const job = await queueVercelDeployment(saved);
      const result = await runVercelDeployment(job.id).catch(() => ({ status: "ready" }));
      setNotice(result?.url ? `Vercel deployment created: ${result.url}` : "Structural project is Vercel-ready.");
    } catch {
      setNotice("Vercel deployment can be retried; the source remains portable.");
    } finally {
      setPublishing(null);
    }
  }

  async function saveBackend() {
    try {
      const saved = await saveWebsiteStudioProject(draft);
      setDraft(saved);
      if (!saved.id) return;
      await saveStudioIntegration(saved.id, "supabase", saved.integrations.supabase.mode === "none" ? "disconnected" : "connected", saved.integrations.supabase, saved.integrations.supabase.projectRef, saved.integrations.supabase.url || saved.integrations.supabase.managedFormEndpoint);
      setNotice("Backend connection saved.");
    } catch {
      setNotice("Sign in before saving managed backend settings.");
    }
  }

  if (!allowed && signedIn) return <AppShell title="Website Studio V4"><section className="studio-access-card"><LayoutTemplate/><h2>Website Studio is restricted to managed access.</h2></section></AppShell>;

  return <AppShell title="Website Studio V4" eyebrow="STRUCTURAL TEMPLATE ENGINE" action={<Link to="/app/website-studio-templates" className="button button-secondary">Template library</Link>}>
    <section className="studio-command-bar">
      <div><span><Sparkles/> FULL TEMPLATE-KIT ARCHITECTURE</span><h2>{template?.name || "Custom Website"}</h2><p><strong>{structuralFamilyLabels[family]}</strong> · Different hero DOM, section order and conversion flow. Preview and ZIP use the same renderer.</p></div>
      <div className="studio-command-actions"><button className="button button-primary" onClick={() => void save()} disabled={saving}><Save/> {saving ? "Saving…" : "Save"}</button></div>
    </section>
    <div className="studio-status-line" role="status"><span>{notice}</span>{signedIn === false ? <Link to="/auth">Sign in for managed publishing →</Link> : null}</div>

    <div className="studio-workbench">
      <aside className="studio-editor">
        <nav className="studio-tabs">
          {(["structure","brand","content","integrations","export"] as Tab[]).map((item) => <button key={item} onClick={() => setTab(item)} className={tab === item ? "active" : ""}><span>{item}</span></button>)}
        </nav>
        <div className="studio-panel-scroll">
          {tab === "structure" ? <section className="studio-editor-section"><header><h3>Structural family</h3><p>This changes the actual page architecture, not only styling.</p></header>
            <div className="studio-template-card"><LayoutTemplate/><div><span>ACTIVE KIT</span><strong>{template?.name || String(draft.templateKey)}</strong><p>{structuralFamilyLabels[family]}</p></div><Check/></div>
            <Field label="Business name"><input value={draft.businessName} onChange={(e) => setDraft((current) => normalizeWebsiteDraft({ ...current, businessName: e.target.value, brand: { ...current.brand, logoText: e.target.value.toUpperCase() } }))}/></Field>
            <Field label="Business category"><select value={draft.category} onChange={(e) => setDraft((current) => normalizeWebsiteDraft({ ...current, category: e.target.value as WebsiteStudioDraft["category"] }))}>{businessCategories.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}</select></Field>
            <Field label="Location"><input value={draft.site.location} onChange={(e) => patchSite("location", e.target.value)}/></Field>
            <div className="studio-managed-note"><Check/><div><strong>Family-specific composition</strong><span>{familySummary(family)}</span></div></div>
          </section> : null}

          {tab === "brand" ? <section className="studio-editor-section"><header><h3>Brand system</h3><p>Global visual controls apply inside the structural family.</p></header>
            <Field label="Logo text"><input value={draft.brand.logoText} onChange={(e) => patchBrand("logoText", e.target.value)}/></Field>
            <Field label="Logo URL"><input value={draft.brand.logoUrl} onChange={(e) => patchBrand("logoUrl", e.target.value)}/></Field>
            <div className="studio-colour-grid"><Colour label="Primary" value={draft.brand.primary} onChange={(v) => patchBrand("primary",v)}/><Colour label="Secondary" value={draft.brand.secondary} onChange={(v) => patchBrand("secondary",v)}/><Colour label="Accent" value={draft.brand.accent} onChange={(v) => patchBrand("accent",v)}/><Colour label="Surface" value={draft.brand.surface} onChange={(v) => patchBrand("surface",v)}/></div>
            <Field label="Font"><select value={draft.brand.fontFamily} onChange={(e) => patchBrand("fontFamily", e.target.value as WebsiteStudioDraft["brand"]["fontFamily"])}><option>Inter</option><option>Manrope</option><option>Poppins</option><option>DM Sans</option></select></Field>
            <Field label={`Radius · ${draft.brand.radius}px`}><input type="range" min="4" max="36" value={draft.brand.radius} onChange={(e) => patchBrand("radius",Number(e.target.value))}/></Field>
          </section> : null}

          {tab === "content" ? <section className="studio-editor-section"><header><h3>Family content</h3><p>The same content arrays are interpreted differently by each family: products, courses, rooms, menu items, practice areas, etc.</p></header>
            <Field label="Headline"><textarea value={draft.site.headline} onChange={(e) => patchSite("headline", e.target.value)}/></Field>
            <Field label="Tagline"><textarea value={draft.site.tagline} onChange={(e) => patchSite("tagline", e.target.value)}/></Field>
            <Field label={primaryListLabel(family)}>{draft.site.services.map((value,index) => <input key={index} value={value} onChange={(e) => patchList("services",index,e.target.value)}/>)}</Field>
            <Field label={proofListLabel(family)}>{draft.site.highlights.map((value,index) => <input key={index} value={value} onChange={(e) => patchList("highlights",index,e.target.value)}/>)}</Field>
            <Field label="Journey / process">{draft.site.process.map((value,index) => <input key={index} value={value} onChange={(e) => patchList("process",index,e.target.value)}/>)}</Field>
            <Field label="Email"><input value={draft.contact.email} onChange={(e) => patchContact("email",e.target.value)}/></Field>
            <Field label="Phone"><input value={draft.contact.phone} onChange={(e) => patchContact("phone",e.target.value)}/></Field>
          </section> : null}

          {tab === "integrations" ? <section className="studio-editor-section"><header><h3>Publishing & backend</h3><p>The same structural source is used by ZIP, GitHub and Vercel.</p></header>
            <section className="studio-integration-card"><header><div className="studio-integration-icon"><Github/></div><div><span>GitHub</span><strong>Full structural source tree</strong></div></header><div className="studio-integration-body"><Field label="Owner"><input value={draft.github.owner} onChange={(e) => setDraft((current) => normalizeWebsiteDraft({ ...current, github: { ...current.github, owner:e.target.value } }))}/></Field><Field label="Repository"><input value={draft.github.repository} onChange={(e) => setDraft((current) => normalizeWebsiteDraft({ ...current, github: { ...current.github, repository:e.target.value } }))}/></Field><button className="button button-primary" onClick={() => void publishGithub()} disabled={publishing !== null}><Github/> {publishing === "github" ? "Publishing…" : "Publish to GitHub"}</button></div></section>
            <section className="studio-integration-card"><header><div className="studio-integration-icon"><Cloud/></div><div><span>Vercel</span><strong>Deploy exact generated project</strong></div></header><div className="studio-integration-body"><Field label="Project name"><input value={draft.integrations.vercel.projectName} onChange={(e) => setDraft((current) => normalizeWebsiteDraft({ ...current, integrations: { ...current.integrations, vercel: { ...current.integrations.vercel, projectName:e.target.value } } }))}/></Field><button className="button button-primary" onClick={() => void deployVercel()} disabled={publishing !== null}><Rocket/> {publishing === "vercel" ? "Deploying…" : "Deploy to Vercel"}</button></div></section>
            <section className="studio-integration-card"><header><div className="studio-integration-icon"><Database/></div><div><span>Supabase</span><strong>Managed forms or dedicated backend</strong></div></header><div className="studio-integration-body"><Field label="Backend mode"><select value={draft.integrations.supabase.mode} onChange={(e) => setDraft((current) => normalizeWebsiteDraft({ ...current, integrations: { ...current.integrations, supabase: { ...current.integrations.supabase, mode:e.target.value as WebsiteStudioDraft["integrations"]["supabase"]["mode"] } } }))}><option value="managed">Start To Up managed</option><option value="external">External Supabase</option><option value="none">No backend</option></select></Field><button className="button button-secondary" onClick={() => void saveBackend()}><Database/> Save backend</button></div></section>
          </section> : null}

          {tab === "export" ? <section className="studio-editor-section"><header><h3>Portable structural source</h3><p>Exports the same family architecture shown in the preview.</p></header>
            <button className="studio-zip-hero" onClick={() => { const result = downloadProjectZip(draft); setNotice(`${result.files.length} structural project files exported.`); }}><Download/><div><span>{structuralFamilyLabels[family]}</span><strong>Download deployable ZIP</strong><p>{Object.keys(files).length} files · React + Vite + TypeScript</p></div></button>
            <div className="studio-portability-badges"><span><Check/> Family-specific React source</span><span><Check/> GitHub ready</span><span><Check/> Vercel ready</span></div>
            <div className="studio-source-tree"><header><LayoutTemplate/><div><span>STRUCTURE</span><strong>{family}</strong></div></header><div className="studio-file-list">{Object.keys(files).filter((name) => name.includes("Structural") || name.startsWith("app/")).slice(0,14).map((name) => <code key={name}>{name}</code>)}</div></div>
          </section> : null}
        </div>
      </aside>

      <section className="studio-preview-area">
        <header className="studio-preview-toolbar"><div><span>LIVE STRUCTURAL PREVIEW</span><strong>{structuralFamilyLabels[family]}</strong></div><div className="studio-preview-actions"><div className="studio-device-switcher"><button className={device === "desktop" ? "active" : ""} onClick={() => setDevice("desktop")}><Monitor/></button><button className={device === "tablet" ? "active" : ""} onClick={() => setDevice("tablet")}><Tablet/></button><button className={device === "mobile" ? "active" : ""} onClick={() => setDevice("mobile")}><Smartphone/></button></div><button className="studio-open-preview" onClick={() => { const url = URL.createObjectURL(new Blob([previewHtml],{type:"text/html"})); window.open(url,"_blank","noopener,noreferrer"); window.setTimeout(() => URL.revokeObjectURL(url),60000); }}><ExternalLink/> Full preview</button></div></header>
        <div className={`studio-preview-shell device-${device}`}><div className="studio-browser-bar"><i/><i/><i/><span>{draft.slug}.preview</span></div><iframe title="Structural website preview" srcDoc={previewHtml} sandbox="allow-forms allow-scripts allow-popups"/></div>
      </section>
    </div>
  </AppShell>;
}

function Field({ label, children }: { label:string; children:React.ReactNode }) { return <label className="studio-field"><span>{label}</span>{children}</label>; }
function Colour({ label, value, onChange }: { label:string; value:string; onChange:(value:string)=>void }) { return <label className="studio-colour-field"><span>{label}</span><div><input type="color" value={value} onChange={(e) => onChange(e.target.value)}/><input value={value} onChange={(e) => onChange(e.target.value)}/></div></label>; }
function primaryListLabel(family: ReturnType<typeof getStructuralFamily>) { return ({ saas:"Features / product modules", developer:"API capabilities", portfolio:"Portfolio projects", professional:"Practice areas / services", property:"Property listings", accommodation:"Room types / residences", restaurant:"Menu items", commerce:"Products / collections", healthcare:"Services / treatments", education:"Courses / programmes", events:"Events / trips", industrial:"Capabilities / services", institution:"Programmes / initiatives", business:"Services" } as const)[family]; }
function proofListLabel(family: ReturnType<typeof getStructuralFamily>) { return ({ saas:"Integrations / proof", developer:"SDKs / platform proof", portfolio:"Capabilities / clients", professional:"Credentials / industries", property:"Amenities / trust", accommodation:"Amenities", restaurant:"Featured dishes / trust", commerce:"Collections / benefits", healthcare:"Practitioners / trust", education:"Outcomes / proof", events:"Partners / highlights", industrial:"Compliance / proof", institution:"Impact / resources", business:"Trust highlights" } as const)[family]; }
function familySummary(family: ReturnType<typeof getStructuralFamily>) { return ({ saas:"Product hero → metrics → feature matrix → integrations → use cases → pricing → CTA", developer:"Terminal hero → API capabilities → code example → architecture → docs CTA", portfolio:"Editorial hero → portfolio grid → capabilities → case studies → creative CTA", professional:"Authority hero → practice areas → credentials → engagement process → consultation", property:"Search hero → listing grid → amenities → property journey → viewing CTA", accommodation:"Campus hero → residence grid → amenities → application flow", restaurant:"Hospitality hero → menu → featured dishes → reservation flow", commerce:"Collection hero → promo strip → product catalogue → collections → shop CTA", healthcare:"Care hero → service grid → practitioners → booking flow", education:"Programme finder → course grid → outcomes → admissions", events:"Experience hero → event/trip grid → schedule/itinerary → partners → booking", industrial:"Capability hero → capability grid → project/compliance proof → delivery process", institution:"Mission/news hero → programme grid → impact → newsroom → public CTA", business:"Hero → services → process → contact" } as const)[family]; }
