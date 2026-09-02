import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  AlignCenter,
  AlignLeft,
  AlignRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Image as ImageIcon,
  LayoutPanelTop,
  Maximize2,
  Minimize2,
  Palette,
  PlugZap,
  Redo2,
  RefreshCw,
  Rocket,
  Smartphone,
  Type,
  Undo2,
  Upload,
  X,
} from "lucide-react";
import { uploadWebsiteStudioAsset, websiteStudioAssetErrorMessage, type WebsiteStudioAssetSlot } from "../lib/website-studio-assets";
import type { StudioV6Device, StudioV6Draft, StudioV6Section } from "../lib/website-studio-v6";
import { WebsiteStudioProviderSetup } from "./website-studio-provider-setup";
import "../website-studio-visual-editor.css";

type ContextTarget = {
  kind: "image" | "text" | "button" | "section";
  text: string;
  src: string;
  className: string;
  tagName: string;
  sectionClassName: string;
  sectionText: string;
  sectionId: string | null;
};

type EditorProps = {
  frameSelector?: string;
  forceExactPreview?: boolean;
  showIntegrations?: boolean;
};

type InspectorTab = "content" | "design" | "layout" | "responsive";
type PublishCheck = { label: string; detail: string; status: "pass" | "warn" };

const DRAFT_KEY = "start-to-up-website-studio-draft";
const EDITOR_DEVICE_KEY = "start-to-up-studio-context-device";
const FOCUS_KEY = "start-to-up-studio-focus-mode";
const HISTORY_KEY = "start-to-up-studio-undo-history";
const REDO_KEY = "start-to-up-studio-redo-history";
const defaultFrameSelector = '.v6-preview iframe[title="Exact site preview"]';

function readDraft(): StudioV6Draft | null {
  try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || "null") as StudioV6Draft | null; } catch { return null; }
}
function writeDraft(draft: StudioV6Draft) {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  window.dispatchEvent(new CustomEvent("stu-studio-draft-updated", { detail: draft }));
}
function readStack(key: string): StudioV6Draft[] {
  try { return JSON.parse(localStorage.getItem(key) || "[]") as StudioV6Draft[]; } catch { return []; }
}
function writeStack(key: string, stack: StudioV6Draft[]) { localStorage.setItem(key, JSON.stringify(stack.slice(-15))); }
function pushUndo(draft: StudioV6Draft) { const stack = readStack(HISTORY_KEY); stack.push(structuredClone(draft)); writeStack(HISTORY_KEY, stack); localStorage.removeItem(REDO_KEY); }
function normalizeSrc(value: string) { try { return new URL(value, location.href).href; } catch { return value; } }
function compact(value: unknown) { return String(value ?? "").trim().replace(/\s+/g, " "); }
function deepStrings(value: unknown): string[] {
  if (typeof value === "string" || typeof value === "number") return [String(value)];
  if (Array.isArray(value)) return value.flatMap(deepStrings);
  if (value && typeof value === "object") return Object.values(value as Record<string, unknown>).flatMap(deepStrings);
  return [];
}
function replaceDeep(value: unknown, previous: string, nextText: string): unknown {
  if (typeof value === "string") return compact(value) === compact(previous) ? nextText : value;
  if (Array.isArray(value)) return value.map((item) => replaceDeep(item, previous, nextText));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, replaceDeep(item, previous, nextText)]));
  return value;
}

function patchText(draft: StudioV6Draft, previous: string, nextText: string) {
  if (!previous || compact(previous) === compact(nextText)) return;
  const site = draft.site;
  const scalarSiteKeys = ["headline", "tagline", "description", "primaryCta", "secondaryCta", "announcement", "location"] as const;
  for (const key of scalarSiteKeys) if (compact(site[key]) === compact(previous)) site[key] = nextText as never;
  if (compact(draft.businessName) === compact(previous)) draft.businessName = nextText;
  if (compact(draft.brand.logoText) === compact(previous)) draft.brand.logoText = nextText;
  const contactKeys = ["email", "phone", "whatsapp", "address", "website", "instagram", "facebook", "linkedin"] as const;
  for (const key of contactKeys) if (compact(draft.contact[key]) === compact(previous)) draft.contact[key] = nextText;
  const listKeys = ["services", "highlights", "process", "testimonials"] as const;
  for (const key of listKeys) site[key] = site[key].map((value) => compact(value) === compact(previous) ? nextText : value) as never;
  site.stats = site.stats.map((item) => ({ value: compact(item.value) === compact(previous) ? nextText : item.value, label: compact(item.label) === compact(previous) ? nextText : item.label }));
  for (const page of draft.studioV6?.pages || []) {
    if (compact(page.title) === compact(previous)) page.title = nextText;
    for (const section of page.sections || []) {
      if (compact(section.title) === compact(previous)) section.title = nextText;
      section.content = replaceDeep(section.content || {}, previous, nextText) as Record<string, unknown>;
    }
  }
}

function resolveSection(draft: StudioV6Draft, target: Pick<ContextTarget, "text" | "className" | "sectionClassName" | "sectionText">): StudioV6Section | null {
  const page = draft.studioV6.pages.find((item) => item.slug === draft.studioV6.activePageSlug) || draft.studioV6.pages[0];
  if (!page) return null;
  const targetText = compact(target.text).toLowerCase();
  const sectionText = compact(target.sectionText).toLowerCase();
  const classText = `${target.className} ${target.sectionClassName}`.toLowerCase();
  let winner: { section: StudioV6Section; score: number } | null = null;
  for (const section of page.sections) {
    let score = 0;
    if (new RegExp(`(^|[-_\\s])${section.type}($|[-_\\s])`, "i").test(classText)) score += 7;
    const title = compact(section.title).toLowerCase();
    if (title && sectionText.includes(title)) score += 4;
    const content = compact(deepStrings(section.content).join(" ")).toLowerCase();
    if (targetText.length >= 4 && content.includes(targetText.slice(0, 160))) score += 8;
    if (targetText.length >= 4 && title === targetText) score += 8;
    if (!winner || score > winner.score) winner = { section, score };
  }
  return winner && winner.score >= 4 ? winner.section : null;
}

function resolveImageSlot(draft: StudioV6Draft, target: ContextTarget): { slot: WebsiteStudioAssetSlot; target: "logo" | "favicon" | "hero" | "gallery"; galleryIndex?: number } {
  const source = normalizeSrc(target.src);
  const className = `${target.className} ${target.sectionClassName}`.toLowerCase();
  if ((draft.brand.logoUrl && normalizeSrc(draft.brand.logoUrl) === source) || /logo|brand/.test(className)) return { slot: "logo", target: "logo" };
  if ((draft.brand.faviconUrl && normalizeSrc(draft.brand.faviconUrl) === source) || /favicon/.test(className)) return { slot: "favicon", target: "favicon" };
  if ((draft.site.heroImageUrl && normalizeSrc(draft.site.heroImageUrl) === source) || /hero|lead|feature|banner/.test(className)) return { slot: "hero", target: "hero" };
  const index = draft.site.gallery.findIndex((url) => normalizeSrc(url) === source);
  if (index >= 0) return { slot: "gallery", target: "gallery", galleryIndex: index };
  return { slot: "gallery", target: "gallery", galleryIndex: undefined };
}

function publishChecks(draft: StudioV6Draft | null): PublishCheck[] {
  if (!draft) return [];
  const visiblePages = draft.studioV6.pages.filter((page) => page.visible);
  const missingSeo = visiblePages.filter((page) => !compact(page.seo.title) || compact(page.seo.description).length < 40);
  const mobileGaps = visiblePages.flatMap((page) => page.sections).filter((section) => !section.responsive?.mobile);
  const formsReady = draft.studioV6.forms.length > 0 && draft.studioV6.forms.every((form) => form.fields.length > 0 && form.spam.honeypot && form.spam.minimumSeconds >= 1);
  const mediaAltReady = draft.studioV6.industryRecords.every((record) => record.media.every((item) => Boolean(compact(item.alt))));
  return [
    { label: "Pages & navigation", detail: visiblePages.length ? `${visiblePages.length} visible pages are in the release graph.` : "No visible pages are available to publish.", status: visiblePages.length ? "pass" : "warn" },
    { label: "SEO metadata", detail: missingSeo.length ? `${missingSeo.length} page${missingSeo.length === 1 ? "" : "s"} need stronger title/description metadata.` : "Visible pages have title and description metadata.", status: missingSeo.length ? "warn" : "pass" },
    { label: "Responsive rules", detail: mobileGaps.length ? `${mobileGaps.length} sections are missing explicit mobile behaviour.` : "Every visible section has mobile responsive rules.", status: mobileGaps.length ? "warn" : "pass" },
    { label: "Accessibility", detail: draft.studioV6.accessibility.enforceAltText && draft.studioV6.accessibility.enforceContrast && mediaAltReady ? "Alt-text and contrast enforcement are enabled." : "Review accessibility enforcement or media alt text before release.", status: draft.studioV6.accessibility.enforceAltText && draft.studioV6.accessibility.enforceContrast && mediaAltReady ? "pass" : "warn" },
    { label: "Forms & abuse protection", detail: formsReady ? "Forms have fields and minimum anti-spam controls." : "Review form fields and honeypot/minimum-time controls.", status: formsReady ? "pass" : "warn" },
    { label: "Performance", detail: draft.studioV6.optimization.lazyImages && draft.studioV6.optimization.responsiveImages && draft.studioV6.optimization.webp ? "Lazy loading, responsive images and WebP optimisation are enabled." : "Enable image optimisation before production release.", status: draft.studioV6.optimization.lazyImages && draft.studioV6.optimization.responsiveImages && draft.studioV6.optimization.webp ? "pass" : "warn" },
    { label: "Production domain", detail: draft.studioV6.domain.production ? draft.studioV6.domain.production : "No production domain is recorded yet.", status: draft.studioV6.domain.production ? "pass" : "warn" },
  ];
}

export function WebsiteStudioV6Enhancements({ frameSelector = defaultFrameSelector, forceExactPreview = true, showIntegrations = true }: EditorProps = {}) {
  const [target, setTarget] = useState<ContextTarget | null>(null);
  const [text, setText] = useState("");
  const [providerOpen, setProviderOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("Tap or click any visible item in the exact preview to edit it.");
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("content");
  const [focusMode, setFocusMode] = useState(() => typeof window !== "undefined" && localStorage.getItem(FOCUS_KEY) === "1");
  const [preflightOpen, setPreflightOpen] = useState(false);
  const [historyVersion, setHistoryVersion] = useState(0);
  const [styleDevice, setStyleDevice] = useState<StudioV6Device>(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(EDITOR_DEVICE_KEY) : null;
    return saved === "tablet" || saved === "mobile" ? saved : "desktop";
  });
  const attached = useRef<HTMLIFrameElement | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const lastTouchSelectionAt = useRef(0);

  useEffect(() => { localStorage.setItem(EDITOR_DEVICE_KEY, styleDevice); }, [styleDevice]);
  useEffect(() => {
    localStorage.setItem(FOCUS_KEY, focusMode ? "1" : "0");
    document.body.classList.toggle("stu-focus-mode", focusMode);
    return () => document.body.classList.remove("stu-focus-mode");
  }, [focusMode]);
  useEffect(() => {
    if (!forceExactPreview) return;
    const exactButton = Array.from(document.querySelectorAll<HTMLButtonElement>(".v6-preview header button")).find((button) => button.textContent?.trim().toLowerCase() === "exact preview");
    exactButton?.click();
  }, [forceExactPreview]);

  useEffect(() => {
    const openTarget = (raw: EventTarget | null, doc: Document) => {
      const element = raw instanceof Element ? raw : null;
      if (!element) return;
      const editable = element.closest("img,a,button,h1,h2,h3,h4,p,span,strong,small,em,blockquote,section,header,aside,article") as HTMLElement | null;
      if (!editable) return;
      const image = editable.tagName === "IMG" ? editable as HTMLImageElement : editable.querySelector("img");
      const tag = editable.tagName.toLowerCase();
      const sectionRoot = editable.closest("section,article,header,aside") as HTMLElement | null;
      const kind: ContextTarget["kind"] = image ? "image" : ["a", "button"].includes(tag) ? "button" : ["section", "header", "aside", "article"].includes(tag) ? "section" : "text";
      const base: ContextTarget = { kind, text: compact(editable.textContent).slice(0, 2400), src: image?.src || "", className: `${editable.className || ""} ${image?.className || ""}`, tagName: tag, sectionClassName: String(sectionRoot?.className || ""), sectionText: compact(sectionRoot?.textContent).slice(0, 5000), sectionId: null };
      const draft = readDraft();
      const section = draft ? resolveSection(draft, base) : null;
      const context = { ...base, sectionId: section?.id || null };
      doc.querySelectorAll("[data-stu-selected]").forEach((node) => node.removeAttribute("data-stu-selected"));
      editable.setAttribute("data-stu-selected", "true");
      setTarget(context);
      setText(context.text);
      setInspectorTab(kind === "section" ? "layout" : "content");
      setNotice(kind === "image" ? "Image tools opened." : kind === "section" ? "Section layout tools opened." : "Content and visual tools opened.");
    };

    const wireFrame = (frame: HTMLIFrameElement) => {
      cleanupRef.current?.();
      const wire = () => {
        const doc = frame.contentDocument;
        if (!doc) return;
        doc.getElementById("stu-editor-inspector-style")?.remove();
        const style = doc.createElement("style");
        style.id = "stu-editor-inspector-style";
        style.textContent = `[data-stu-hover="true"]{outline:2px dashed rgba(23,55,209,.62)!important;outline-offset:2px!important;cursor:pointer!important}[data-stu-selected="true"]{outline:3px solid #1737d1!important;outline-offset:3px!important;cursor:pointer!important}html{touch-action:manipulation}`;
        doc.head?.appendChild(style);
        const editableSelector = "img,a,button,h1,h2,h3,h4,p,span,strong,small,em,blockquote,section,header,aside,article";
        const onPointerOver = (event: PointerEvent) => { const element = event.target instanceof Element ? event.target.closest(editableSelector) : null; if (element) element.setAttribute("data-stu-hover", "true"); };
        const onPointerOut = (event: PointerEvent) => { const element = event.target instanceof Element ? event.target.closest(editableSelector) : null; element?.removeAttribute("data-stu-hover"); };
        const onClick = (event: MouseEvent) => {
          const element = event.target instanceof Element ? event.target : null;
          if (!element) return;
          event.preventDefault(); event.stopPropagation();
          if (Date.now() - lastTouchSelectionAt.current < 500) return;
          const link = element.closest("a") as HTMLAnchorElement | null;
          const button = element.closest("button");
          if (link || button) {
            const page = link?.dataset.studioPage;
            if (page) {
              const draft = readDraft();
              if (draft) { pushUndo(draft); draft.studioV6.activePageSlug = page; writeDraft(draft); setHistoryVersion((value) => value + 1); setNotice(`Opening ${page === "/" ? "Home" : page} in the editor without navigating the preview away.`); window.setTimeout(() => window.location.reload(), 80); return; }
            }
          }
          openTarget(event.target, doc);
        };
        const onDoubleClick = (event: MouseEvent) => { event.preventDefault(); event.stopPropagation(); openTarget(event.target, doc); };
        const onPointerUp = (event: PointerEvent) => { if (event.pointerType !== "touch" && event.pointerType !== "pen") return; event.preventDefault(); event.stopPropagation(); lastTouchSelectionAt.current = Date.now(); openTarget(event.target, doc); };
        const onSubmit = (event: SubmitEvent) => { event.preventDefault(); event.stopPropagation(); setNotice("Forms are disabled while editing. They remain active in published output."); };
        doc.addEventListener("pointerover", onPointerOver, true); doc.addEventListener("pointerout", onPointerOut, true); doc.addEventListener("click", onClick, true); doc.addEventListener("dblclick", onDoubleClick, true); doc.addEventListener("pointerup", onPointerUp, true); doc.addEventListener("submit", onSubmit, true);
        cleanupRef.current = () => { doc.removeEventListener("pointerover", onPointerOver, true); doc.removeEventListener("pointerout", onPointerOut, true); doc.removeEventListener("click", onClick, true); doc.removeEventListener("dblclick", onDoubleClick, true); doc.removeEventListener("pointerup", onPointerUp, true); doc.removeEventListener("submit", onSubmit, true); style.remove(); };
      };
      frame.addEventListener("load", wire); wire();
      const innerCleanup = cleanupRef.current;
      cleanupRef.current = () => { frame.removeEventListener("load", wire); innerCleanup?.(); };
    };
    const timer = window.setInterval(() => { const frame = document.querySelector<HTMLIFrameElement>(frameSelector); if (!frame || frame === attached.current) return; attached.current = frame; wireFrame(frame); }, 250);
    return () => { window.clearInterval(timer); cleanupRef.current?.(); cleanupRef.current = null; };
  }, [frameSelector]);

  useEffect(() => {
    if (!target && !providerOpen && !preflightOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setTarget(null); setProviderOpen(false); setPreflightOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.classList.add("stu-side-panel-open");
    return () => { document.removeEventListener("keydown", onKeyDown); document.body.classList.remove("stu-side-panel-open"); };
  }, [target, providerOpen, preflightOpen]);

  function commit(mutator: (draft: StudioV6Draft) => void, message: string, reload = true) {
    const draft = readDraft();
    if (!draft) return;
    pushUndo(draft);
    mutator(draft);
    writeDraft(draft);
    setHistoryVersion((value) => value + 1);
    setNotice(message);
    if (reload) window.setTimeout(() => window.location.reload(), 90);
  }

  function undoDraft() {
    const current = readDraft(); const history = readStack(HISTORY_KEY); const previous = history.pop();
    if (!current || !previous) return setNotice("Nothing else to undo.");
    const redo = readStack(REDO_KEY); redo.push(structuredClone(current)); writeStack(REDO_KEY, redo); writeStack(HISTORY_KEY, history); writeDraft(previous); setNotice("Previous Website Studio state restored."); setHistoryVersion((value) => value + 1); window.setTimeout(() => window.location.reload(), 80);
  }
  function redoDraft() {
    const current = readDraft(); const redo = readStack(REDO_KEY); const next = redo.pop();
    if (!current || !next) return setNotice("Nothing else to redo.");
    const history = readStack(HISTORY_KEY); history.push(structuredClone(current)); writeStack(HISTORY_KEY, history); writeStack(REDO_KEY, redo); writeDraft(next); setNotice("Website Studio change reapplied."); setHistoryVersion((value) => value + 1); window.setTimeout(() => window.location.reload(), 80);
  }

  function updateText() {
    if (!target) return;
    const next = text.trim();
    if (!next) return setNotice("Text cannot be empty. Use the section controls to hide a block instead.");
    commit((draft) => patchText(draft, target.text, next), "Text updated in the shared Website Studio draft.");
  }
  function updateBrand<K extends keyof StudioV6Draft["brand"]>(key: K, value: StudioV6Draft["brand"][K]) { commit((draft) => { draft.brand[key] = value; }, `Brand ${String(key)} updated across the website.`); }
  function updateSection(mutator: (section: StudioV6Section) => void, message: string) {
    if (!target?.sectionId) return setNotice("This visual block is template-managed. Use global brand controls or the advanced section editor for structural changes.");
    commit((draft) => { const page = draft.studioV6.pages.find((item) => item.slug === draft.studioV6.activePageSlug) || draft.studioV6.pages[0]; const section = page?.sections.find((item) => item.id === target.sectionId); if (section) mutator(section); }, message);
  }

  async function replaceImage(file: File | undefined, forced?: "logo" | "hero" | "gallery") {
    if (!file || !target) return;
    const draft = readDraft(); if (!draft) return;
    const resolved = resolveImageSlot(draft, target);
    const selected = forced === "logo" ? { slot: "logo" as const, target: "logo" as const } : forced === "hero" ? { slot: "hero" as const, target: "hero" as const } : forced === "gallery" ? { slot: "gallery" as const, target: "gallery" as const, galleryIndex: resolved.galleryIndex } : resolved;
    setBusy(true);
    try {
      const asset = await uploadWebsiteStudioAsset(file, selected.slot, draft.id, { altText: `${draft.businessName} ${selected.target}`, source: "context-tools" });
      pushUndo(draft);
      if (selected.target === "logo") draft.brand.logoUrl = asset.publicUrl;
      else if (selected.target === "favicon") draft.brand.faviconUrl = asset.publicUrl;
      else if (selected.target === "hero") draft.site.heroImageUrl = asset.publicUrl;
      else { const index = selected.galleryIndex ?? -1; if (index >= 0 && index < draft.site.gallery.length) draft.site.gallery[index] = asset.publicUrl; else draft.site.gallery.push(asset.publicUrl); draft.site.showGallery = true; }
      writeDraft(draft); setHistoryVersion((value) => value + 1); setNotice("Replacement uploaded and saved to the shared draft."); window.setTimeout(() => window.location.reload(), 100);
    } catch (error) { setNotice(websiteStudioAssetErrorMessage(error)); } finally { setBusy(false); }
  }

  function removeImage() {
    if (!target?.src) return;
    commit((draft) => { const source = normalizeSrc(target.src); if (draft.brand.logoUrl && normalizeSrc(draft.brand.logoUrl) === source) draft.brand.logoUrl = ""; if (draft.brand.faviconUrl && normalizeSrc(draft.brand.faviconUrl) === source) draft.brand.faviconUrl = ""; if (draft.site.heroImageUrl && normalizeSrc(draft.site.heroImageUrl) === source) draft.site.heroImageUrl = ""; draft.site.gallery = draft.site.gallery.filter((url) => normalizeSrc(url) !== source); if (!draft.site.gallery.length) draft.site.showGallery = false; }, "Image removed from this draft.");
  }

  function openPanel(label: string) {
    const button = Array.from(document.querySelectorAll<HTMLButtonElement>(".v6-nav button")).find((item) => item.textContent?.trim().toLowerCase() === label.toLowerCase());
    button?.click(); setTarget(null);
  }
  function openReleaseTools() {
    setPreflightOpen(false);
    const button = Array.from(document.querySelectorAll<HTMLButtonElement>(".v6-nav button")).find((item) => item.textContent?.trim().toLowerCase() === "export & publish");
    if (button) { button.click(); setFocusMode(false); return; }
    window.location.assign("/app/website-studio-v6");
  }

  const draft = typeof window !== "undefined" ? readDraft() : null;
  const selectedSection = useMemo(() => {
    if (!draft || !target?.sectionId) return null;
    const page = draft.studioV6.pages.find((item) => item.slug === draft.studioV6.activePageSlug) || draft.studioV6.pages[0];
    return page?.sections.find((section) => section.id === target.sectionId) || null;
  }, [draft, target?.sectionId]);
  const responsive = selectedSection?.responsive?.[styleDevice];
  const activePage = draft?.studioV6.pages.find((page) => page.slug === draft.studioV6.activePageSlug) || draft?.studioV6.pages[0];
  const checks = publishChecks(draft);
  const passed = checks.filter((check) => check.status === "pass").length;
  const score = checks.length ? Math.round(passed / checks.length * 100) : 0;
  const canUndo = readStack(HISTORY_KEY).length > 0;
  const canRedo = readStack(REDO_KEY).length > 0;
  void historyVersion;

  return <>
    <div className="stu-editor-toolbar" aria-label="Website Studio power tools">
      <button type="button" onClick={() => setFocusMode((value) => !value)} title={focusMode ? "Exit focus mode" : "Focus mode"}>{focusMode ? <Minimize2 size={15}/> : <Maximize2 size={15}/>}<span>{focusMode ? "Exit focus" : "Focus"}</span></button>
      <button type="button" onClick={undoDraft} disabled={!canUndo} title="Undo"><Undo2 size={15}/><span>Undo</span></button>
      <button type="button" onClick={redoDraft} disabled={!canRedo} title="Redo"><Redo2 size={15}/><span>Redo</span></button>
      <button type="button" className="release" onClick={() => setPreflightOpen(true)} title="Run publish readiness check"><Rocket size={15}/><span>Publish check</span></button>
    </div>
    {showIntegrations ? <button className="stu-integrations-fab" onClick={() => setProviderOpen(true)}><PlugZap size={17}/> Integrations</button> : null}
    <WebsiteStudioProviderSetup open={providerOpen} onClose={() => setProviderOpen(false)}/>

    {preflightOpen ? <div className="stu-preflight-layer" role="dialog" aria-modal="true" aria-label="Publish readiness"><button className="stu-preflight-backdrop" onClick={() => setPreflightOpen(false)} aria-label="Close publish readiness"/><section className="stu-preflight-card"><header><div><span>PUBLISH READINESS</span><h3>{score}% ready for release</h3><p>Run this gate before export, GitHub publication or Vercel deployment.</p></div><button className="stu-panel-close" onClick={() => setPreflightOpen(false)} aria-label="Close publish readiness"><X/></button></header><div className="stu-preflight-score"><strong>{passed}/{checks.length}</strong><span>release checks passing</span></div><div className="stu-preflight-list">{checks.map((check) => <article className={check.status} key={check.label}>{check.status === "pass" ? <CheckCircle2/> : <AlertTriangle/>}<div><strong>{check.label}</strong><span>{check.detail}</span></div><b>{check.status === "pass" ? "Ready" : "Review"}</b></article>)}</div><footer><button onClick={() => setPreflightOpen(false)}>Continue editing</button><button className="primary" onClick={openReleaseTools}>Open export & publish</button></footer></section></div> : null}

    {target ? <div className="stu-context-layer" role="presentation">
      <button className="stu-context-backdrop" onClick={() => setTarget(null)} aria-label="Close visual editing tools"/>
      <aside className="stu-context-drawer" role="dialog" aria-modal="true" aria-label="Visual editing tools">
        <header><div><span>VISUAL EDITOR</span><h3>{target.kind === "image" ? "Image / graphic" : target.kind === "button" ? "Button / link" : target.kind === "section" ? "Section / banner" : "Text"}</h3><p>Changes write to the shared draft used by save, ZIP, GitHub and Vercel output.</p></div><button className="stu-panel-close" onClick={() => setTarget(null)} aria-label="Close visual editing tools"><X/></button></header>
        <div className="stu-selection-breadcrumb"><span>{activePage?.title || "Page"}</span><b>›</b><span>{selectedSection?.title || selectedSection?.type || "Visual block"}</span><b>›</b><strong>{target.kind}</strong></div>
        <nav className="stu-inspector-tabs" aria-label="Inspector sections">{(["content", "design", "layout", "responsive"] as InspectorTab[]).map((tab) => <button type="button" key={tab} className={inspectorTab === tab ? "active" : ""} onClick={() => setInspectorTab(tab)}>{tab}</button>)}</nav>

        {inspectorTab === "content" && target.kind === "image" ? <section><h4><ImageIcon size={15}/> Image</h4><div className="stu-current-asset">{target.src ? <img src={target.src} alt="Current selected asset"/> : <span>No image detected</span>}</div><label className="stu-upload-action"><Upload size={15}/>{busy ? "Uploading…" : "Replace this image"}<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" disabled={busy} onChange={(event) => void replaceImage(event.target.files?.[0])}/></label><div className="stu-context-actions"><label>Use as logo<input type="file" accept="image/*" onChange={(event) => void replaceImage(event.target.files?.[0], "logo")}/></label><label>Use as hero/banner<input type="file" accept="image/*" onChange={(event) => void replaceImage(event.target.files?.[0], "hero")}/></label><button onClick={removeImage}>Remove image</button><button onClick={() => openPanel("Image editor")}>Advanced crop & image tools</button></div></section> : null}
        {inspectorTab === "content" && target.kind !== "image" && target.text ? <section><h4><Type size={15}/> Content</h4><textarea rows={Math.min(9, Math.max(4, Math.ceil(text.length / 75)))} value={text} onChange={(event) => setText(event.target.value)}/><button className="primary" onClick={updateText}>Apply text</button></section> : null}
        {inspectorTab === "content" && !target.text && target.kind !== "image" ? <section className="stu-context-help"><Type size={15}/><span>This structural element has no direct text value. Use Layout or Responsive controls.</span></section> : null}

        {inspectorTab === "design" ? <section><h4><Palette size={15}/> Brand system</h4><div className="stu-color-grid">{(["primary", "secondary", "accent", "surface", "text"] as const).map((key) => <label key={key}><span>{key}</span><input type="color" value={draft?.brand?.[key] || "#1737d1"} onChange={(event) => updateBrand(key, event.target.value)}/></label>)}</div><div className="stu-field-grid"><label><span>Font</span><select value={draft?.brand.fontFamily || "Inter"} onChange={(event) => updateBrand("fontFamily", event.target.value as StudioV6Draft["brand"]["fontFamily"])}><option>Inter</option><option>Manrope</option><option>Poppins</option><option>DM Sans</option></select></label><label><span>Corner radius</span><input type="range" min="0" max="40" value={draft?.brand.radius ?? 22} onChange={(event) => updateBrand("radius", Number(event.target.value))}/></label><label><span>Buttons</span><select value={draft?.brand.buttonStyle || "soft"} onChange={(event) => updateBrand("buttonStyle", event.target.value as StudioV6Draft["brand"]["buttonStyle"])}><option value="soft">Soft</option><option value="pill">Pill</option><option value="square">Square</option></select></label><label><span>Cards</span><select value={draft?.brand.cardStyle || "elevated"} onChange={(event) => updateBrand("cardStyle", event.target.value as StudioV6Draft["brand"]["cardStyle"])}><option value="bordered">Bordered</option><option value="elevated">Elevated</option><option value="glass">Glass</option></select></label><label><span>Navigation</span><select value={draft?.brand.navStyle || "clean"} onChange={(event) => updateBrand("navStyle", event.target.value as StudioV6Draft["brand"]["navStyle"])}><option value="clean">Clean</option><option value="glass">Glass</option><option value="dark">Dark</option></select></label><label><span>Hero</span><select value={draft?.brand.heroStyle || "split"} onChange={(event) => updateBrand("heroStyle", event.target.value as StudioV6Draft["brand"]["heroStyle"])}><option value="split">Split</option><option value="centered">Centered</option><option value="minimal">Minimal</option></select></label></div><button onClick={() => openPanel("Brand kits")}>Open full brand system</button></section> : null}

        {inspectorTab === "layout" && selectedSection ? <section><h4><LayoutPanelTop size={15}/> Section layout</h4><div className="stu-segmented"><button className={selectedSection.style?.align === "left" ? "active" : ""} onClick={() => updateSection((section) => { section.style.align = "left"; }, "Section aligned left.")} aria-label="Align left"><AlignLeft/></button><button className={selectedSection.style?.align === "center" ? "active" : ""} onClick={() => updateSection((section) => { section.style.align = "center"; }, "Section aligned centre.")} aria-label="Align centre"><AlignCenter/></button><button className={selectedSection.style?.align === "right" ? "active" : ""} onClick={() => updateSection((section) => { section.style.align = "right"; }, "Section aligned right.")} aria-label="Align right"><AlignRight/></button></div><div className="stu-field-grid"><label><span>Background</span><input type="color" value={String(selectedSection.style?.background || draft?.brand.surface || "#ffffff")} onChange={(event) => updateSection((section) => { section.style.background = event.target.value; }, "Section background updated.")}/></label><label><span>Width</span><select value={String(selectedSection.style?.width || "contained")} onChange={(event) => updateSection((section) => { section.style.width = event.target.value; }, "Section width updated.")}><option value="contained">Contained</option><option value="full">Full width</option></select></label><label><span>Top spacing</span><input type="range" min="0" max="180" step="4" value={Number(selectedSection.style?.paddingTop ?? 72)} onChange={(event) => updateSection((section) => { section.style.paddingTop = Number(event.target.value); }, "Section spacing updated.")}/></label><label><span>Bottom spacing</span><input type="range" min="0" max="180" step="4" value={Number(selectedSection.style?.paddingBottom ?? 72)} onChange={(event) => updateSection((section) => { section.style.paddingBottom = Number(event.target.value); }, "Section spacing updated.")}/></label></div></section> : inspectorTab === "layout" ? <section className="stu-context-help"><LayoutPanelTop size={15}/><span>This template block could not be mapped to a structural section. Use the full Visual editor for section-level structure.</span></section> : null}

        {inspectorTab === "responsive" && selectedSection && responsive ? <section><h4><Smartphone size={15}/> Responsive behaviour</h4><div className="stu-device-tabs">{(["desktop", "tablet", "mobile"] as StudioV6Device[]).map((device) => <button key={device} className={styleDevice === device ? "active" : ""} onClick={() => setStyleDevice(device)}>{device}</button>)}</div><div className="stu-field-grid"><label><span>Columns</span><input type="range" min="1" max="4" value={responsive.columns} onChange={(event) => updateSection((section) => { section.responsive[styleDevice].columns = Number(event.target.value); }, `${styleDevice} columns updated.`)}/><small>{responsive.columns}</small></label><label><span>Font scale</span><input type="range" min="0.7" max="1.4" step="0.02" value={responsive.fontScale} onChange={(event) => updateSection((section) => { section.responsive[styleDevice].fontScale = Number(event.target.value); }, `${styleDevice} typography updated.`)}/><small>{responsive.fontScale.toFixed(2)}×</small></label><label><span>Spacing scale</span><input type="range" min="0.4" max="1.5" step="0.05" value={responsive.spacingScale} onChange={(event) => updateSection((section) => { section.responsive[styleDevice].spacingScale = Number(event.target.value); }, `${styleDevice} spacing updated.`)}/><small>{responsive.spacingScale.toFixed(2)}×</small></label><label><span>Image fit</span><select value={responsive.imageFit || "cover"} onChange={(event) => updateSection((section) => { section.responsive[styleDevice].imageFit = event.target.value as "cover" | "contain"; }, `${styleDevice} image fit updated.`)}><option value="cover">Cover</option><option value="contain">Contain</option></select></label></div><button className={responsive.hidden ? "stu-visibility hidden" : "stu-visibility"} onClick={() => updateSection((section) => { section.responsive[styleDevice].hidden = !section.responsive[styleDevice].hidden; }, responsive.hidden ? `Section shown on ${styleDevice}.` : `Section hidden on ${styleDevice}.`)}>{responsive.hidden ? <><Eye/> Show on {styleDevice}</> : <><EyeOff/> Hide on {styleDevice}</>}</button></section> : inspectorTab === "responsive" ? <section className="stu-context-help"><Smartphone size={15}/><span>Select a mapped section to control its mobile, tablet and desktop behaviour.</span></section> : null}

        <section className="stu-context-help"><RefreshCw size={15}/><span>{notice}</span></section>
      </aside>
    </div> : null}
  </>;
}
