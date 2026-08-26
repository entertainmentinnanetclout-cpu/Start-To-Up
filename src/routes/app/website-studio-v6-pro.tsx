import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "../../components/app-shell";
import { supabase } from "../../integrations/supabase/client";
import { normalizeWebsiteDraft } from "../../lib/website-studio";
import { renderWebsiteStudioHtml } from "../../lib/website-studio-visual-contracts";
import { ensureStudioV6Draft, type StudioV6Draft } from "../../lib/website-studio-v6";
import { saveStudioV6Settings } from "../../lib/website-studio-v6-data";
import { getWebsiteStudioUser, saveWebsiteStudioProject } from "../../lib/website-studio-data";
import { uploadWebsiteStudioAsset, websiteStudioAssetErrorMessage, type WebsiteStudioAssetSlot } from "../../lib/website-studio-assets";
import { websiteStudioIntegrationGuides, type StudioIntegrationGuide, type StudioIntegrationProvider } from "../../lib/website-studio-integration-guides";
import { providerConnectionStatus, removeProviderConnection, saveProviderConnection, testProviderConnection, type ProviderConnectionState } from "../../lib/website-studio-provider-connections";
import "../../website-studio-v6-pro.css";
import "../../website-studio-visual-contracts.css";

export const Route = createFileRoute("/app/website-studio-v6-pro")({ component: WebsiteStudioV6ProPage });

type Workspace = "visual" | "integrations" | "project";
type ToolTarget =
  | { kind: "image"; binding: "logo" | "hero" | "gallery"; galleryIndex?: number; label: string; current: string }
  | { kind: "text"; binding: string; label: string; current: string };

type IntegrationFormState = Record<string, string>;
const DRAFT_KEY = "start-to-up-website-studio-draft";
const SIDEBAR_KEY = "start-to-up-studio-sidebar-collapsed";

function clone<T>(value: T): T { return structuredClone(value); }
function restoreDraft(): StudioV6Draft {
  if (typeof window === "undefined") return ensureStudioV6Draft(normalizeWebsiteDraft(null) as StudioV6Draft);
  try { return ensureStudioV6Draft(JSON.parse(localStorage.getItem(DRAFT_KEY) || "null") as StudioV6Draft); }
  catch { return ensureStudioV6Draft(normalizeWebsiteDraft(null) as StudioV6Draft); }
}
function readAsDataUrl(file: File) { return new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result || "")); reader.onerror = reject; reader.readAsDataURL(file); }); }
function clean(value: string) { return value.trim().replace(/\s+/g, " "); }
function sameMedia(a: string, b: string) { if (!a || !b) return false; try { return new URL(a, location.href).href === new URL(b, location.href).href; } catch { return a === b; } }

function WebsiteStudioV6ProPage() {
  const [draft, setDraft] = useState<StudioV6Draft>(() => restoreDraft());
  const [workspace, setWorkspace] = useState<Workspace>("visual");
  const [collapsed, setCollapsed] = useState(() => typeof window !== "undefined" && localStorage.getItem(SIDEBAR_KEY) === "1");
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [notice, setNotice] = useState("Double-click or double-tap any logo, image or editable text in the preview.");
  const [target, setTarget] = useState<ToolTarget | null>(null);
  const [busy, setBusy] = useState("");
  const [provider, setProvider] = useState<StudioIntegrationProvider>("vercel");
  const [providerForm, setProviderForm] = useState<IntegrationFormState>({});
  const [providerState, setProviderState] = useState<ProviderConnectionState | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const touchRef = useRef<{ at: number; element: Element | null }>({ at: 0, element: null });
  const previewHtml = useMemo(() => renderWebsiteStudioHtml(draft), [draft]);
  const guide = websiteStudioIntegrationGuides.find((item) => item.provider === provider)!;

  useEffect(() => {
    const timer = window.setTimeout(() => localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)), 120);
    return () => window.clearTimeout(timer);
  }, [draft]);
  useEffect(() => { localStorage.setItem(SIDEBAR_KEY, collapsed ? "1" : "0"); }, [collapsed]);
  useEffect(() => {
    let active = true;
    void getWebsiteStudioUser().then((user) => active && setSignedIn(Boolean(user)));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session?.user));
      if (session?.user) {
        setNotice("Session restored. Your local website draft and all Website Studio tools are still available.");
        if (draft.id) void loadProvider(provider, draft.id);
      } else {
        setNotice("Signed out. Your current draft remains safe on this device; cloud publishing and uploads pause until sign-in.");
      }
    });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, []);
  useEffect(() => { if (draft.id && signedIn) void loadProvider(provider, draft.id); else setProviderState(null); }, [provider, draft.id, signedIn]);

  function change(mutator: (next: StudioV6Draft) => void) { setDraft((current) => { const next = clone(current); mutator(next); return ensureStudioV6Draft(next); }); }

  async function ensureProject() {
    const base = await saveWebsiteStudioProject(draft);
    const next = ensureStudioV6Draft({ ...draft, ...base, studioV6: draft.studioV6 } as StudioV6Draft);
    if (!base.id) throw new Error("SAVE_FAILED");
    await saveStudioV6Settings(base.id, next.studioV6);
    setDraft(next);
    return next;
  }

  async function loadProvider(which: StudioIntegrationProvider, projectId: string) {
    try {
      const state = await providerConnectionStatus(projectId, which);
      setProviderState(state);
      const values: IntegrationFormState = {};
      const providerGuide = websiteStudioIntegrationGuides.find((item) => item.provider === which)!;
      for (const field of providerGuide.fields) if (!field.secret) values[field.key] = String(state.config?.[field.key] ?? "");
      setProviderForm(values);
    } catch { setProviderState(null); }
  }

  function classifyElement(element: Element): ToolTarget | null {
    const image = element.closest("img") as HTMLImageElement | null;
    if (image) {
      const src = image.getAttribute("src") || image.src || "";
      if (image.closest(".vc-logo") || sameMedia(src, draft.brand.logoUrl)) return { kind: "image", binding: "logo", label: "Logo", current: draft.brand.logoUrl || src };
      if (/hero|banner|feature/i.test(String(image.closest("[class]")?.className || "")) || sameMedia(src, draft.site.heroImageUrl)) return { kind: "image", binding: "hero", label: "Hero / banner image", current: draft.site.heroImageUrl || src };
      const index = draft.site.gallery.findIndex((url) => sameMedia(url, src));
      return { kind: "image", binding: "gallery", galleryIndex: index >= 0 ? index : undefined, label: index >= 0 ? `Gallery image ${index + 1}` : "Website graphic", current: src };
    }
    const value = clean(element.textContent || "");
    if (!value || value.length > 1000) return null;
    const fixed: Array<[string, string, string]> = [
      ["businessName", "Business name", draft.businessName], ["brand.logoText", "Logo text", draft.brand.logoText], ["site.headline", "Headline", draft.site.headline],
      ["site.tagline", "Tagline", draft.site.tagline], ["site.description", "Description", draft.site.description], ["site.primaryCta", "Primary button", draft.site.primaryCta], ["site.secondaryCta", "Secondary button", draft.site.secondaryCta],
    ];
    for (const [binding, label, current] of fixed) if (clean(current) === value) return { kind: "text", binding, label, current };
    const lists: Array<[keyof Pick<StudioV6Draft["site"], "services" | "highlights" | "process" | "testimonials">, string]> = [["services", "Service"], ["highlights", "Highlight"], ["process", "Process step"], ["testimonials", "Testimonial"]];
    for (const [key, label] of lists) {
      const index = draft.site[key].findIndex((item) => clean(String(item)) === value);
      if (index >= 0) return { kind: "text", binding: `site.${key}.${index}`, label: `${label} ${index + 1}`, current: String(draft.site[key][index]) };
    }
    return null;
  }

  function openTools(element: Element) {
    const selection = classifyElement(element);
    if (!selection) return setNotice("That element is part of the template structure. Select a logo, graphic or text value to edit it.");
    setTarget(selection); setWorkspace("visual"); setNotice(`${selection.label} selected. Use the contextual tools drawer to update it.`);
  }

  function bindPreviewInteractions() {
    const frame = iframeRef.current;
    const doc = frame?.contentDocument;
    if (!doc) return;
    doc.documentElement.style.cursor = "default";
    const editable = "img,h1,h2,h3,h4,p,a,button,strong,span,blockquote,small";
    doc.querySelectorAll(editable).forEach((node) => {
      const el = node as HTMLElement;
      el.style.cursor = "pointer";
      el.addEventListener("dblclick", (event) => { event.preventDefault(); event.stopPropagation(); openTools(event.currentTarget as Element); });
      el.addEventListener("touchend", (event) => {
        const now = Date.now(); const current = event.currentTarget as Element;
        if (touchRef.current.element === current && now - touchRef.current.at < 360) { event.preventDefault(); openTools(current); touchRef.current = { at: 0, element: null }; }
        else touchRef.current = { at: now, element: current };
      }, { passive: false });
    });
  }

  function updateText(binding: string, value: string) {
    change((next) => {
      if (binding === "businessName") { next.businessName = value; return; }
      if (binding === "brand.logoText") { next.brand.logoText = value; return; }
      const simple = binding.match(/^site\.(headline|tagline|description|primaryCta|secondaryCta)$/);
      if (simple) { (next.site as any)[simple[1]] = value; return; }
      const list = binding.match(/^site\.(services|highlights|process|testimonials)\.(\d+)$/);
      if (list) { const values = [...(next.site as any)[list[1]]]; values[Number(list[2])] = value; (next.site as any)[list[1]] = values; }
    });
    setTarget((current) => current?.kind === "text" ? { ...current, current: value } : current);
  }

  function applyImage(url: string, selection: Extract<ToolTarget, { kind: "image" }>) {
    change((next) => {
      if (selection.binding === "logo") next.brand.logoUrl = url;
      else if (selection.binding === "hero") next.site.heroImageUrl = url;
      else {
        const gallery = [...next.site.gallery];
        if (selection.galleryIndex != null && selection.galleryIndex >= 0) gallery[selection.galleryIndex] = url; else gallery.push(url);
        next.site.gallery = gallery; next.site.showGallery = true;
      }
    });
    setTarget({ ...selection, current: url });
  }

  async function replaceImage(file?: File) {
    if (!file || target?.kind !== "image") return;
    setBusy("image");
    try {
      let url = "";
      if (signedIn) {
        try {
          const slot: WebsiteStudioAssetSlot = target.binding === "logo" ? "logo" : target.binding === "hero" ? "hero" : "gallery";
          const asset = await uploadWebsiteStudioAsset(file, slot, draft.id, { altText: `${draft.businessName} ${target.label}`, source: "contextual-editor" });
          url = asset.publicUrl;
        } catch (error) {
          if (error instanceof Error && error.message !== "SIGN_IN_REQUIRED") throw error;
        }
      }
      if (!url) url = await readAsDataUrl(file);
      applyImage(url, target);
      setNotice(signedIn ? `${target.label} replaced and saved to your media library.` : `${target.label} replaced locally. Sign in to store it in your reusable media library.`);
    } catch (error) { setNotice(websiteStudioAssetErrorMessage(error)); }
    finally { setBusy(""); }
  }

  function removeImage() {
    if (target?.kind !== "image") return;
    applyImage("", target); setNotice(`${target.label} removed from this draft.`);
  }

  async function saveConnection(andTest = false) {
    setBusy("provider");
    try {
      const project = await ensureProject();
      const config: Record<string, unknown> = {};
      let secret = "";
      for (const field of guide.fields) {
        const value = providerForm[field.key] || "";
        if (field.secret) secret = value; else config[field.key] = value;
      }
      await saveProviderConnection(project.id!, provider, config, secret);
      const state = andTest ? await testProviderConnection(project.id!, provider, config, secret) : await providerConnectionStatus(project.id!, provider);
      setProviderState(andTest ? { provider, hasCredential: Boolean(secret) || Boolean(providerState?.hasCredential), credentialHint: providerState?.credentialHint, status: state.status, config, lastError: null } : state);
      setProviderForm((current) => { const next = { ...current }; for (const field of guide.fields) if (field.secret) next[field.key] = ""; return next; });
      setNotice(andTest ? `${guide.name} connection test completed: ${state.status}.` : `${guide.name} setup saved securely.`);
    } catch { setNotice(`${guide.name} could not be connected. Follow the three setup steps and check the required values.`); }
    finally { setBusy(""); }
  }

  return <AppShell title="Website Studio" eyebrow="V6 PRO · VISUAL BUILDER + SELF-SERVICE INTEGRATIONS" action={<Link to="/app/website-studio-v6" className="button button-secondary">All advanced tools</Link>}>
    <section className="v6pro-status"><span>{notice}</span><div>{signedIn ? <b>Session active</b> : <Link to="/auth">Sign in for cloud publishing →</Link>}</div></section>
    <div className={`v6pro-layout ${collapsed ? "sidebar-collapsed" : ""}`}>
      <aside className="v6pro-sidebar">
        <button className="v6pro-collapse" type="button" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? "Expand Website Studio sidebar" : "Collapse Website Studio sidebar"}>{collapsed ? "›" : "‹"}</button>
        <div className="v6pro-sidebar-scroll">
          <div className="v6pro-sidebar-brand"><strong>Website Studio</strong><span>PRO BUILDER</span></div>
          <button className={workspace === "visual" ? "active" : ""} onClick={() => setWorkspace("visual")}><i>01</i><span>Visual tools</span></button>
          <button className={workspace === "integrations" ? "active" : ""} onClick={() => setWorkspace("integrations")}><i>02</i><span>Integrations</span></button>
          <button className={workspace === "project" ? "active" : ""} onClick={() => setWorkspace("project")}><i>03</i><span>Project controls</span></button>
          <div className="v6pro-sidebar-divider" />
          <Link to="/app/website-studio-v6"><i>20</i><span>All 20 capabilities</span></Link>
          <Link to="/app/website-studio-templates"><i>↗</i><span>Template library</span></Link>
        </div>
      </aside>

      <main className="v6pro-main">
        {workspace === "visual" ? <section className="v6pro-workspace">
          <header><div><span>DIRECT VISUAL EDITING</span><h2>Double-click desktop · double-tap mobile</h2><p>Select the actual logo, banner, graphic or text inside the approved template. The contextual drawer edits that exact source value.</p></div></header>
          <div className="v6pro-preview-frame"><iframe ref={iframeRef} title="Interactive exact template preview" srcDoc={previewHtml} onLoad={bindPreviewInteractions}/></div>
        </section> : null}

        {workspace === "integrations" ? <section className="v6pro-workspace integrations">
          <header><div><span>NO API EXPERIENCE REQUIRED</span><h2>Connect services in three steps.</h2><p>Every connector links directly to the provider's official setup page. Secret credentials are encrypted server-side and never exported into ZIPs or repositories.</p></div></header>
          <div className="v6pro-integration-layout">
            <nav className="v6pro-provider-list">{websiteStudioIntegrationGuides.map((item) => <button key={item.provider} className={provider === item.provider ? "active" : ""} onClick={() => setProvider(item.provider)}><strong>{item.name}</strong><span>{item.purpose}</span></button>)}</nav>
            <IntegrationSetup guide={guide} values={providerForm} setValues={setProviderForm} state={providerState} busy={busy === "provider"} onSave={() => void saveConnection(false)} onTest={() => void saveConnection(true)} onRemove={async () => { if (!draft.id) return; setBusy("provider"); try { await removeProviderConnection(draft.id, provider); await loadProvider(provider, draft.id); setNotice(`${guide.name} disconnected. Your website project remains intact.`); } finally { setBusy(""); } }} />
          </div>
        </section> : null}

        {workspace === "project" ? <section className="v6pro-workspace">
          <header><div><span>PROJECT CONTROLS</span><h2>Session-safe website project</h2><p>Your working draft stays on this device across authentication changes. Once signed in, project data, V6 pages and integration state can also be persisted in the managed backend.</p></div></header>
          <div className="v6pro-project-grid"><article><strong>{draft.businessName}</strong><span>{draft.studioV6.pages.length} pages</span></article><article><strong>{draft.templateKey}</strong><span>Template</span></article><article><strong>{signedIn ? "Authenticated" : "Local draft"}</strong><span>Session</span></article></div>
          <div className="v6pro-actions"><button className="button button-primary" disabled={busy === "save"} onClick={async () => { setBusy("save"); try { await ensureProject(); setNotice("Website project and V6 settings saved."); } catch { setNotice("Sign in to save the managed project. Your local draft is still safe."); } finally { setBusy(""); } }}>Save project</button><Link className="button button-secondary" to="/app/website-studio-v6">Open all 20 advanced capabilities</Link></div>
        </section> : null}
      </main>

      {workspace === "visual" ? <aside className={`v6pro-tools ${target ? "open" : ""}`}>
        {!target ? <div className="v6pro-empty-tools"><strong>Contextual tools</strong><p>Double-click or double-tap something in the website preview to edit it.</p></div> : <>
          <header><div><span>SELECTED</span><h3>{target.label}</h3></div><button onClick={() => setTarget(null)}>×</button></header>
          {target.kind === "image" ? <div className="v6pro-tool-content"><img src={target.current || "/brand/start-to-up-symbol.png"} alt="Selected website asset"/><label className="v6pro-upload">Replace {target.binding === "logo" ? "logo" : target.binding === "hero" ? "banner / hero" : "image"}<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={(event) => void replaceImage(event.target.files?.[0])}/></label><button onClick={removeImage}>Remove image</button><button onClick={() => { setWorkspace("project"); setNotice("Use the full Image Editor under All 20 capabilities for crop, focal point, filters, WebP and AVIF variants."); }}>Advanced image tools</button><small>{busy === "image" ? "Uploading…" : signedIn ? "Uploads are stored in your Website Studio media library." : "Sign in to store uploads in the cloud; local replacements still work."}</small></div> : null}
          {target.kind === "text" ? <div className="v6pro-tool-content"><label>{target.label}<textarea rows={target.current.length > 80 ? 6 : 3} value={target.current} onChange={(event) => updateText(target.binding, event.target.value)}/></label><small>Changes update the same template value used by preview, export, GitHub and Vercel.</small></div> : null}
          <div className="v6pro-color-tools"><strong>Global colours</strong>{(["primary","secondary","accent","surface","text"] as const).map((key) => <label key={key}><span>{key}</span><input type="color" value={draft.brand[key]} onChange={(event) => change((next) => { next.brand[key] = event.target.value; })}/></label>)}</div>
        </>}
      </aside> : null}
    </div>
  </AppShell>;
}

function IntegrationSetup({ guide, values, setValues, state, busy, onSave, onTest, onRemove }: { guide: StudioIntegrationGuide; values: IntegrationFormState; setValues: React.Dispatch<React.SetStateAction<IntegrationFormState>>; state: ProviderConnectionState | null; busy: boolean; onSave: () => void; onTest: () => void; onRemove: () => void }) {
  return <section className="v6pro-integration-card">
    <header><div><span>{guide.credentialKind.toUpperCase()}</span><h3>{guide.name}</h3><p>{guide.purpose}</p></div><b className={`status ${state?.status || "disconnected"}`}>{state?.status || "not connected"}</b></header>
    <div className="v6pro-steps">{guide.steps.map((step, index) => <article key={step.title}><b>{index + 1}</b><div><strong>{step.title}</strong><p>{step.detail}</p>{step.url ? <a href={step.url} target="_blank" rel="noreferrer">Open official setup ↗</a> : null}</div></article>)}</div>
    <div className="v6pro-fields">{guide.fields.map((field) => <label key={field.key}><span>{field.label}</span><input type={field.secret ? "password" : "text"} autoComplete="off" value={values[field.key] || ""} placeholder={field.secret && state?.hasCredential ? state.credentialHint || "Saved securely — enter only to replace" : field.placeholder} onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))}/>{field.help ? <small>{field.help}</small> : null}</label>)}</div>
    <div className="v6pro-integration-actions"><button className="button button-primary" disabled={busy} onClick={onTest}>{busy ? "Checking…" : "Save & test connection"}</button><button className="button button-secondary" disabled={busy} onClick={onSave}>Save setup</button>{state?.status && state.status !== "disconnected" ? <button className="danger" onClick={onRemove}>Disconnect</button> : null}</div>
    <footer><a href={guide.officialUrl} target="_blank" rel="noreferrer">Provider setup ↗</a><a href={guide.docsUrl} target="_blank" rel="noreferrer">Official documentation ↗</a></footer>
  </section>;
}
