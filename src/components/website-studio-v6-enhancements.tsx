import { useEffect, useRef, useState } from "react";
import { Image as ImageIcon, Palette, PlugZap, RefreshCw, Type, Upload, X } from "lucide-react";
import { uploadWebsiteStudioAsset, websiteStudioAssetErrorMessage, type WebsiteStudioAssetSlot } from "../lib/website-studio-assets";
import type { StudioV6Draft } from "../lib/website-studio-v6";
import { WebsiteStudioProviderSetup } from "./website-studio-provider-setup";

type ContextTarget = {
  kind: "image" | "text" | "button" | "section";
  text: string;
  src: string;
  className: string;
  tagName: string;
};

const DRAFT_KEY = "start-to-up-website-studio-draft";
function readDraft(): StudioV6Draft | null {
  try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || "null") as StudioV6Draft | null; } catch { return null; }
}
function writeDraft(draft: StudioV6Draft) { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); }
function normalizeSrc(value: string) { try { return new URL(value, location.href).href; } catch { return value; } }

function patchText(draft: StudioV6Draft, previous: string, nextText: string) {
  if (!previous || previous === nextText) return;
  const site = draft.site;
  const scalarSiteKeys = ["headline", "tagline", "description", "primaryCta", "secondaryCta", "announcement", "location"] as const;
  for (const key of scalarSiteKeys) if (String(site[key]) === previous) site[key] = nextText as never;
  if (draft.brand.logoText === previous) draft.brand.logoText = nextText;
  const listKeys = ["services", "highlights", "process", "testimonials"] as const;
  for (const key of listKeys) site[key] = site[key].map((value) => value === previous ? nextText : value) as never;
  for (const page of draft.studioV6?.pages || []) {
    if (page.title === previous) page.title = nextText;
    for (const section of page.sections || []) {
      if (section.title === previous) section.title = nextText;
      for (const [key, value] of Object.entries(section.content || {})) {
        if (value === previous) section.content[key] = nextText;
        if (Array.isArray(value)) section.content[key] = value.map((item) => item === previous ? nextText : item);
      }
    }
  }
}

function resolveImageSlot(draft: StudioV6Draft, target: ContextTarget): { slot: WebsiteStudioAssetSlot; target: "logo" | "favicon" | "hero" | "gallery"; galleryIndex?: number } {
  const source = normalizeSrc(target.src);
  const className = target.className.toLowerCase();
  if (draft.brand.logoUrl && normalizeSrc(draft.brand.logoUrl) === source || /logo|brand/.test(className)) return { slot: "logo", target: "logo" };
  if (draft.brand.faviconUrl && normalizeSrc(draft.brand.faviconUrl) === source || /favicon/.test(className)) return { slot: "favicon", target: "favicon" };
  if (draft.site.heroImageUrl && normalizeSrc(draft.site.heroImageUrl) === source || /hero|lead|feature/.test(className)) return { slot: "hero", target: "hero" };
  const index = draft.site.gallery.findIndex((url) => normalizeSrc(url) === source);
  if (index >= 0) return { slot: "gallery", target: "gallery", galleryIndex: index };
  return { slot: "gallery", target: "gallery", galleryIndex: 0 };
}

export function WebsiteStudioV6Enhancements() {
  const [target, setTarget] = useState<ContextTarget | null>(null);
  const [text, setText] = useState("");
  const [providerOpen, setProviderOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("Double-click or double-tap an item in Exact preview to edit it.");
  const attached = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    const exactButton = Array.from(document.querySelectorAll<HTMLButtonElement>(".v6-preview header button")).find((button) => button.textContent?.trim().toLowerCase() === "exact preview");
    exactButton?.click();
  }, []);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    const timer = window.setInterval(() => {
      const frame = document.querySelector<HTMLIFrameElement>('.v6-preview iframe[title="Exact site preview"]');
      if (!frame || frame === attached.current) return;
      cleanup?.();
      attached.current = frame;
      const wire = () => {
        const doc = frame.contentDocument;
        if (!doc) return;
        let lastTarget: EventTarget | null = null;
        let lastTap = 0;
        const open = (raw: EventTarget | null) => {
          const element = raw instanceof Element ? raw : null;
          if (!element) return;
          const editable = element.closest("img,a,button,h1,h2,h3,h4,p,span,strong,section,header,aside,article") as HTMLElement | null;
          if (!editable) return;
          const image = editable.tagName === "IMG" ? editable as HTMLImageElement : editable.querySelector("img");
          const tag = editable.tagName.toLowerCase();
          const kind: ContextTarget["kind"] = image ? "image" : ["a","button"].includes(tag) ? "button" : ["section","header","aside","article"].includes(tag) ? "section" : "text";
          const context: ContextTarget = { kind, text: (editable.textContent || "").trim().slice(0, 1200), src: image?.src || "", className: `${editable.className || ""} ${image?.className || ""}`, tagName: tag };
          setTarget(context); setText(context.text); setNotice(kind === "image" ? "Image tools opened." : "Text and style tools opened.");
        };
        const dbl = (event: MouseEvent) => { event.preventDefault(); event.stopPropagation(); open(event.target); };
        const tap = (event: PointerEvent) => {
          const now = Date.now();
          if (event.target === lastTarget && now - lastTap < 360) { event.preventDefault(); open(event.target); lastTap = 0; lastTarget = null; return; }
          lastTarget = event.target; lastTap = now;
        };
        doc.addEventListener("dblclick", dbl, true); doc.addEventListener("pointerup", tap, true);
        cleanup = () => { doc.removeEventListener("dblclick", dbl, true); doc.removeEventListener("pointerup", tap, true); };
      };
      frame.addEventListener("load", wire); wire();
      const priorCleanup = cleanup;
      cleanup = () => { frame.removeEventListener("load", wire); priorCleanup?.(); };
    }, 400);
    return () => { window.clearInterval(timer); cleanup?.(); };
  }, []);

  function commit(mutator: (draft: StudioV6Draft) => void, message: string) {
    const draft = readDraft(); if (!draft) return;
    mutator(draft); writeDraft(draft); setNotice(message);
    window.setTimeout(() => window.location.reload(), 90);
  }

  function updateText() {
    if (!target) return;
    commit((draft) => patchText(draft, target.text, text.trim()), "Text updated. Reloading the exact template with the saved change…");
  }

  function updateColor(key: "primary" | "secondary" | "accent" | "surface" | "text", value: string) {
    commit((draft) => { draft.brand[key] = value; }, "Brand colour updated across the template.");
  }

  async function replaceImage(file: File | undefined, forced?: "logo" | "hero" | "gallery") {
    if (!file || !target) return;
    const draft = readDraft(); if (!draft) return;
    const resolved = resolveImageSlot(draft, target);
    const selected = forced === "logo" ? { slot: "logo" as const, target: "logo" as const } : forced === "hero" ? { slot: "hero" as const, target: "hero" as const } : forced === "gallery" ? { slot: "gallery" as const, target: "gallery" as const, galleryIndex: resolved.galleryIndex } : resolved;
    setBusy(true);
    try {
      const asset = await uploadWebsiteStudioAsset(file, selected.slot, draft.id, { altText: `${draft.businessName} ${selected.target}`, source: "context-tools" });
      if (selected.target === "logo") draft.brand.logoUrl = asset.publicUrl;
      else if (selected.target === "favicon") draft.brand.faviconUrl = asset.publicUrl;
      else if (selected.target === "hero") draft.site.heroImageUrl = asset.publicUrl;
      else {
        const index = selected.galleryIndex ?? -1;
        if (index >= 0 && index < draft.site.gallery.length) draft.site.gallery[index] = asset.publicUrl;
        else draft.site.gallery.push(asset.publicUrl);
        draft.site.showGallery = true;
      }
      writeDraft(draft); setNotice("Replacement uploaded and saved. Reloading the exact template…");
      window.setTimeout(() => window.location.reload(), 120);
    } catch (error) { setNotice(websiteStudioAssetErrorMessage(error)); } finally { setBusy(false); }
  }

  function openPanel(label: string) {
    const button = Array.from(document.querySelectorAll<HTMLButtonElement>(".v6-nav button")).find((item) => item.textContent?.trim().toLowerCase() === label.toLowerCase());
    button?.click(); setTarget(null);
  }

  const draft = typeof window !== "undefined" ? readDraft() : null;
  return <>
    <button className="stu-integrations-fab" onClick={() => setProviderOpen(true)}><PlugZap size={17}/> Integrations</button>
    <WebsiteStudioProviderSetup open={providerOpen} onClose={() => setProviderOpen(false)}/>
    {target ? <div className="stu-context-layer">
      <button className="stu-context-backdrop" onClick={() => setTarget(null)} aria-label="Close tools"/>
      <aside className="stu-context-drawer" role="dialog" aria-label="Visual editing tools">
        <header><div><span>VISUAL TOOLS</span><h3>{target.kind === "image" ? "Image / graphic" : target.kind === "button" ? "Button / link" : target.kind === "section" ? "Section / banner" : "Text"}</h3><p>Changes apply to the real Website Studio draft and remain in ZIP/GitHub/Vercel output.</p></div><button onClick={() => setTarget(null)}><X/></button></header>
        {target.kind === "image" ? <section><h4><ImageIcon size={15}/> Replace graphic</h4><label className="stu-upload-action"><Upload size={15}/>{busy ? "Uploading…" : "Replace this image"}<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" disabled={busy} onChange={(event) => void replaceImage(event.target.files?.[0])}/></label><div className="stu-context-actions"><label>Use replacement as logo<input type="file" accept="image/*" onChange={(event) => void replaceImage(event.target.files?.[0], "logo")}/></label><label>Use replacement as hero/banner<input type="file" accept="image/*" onChange={(event) => void replaceImage(event.target.files?.[0], "hero")}/></label><button onClick={() => openPanel("Image editor")}>Advanced crop & image tools</button></div><small>{target.src ? `Current: ${target.src.split("/").pop()?.slice(0, 70)}` : "Template image"}</small></section> : null}
        {target.kind !== "image" && target.text ? <section><h4><Type size={15}/> Edit text</h4><textarea rows={6} value={text} onChange={(event) => setText(event.target.value)}/><button className="primary" onClick={updateText}>Apply text</button></section> : null}
        <section><h4><Palette size={15}/> Brand colours</h4><div className="stu-color-grid">{(["primary","secondary","accent","surface","text"] as const).map((key) => <label key={key}><span>{key}</span><input type="color" value={draft?.brand?.[key] || "#1737d1"} onChange={(event) => updateColor(key, event.target.value)}/></label>)}</div><button onClick={() => openPanel("Brand kits")}>Open full brand system</button></section>
        <section className="stu-context-help"><RefreshCw size={15}/><span>{notice}</span></section>
      </aside>
    </div> : null}
  </>;
}
