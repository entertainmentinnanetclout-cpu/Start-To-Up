import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "../../components/app-shell";
import { supabase } from "../../integrations/supabase/client";
import { normalizeWebsiteDraft } from "../../lib/website-studio";
import { renderStudioHtml } from "../../lib/website-studio-render";
import { ensureStudioV6Draft, type StudioV6Draft } from "../../lib/website-studio-v6";
import { saveStudioV6Settings } from "../../lib/website-studio-v6-data";
import { saveWebsiteStudioProject } from "../../lib/website-studio-data";
import { uploadWebsiteStudioAsset, websiteStudioAssetErrorMessage, type WebsiteStudioAssetSlot } from "../../lib/website-studio-assets";
import { websiteStudioIntegrationGuides, type StudioIntegrationGuide, type StudioIntegrationProvider } from "../../lib/website-studio-integration-guides";
import { providerConnectionStatus, removeProviderConnection, saveProviderConnection, testProviderConnection, type ProviderConnectionState } from "../../lib/website-studio-provider-connections";
import { canExtractStudio, getStudioAccessState, requestStudioAccess, requestTemplateEntitlement, type StudioAccessState } from "../../lib/website-studio-access";
import "../../website-studio-v6-pro.css";
import "../../website-studio-visual-contracts.css";

export const Route = createFileRoute("/app/website-studio-v6-pro")({ component: WebsiteStudioV6ProPage });

type Workspace = "visual" | "pages" | "integrations" | "project";
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
function clean(value: string) { return value.trim().replace(/\s+/g, " "); }
function sameMedia(a: string, b: string) { if (!a || !b) return false; try { return new URL(a, location.href).href === new URL(b, location.href).href; } catch { return a === b; } }

function WebsiteStudioV6ProPage() {
  const [draft, setDraft] = useState<StudioV6Draft>(() => restoreDraft());
  const [workspace, setWorkspace] = useState<Workspace>("visual");
  const [collapsed, setCollapsed] = useState(() => typeof window !== "undefined" && localStorage.getItem(SIDEBAR_KEY) === "1");
  const [access, setAccess] = useState<StudioAccessState>({ signedIn:false, approved:false, status:"anonymous", isStaff:false });
  const [notice, setNotice] = useState("Double-click or double-tap any logo, image or editable text in the preview.");
  const [target, setTarget] = useState<ToolTarget | null>(null);
  const [busy, setBusy] = useState("");
  const [provider, setProvider] = useState<StudioIntegrationProvider>("vercel");
  const [providerForm, setProviderForm] = useState<IntegrationFormState>({});
  const [providerState, setProviderState] = useState<ProviderConnectionState | null>(null);
  const [extractState, setExtractState] = useState({ export:false, publish:false });
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const touchRef = useRef<{ at: number; element: Element | null }>({ at: 0, element: null });
  const previewHtml = useMemo(() => renderStudioHtml(draft), [draft]);
  const guide = websiteStudioIntegrationGuides.find((item) => item.provider === provider)!;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      window.dispatchEvent(new CustomEvent("stu-studio-draft-updated", { detail: draft }));
    }, 100);
    return () => window.clearTimeout(timer);
  }, [draft]);
  useEffect(() => { localStorage.setItem(SIDEBAR_KEY, collapsed ? "1" : "0"); }, [collapsed]);
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      const state = await getStudioAccessState().catch(() => ({ signedIn:false,approved:false,status:"anonymous",isStaff:false } as StudioAccessState));
      if (!active) return;
      setAccess(state);
      if (state.signedIn) {
        const [canExport, canPublish] = await Promise.all([canExtractStudio(String(draft.templateKey),"export"),canExtractStudio(String(draft.templateKey),"publish")]);
        if (active) setExtractState({export:canExport,publish:canPublish});
      }
    };
    void refresh();
    const { data } = supabase.auth.onAuthStateChange(() => void refresh());
    return () => { active = false; data.subscription.unsubscribe(); };
  }, [draft.templateKey]);
  useEffect(() => { if (draft.id && access.approved) void loadProvider(provider, draft.id); else setProviderState(null); }, [provider, draft.id, access.approved]);

  function change(mutator: (next: StudioV6Draft) => void) { setDraft((current) => { const next = clone(current); mutator(next); return ensureStudioV6Draft(next); }); }
  function goPage(slug: string) { change((next) => { next.studioV6.activePageSlug = slug; }); setTarget(null); setNotice(`Previewing ${draft.studioV6.pages.find((p)=>p.slug===slug)?.title || "page"}.`); }

  async function ensureProject() {
    if (!access.signedIn) throw new Error("SIGN_IN_REQUIRED");
    if (!access.approved) throw new Error("APPROVAL_REQUIRED");
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
      if (image.closest(".vc-logo,.ent-logo") || sameMedia(src, draft.brand.logoUrl)) return { kind:"image",binding:"logo",label:"Logo",current:draft.brand.logoUrl || src };
      if (/hero|banner|feature|mascot/i.test(String(image.closest("[class]")?.className || "")) || sameMedia(src,draft.site.heroImageUrl)) return { kind:"image",binding:"hero",label:"Hero / banner image",current:draft.site.heroImageUrl || src };
      const index = draft.site.gallery.findIndex((url) => sameMedia(url, src));
      return { kind:"image",binding:"gallery",galleryIndex:index >= 0 ? index : undefined,label:index >= 0 ? `Website image ${index + 1}` : "Website graphic",current:src };
    }
    const value = clean(element.textContent || "");
    if (!value || value.length > 1000) return null;
    const fixed: Array<[string,string,string]> = [["businessName","Business name",draft.businessName],["brand.logoText","Logo text",draft.brand.logoText],["site.headline","Headline",draft.site.headline],["site.tagline","Tagline",draft.site.tagline],["site.description","Description",draft.site.description],["site.primaryCta","Primary button",draft.site.primaryCta],["site.secondaryCta","Secondary button",draft.site.secondaryCta]];
    for (const [binding,label,current] of fixed) if (clean(current) === value) return { kind:"text",binding,label,current };
    const lists: Array<["services"|"highlights"|"process"|"testimonials",string]> = [["services","Service"],["highlights","Highlight"],["process","Process step"],["testimonials","Testimonial"]];
    for (const [key,label] of lists) { const index=draft.site[key].findIndex((item)=>clean(String(item))===value); if(index>=0)return {kind:"text",binding:`site.${key}.${index}`,label:`${label} ${index+1}`,current:String(draft.site[key][index])}; }
    return null;
  }

  function openTools(element: Element) {
    const selection = classifyElement(element);
    if (!selection) return setNotice("That item is structural. Select a logo, graphic or editable text value.");
    setTarget(selection); setWorkspace("visual"); setNotice(`${selection.label} selected. The tools drawer is ready.`);
  }

  function bindPreviewInteractions() {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    doc.documentElement.style.cursor = "default";
    const blockNavigation = (event: Event) => {
      const element = event.target instanceof Element ? event.target : null;
      const anchor = element?.closest("a") as HTMLAnchorElement | null;
      const button = element?.closest("button");
      if (!anchor && !button) return;
      event.preventDefault(); event.stopPropagation();
      const page = anchor?.dataset.studioPage;
      if (page) goPage(page);
    };
    const blockSubmit = (event: Event) => { event.preventDefault(); event.stopPropagation(); setNotice("Forms are disabled inside edit preview. They remain functional on the deployed website."); };
    doc.addEventListener("click", blockNavigation, true);
    doc.addEventListener("submit", blockSubmit, true);
    const editable = "img,h1,h2,h3,h4,p,a,button,strong,span,blockquote,small,em";
    doc.querySelectorAll(editable).forEach((node) => {
      const el = node as HTMLElement; el.style.cursor = "pointer";
      el.addEventListener("dblclick", (event) => { event.preventDefault(); event.stopPropagation(); openTools(event.currentTarget as Element); });
      el.addEventListener("touchend", (event) => {
        const now=Date.now(); const current=event.currentTarget as Element;
        if(touchRef.current.element===current && now-touchRef.current.at<380){event.preventDefault();event.stopPropagation();openTools(current);touchRef.current={at:0,element:null};}
        else touchRef.current={at:now,element:current};
      }, { passive:false });
    });
  }

  function updateText(binding: string, value: string) {
    change((next) => {
      if(binding==="businessName"){next.businessName=value;return;} if(binding==="brand.logoText"){next.brand.logoText=value;return;}
      const simple=binding.match(/^site\.(headline|tagline|description|primaryCta|secondaryCta)$/); if(simple){(next.site as any)[simple[1]]=value;return;}
      const list=binding.match(/^site\.(services|highlights|process|testimonials)\.(\d+)$/); if(list){const values=[...(next.site as any)[list[1]]];values[Number(list[2])]=value;(next.site as any)[list[1]]=values;}
    });
    setTarget((current)=>current?.kind==="text"?{...current,current:value}:current);
  }

  function applyImage(url: string, selection: Extract<ToolTarget,{kind:"image"}>) {
    change((next)=>{if(selection.binding==="logo")next.brand.logoUrl=url;else if(selection.binding==="hero")next.site.heroImageUrl=url;else{const gallery=[...next.site.gallery];if(selection.galleryIndex!=null&&selection.galleryIndex>=0)gallery[selection.galleryIndex]=url;else gallery.push(url);next.site.gallery=gallery;next.site.showGallery=true;}});
    setTarget({...selection,current:url});
  }

  async function replaceImage(file?: File) {
    if(!file || target?.kind!=="image") return;
    if(!access.signedIn){setNotice("Sign in before uploading any website image or logo.");return;}
    if(!access.approved){setNotice("Your account needs Website Studio approval before cloud uploads are enabled.");return;}
    setBusy("image");
    try{
      const slot:WebsiteStudioAssetSlot=target.binding==="logo"?"logo":target.binding==="hero"?"hero":"gallery";
      const asset=await uploadWebsiteStudioAsset(file,slot,draft.id,{altText:`${draft.businessName} ${target.label}`,source:"contextual-editor"});
      applyImage(asset.publicUrl,target); setNotice(`${target.label} replaced and saved to your signed-in media library.`);
    }catch(error){setNotice(websiteStudioAssetErrorMessage(error));}finally{setBusy("");}
  }
  function removeImage(){if(target?.kind!=="image")return;applyImage("",target);setNotice(`${target.label} removed from this draft.`);}

  async function saveConnection(andTest=false){
    if(!access.approved){setNotice("Website Studio approval is required before connecting external providers.");return;}
    setBusy("provider");
    try{const project=await ensureProject();const config:Record<string,unknown>={};let secret="";for(const field of guide.fields){const value=providerForm[field.key]||"";if(field.secret)secret=value;else config[field.key]=value;}await saveProviderConnection(project.id!,provider,config,secret);const state=andTest?await testProviderConnection(project.id!,provider,config,secret):await providerConnectionStatus(project.id!,provider);setProviderState(andTest?{provider,hasCredential:Boolean(secret)||Boolean(providerState?.hasCredential),credentialHint:providerState?.credentialHint,status:state.status,config,lastError:null}:state);setProviderForm((current)=>{const next={...current};for(const field of guide.fields)if(field.secret)next[field.key]="";return next;});setNotice(andTest?`${guide.name} connection test completed: ${state.status}.`:`${guide.name} setup saved securely.`);}catch{setNotice(`${guide.name} could not be connected. Follow the three setup steps and check the required values.`);}finally{setBusy("");}
  }

  const activePage = draft.studioV6.pages.find((page)=>page.slug===draft.studioV6.activePageSlug) || draft.studioV6.pages[0];
  return <AppShell title="Website Studio" eyebrow="V6 PRO · ONE SHARED SOURCE · SAFE VISUAL PREVIEW" action={<Link to="/app/website-studio-v6" className="button button-secondary">All advanced tools</Link>}>
    <section className="v6pro-status"><span>{notice}</span><div>{access.approved?<b>Approved session</b>:access.signedIn?<b>Account: {access.status}</b>:<Link to={`/auth?returnTo=${encodeURIComponent("/app/website-studio-v6-pro")}`}>Sign in →</Link>}</div></section>
    {!access.approved ? <section className="v6pro-access-banner"><div><strong>{access.signedIn?"Website Studio approval required":"Sign in to save and upload"}</strong><p>Previewing and text customisation can continue locally. Uploads, managed saves, integrations, source export and publishing are controlled services.</p></div>{access.signedIn?<button className="button button-primary" onClick={async()=>{try{await requestStudioAccess("Request access to Website Studio editing, uploads and managed publishing");setNotice("Access request submitted. An administrator can approve it from the Studio Control dashboard.");}catch{setNotice("Your access request could not be submitted yet.");}}}>Request approval</button>:<Link className="button button-primary" to={`/auth?returnTo=${encodeURIComponent("/app/website-studio-v6-pro")}`}>Create account / sign in</Link>}</section> : null}
    <div className={`v6pro-layout ${collapsed?"sidebar-collapsed":""}`}>
      <aside className="v6pro-sidebar"><button className="v6pro-collapse" type="button" onClick={()=>setCollapsed((value)=>!value)} aria-label={collapsed?"Expand Website Studio sidebar":"Collapse Website Studio sidebar"}>{collapsed?"›":"‹"}</button><div className="v6pro-sidebar-scroll"><div className="v6pro-sidebar-brand"><strong>Website Studio</strong><span>PRO BUILDER</span></div><button className={workspace==="visual"?"active":""} onClick={()=>setWorkspace("visual")}><i>01</i><span>Visual tools</span></button><button className={workspace==="pages"?"active":""} onClick={()=>setWorkspace("pages")}><i>02</i><span>Pages & preview</span></button><button className={workspace==="integrations"?"active":""} onClick={()=>setWorkspace("integrations")}><i>03</i><span>Integrations</span></button><button className={workspace==="project"?"active":""} onClick={()=>setWorkspace("project")}><i>04</i><span>Project & access</span></button><div className="v6pro-sidebar-divider"/><Link to="/app/website-studio-v6"><i>20</i><span>All 20 capabilities</span></Link><Link to="/app/website-studio-templates"><i>↗</i><span>Template library</span></Link></div></aside>

      <main className="v6pro-main">
        {workspace==="visual"?<section className="v6pro-workspace"><header><div><span>DIRECT VISUAL EDITING</span><h2>Double-click desktop · double-tap mobile</h2><p>The preview is navigation-locked while editing, so it can never load Start To Up inside itself. Page links switch the preview source instead.</p></div></header><div className="v6pro-page-strip">{draft.studioV6.pages.filter((p)=>p.visible).map((page)=><button key={page.id} className={page.slug===activePage?.slug?"active":""} onClick={()=>goPage(page.slug)}>{page.title}</button>)}</div><div className="v6pro-preview-frame"><iframe ref={iframeRef} title="Interactive exact template preview" srcDoc={previewHtml} sandbox="allow-same-origin" onLoad={bindPreviewInteractions}/></div></section>:null}

        {workspace==="pages"?<section className="v6pro-workspace"><header><div><span>MULTI-PAGE WEBSITE</span><h2>Every page is independently previewable.</h2><p>All pages use the same draft, brand, media library and template source. Changing shared branding updates every page.</p></div></header><div className="v6pro-pages-grid">{draft.studioV6.pages.sort((a,b)=>a.order-b.order).map((page)=><article key={page.id} className={page.slug===activePage?.slug?"active":""}><div><strong>{page.title}</strong><span>{page.slug==="/"?"/":`/${page.slug}`}</span><small>{page.sections.length} sections</small></div><button className="button button-secondary" onClick={()=>{goPage(page.slug);setWorkspace("visual")}}>Open preview</button></article>)}</div></section>:null}

        {workspace==="integrations"?<section className="v6pro-workspace integrations"><header><div><span>NO API EXPERIENCE REQUIRED</span><h2>Connect services in three steps.</h2><p>Each connector links to official setup instructions. Credentials are kept server-side and are never embedded in exported websites.</p></div></header><div className="v6pro-integration-layout"><nav className="v6pro-provider-list">{websiteStudioIntegrationGuides.map((item)=><button key={item.provider} className={provider===item.provider?"active":""} onClick={()=>setProvider(item.provider)}><strong>{item.name}</strong><span>{item.purpose}</span></button>)}</nav><IntegrationSetup guide={guide} values={providerForm} setValues={setProviderForm} state={providerState} busy={busy==="provider"} disabled={!access.approved} onSave={()=>void saveConnection(false)} onTest={()=>void saveConnection(true)} onRemove={async()=>{if(!draft.id||!access.approved)return;setBusy("provider");try{await removeProviderConnection(draft.id,provider);await loadProvider(provider,draft.id);setNotice(`${guide.name} disconnected.`);}finally{setBusy("");}}}/></div></section>:null}

        {workspace==="project"?<section className="v6pro-workspace"><header><div><span>PROJECT & COMMERCIAL ACCESS</span><h2>Preview freely. Extraction is controlled.</h2><p>Admin approval controls managed editing. Template entitlement controls source ZIP and publishing for paid templates.</p></div></header><div className="v6pro-project-grid"><article><strong>{draft.businessName}</strong><span>{draft.studioV6.pages.length} pages</span></article><article><strong>{String(draft.templateKey)}</strong><span>Template</span></article><article><strong>{access.approved?"Approved":access.status}</strong><span>Builder access</span></article><article><strong>{extractState.export?"Granted":"Locked"}</strong><span>Source export</span></article><article><strong>{extractState.publish?"Granted":"Locked"}</strong><span>GitHub / Vercel publish</span></article></div><div className="v6pro-actions"><button className="button button-primary" disabled={busy==="save"||!access.approved} onClick={async()=>{setBusy("save");try{await ensureProject();setNotice("Website project and V6 settings saved from the shared source.");}catch{setNotice("Approved access is required for managed saves. The local preview remains intact.");}finally{setBusy("");}}}>Save project</button>{!extractState.export&&access.approved?<button className="button button-secondary" onClick={async()=>{try{await requestTemplateEntitlement(String(draft.templateKey),"export",draft.id,"Request source-code export access");setNotice("Export entitlement requested. Admin can approve it from Studio Control.");}catch{setNotice("Could not submit export request yet.");}}}>Request source export</button>:null}<Link className="button button-secondary" to="/app/website-studio-v6">Open advanced editor / export</Link></div></section>:null}
      </main>

      {workspace==="visual"?<aside className={`v6pro-tools ${target?"open":""}`}>
        {!target?<div className="v6pro-empty-tools"><strong>Brand & contextual tools</strong><p>Double-click or double-tap a logo, image or text item.</p><div className="v6pro-color-tools"><strong>Global brand colours</strong>{(["primary","secondary","accent","surface","text"] as const).map((key)=><label key={key}><span>{key}</span><input type="color" value={draft.brand[key]} onChange={(event)=>change((next)=>{next.brand[key]=event.target.value;})}/></label>)}</div><label className={`v6pro-upload ${!access.approved?"disabled":""}`}>Replace global logo<input type="file" disabled={!access.approved} accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={(event)=>{const current:ToolTarget={kind:"image",binding:"logo",label:"Logo",current:draft.brand.logoUrl};setTarget(current);window.setTimeout(()=>void replaceImage(event.target.files?.[0]),0);}}/></label><small>{access.approved?"Uploads are stored under your signed-in profile.":"Sign in and get approval to upload brand assets."}</small></div>:<><header><div><span>SELECTED</span><h3>{target.label}</h3></div><button onClick={()=>setTarget(null)}>×</button></header>{target.kind==="image"?<div className="v6pro-tool-content">{target.current?<img src={target.current} alt="Selected website asset"/>:<div className="v6pro-selected-placeholder">No image set</div>}<label className={`v6pro-upload ${!access.approved?"disabled":""}`}>Replace {target.binding==="logo"?"logo":target.binding==="hero"?"banner / hero":"image"}<input type="file" disabled={!access.approved} accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={(event)=>void replaceImage(event.target.files?.[0])}/></label><button onClick={removeImage}>Remove image</button><small>{busy==="image"?"Uploading…":access.approved?"Saved to your profile media library.":"Approval required before uploading."}</small></div>:null}{target.kind==="text"?<div className="v6pro-tool-content"><label>{target.label}<textarea rows={target.current.length>80?6:3} value={target.current} onChange={(event)=>updateText(target.binding,event.target.value)}/></label><small>Shared text updates immediately in the preview and is reused by export/publishing.</small></div>:null}<div className="v6pro-color-tools"><strong>Global colours</strong>{(["primary","secondary","accent","surface","text"] as const).map((key)=><label key={key}><span>{key}</span><input type="color" value={draft.brand[key]} onChange={(event)=>change((next)=>{next.brand[key]=event.target.value;})}/></label>)}</div></>}
      </aside>:null}
    </div>
  </AppShell>;
}

function IntegrationSetup({guide,values,setValues,state,busy,disabled,onSave,onTest,onRemove}:{guide:StudioIntegrationGuide;values:IntegrationFormState;setValues:React.Dispatch<React.SetStateAction<IntegrationFormState>>;state:ProviderConnectionState|null;busy:boolean;disabled:boolean;onSave:()=>void;onTest:()=>void;onRemove:()=>void}){
  return <section className="v6pro-integration-card"><header><div><span>{guide.credentialKind.toUpperCase()}</span><h3>{guide.name}</h3><p>{guide.purpose}</p></div><b className={`status ${state?.status||"disconnected"}`}>{state?.status||"not connected"}</b></header><div className="v6pro-steps">{guide.steps.map((step,index)=><article key={step.title}><b>{index+1}</b><div><strong>{step.title}</strong><p>{step.detail}</p>{step.url?<a href={step.url} target="_blank" rel="noreferrer">Open official setup ↗</a>:null}</div></article>)}</div><div className="v6pro-fields">{guide.fields.map((field)=><label key={field.key}><span>{field.label}</span><input disabled={disabled} type={field.secret?"password":"text"} autoComplete="off" value={values[field.key]||""} placeholder={field.secret&&state?.hasCredential?state.credentialHint||"Saved securely — enter only to replace":field.placeholder} onChange={(event)=>setValues((current)=>({...current,[field.key]:event.target.value}))}/>{field.help?<small>{field.help}</small>:null}</label>)}</div><div className="v6pro-integration-actions"><button className="button button-primary" disabled={busy||disabled} onClick={onTest}>{busy?"Checking…":"Save & test connection"}</button><button className="button button-secondary" disabled={busy||disabled} onClick={onSave}>Save setup</button>{state?.status&&state.status!=="disconnected"?<button className="danger" disabled={disabled} onClick={onRemove}>Disconnect</button>:null}</div>{disabled?<p className="v6pro-gate-note">Admin approval is required before provider credentials can be saved.</p>:null}<footer><a href={guide.officialUrl} target="_blank" rel="noreferrer">Provider setup ↗</a><a href={guide.docsUrl} target="_blank" rel="noreferrer">Official documentation ↗</a></footer></section>;
}
