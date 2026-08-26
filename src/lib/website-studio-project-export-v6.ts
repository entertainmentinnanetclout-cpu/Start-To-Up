import { normalizeWebsiteDraft, type WebsiteStudioDraft } from "./website-studio";
import { ensureStudioV6Draft, type StudioV6Draft } from "./website-studio-v6";
import {
  createZipBlob,
  generateDeployableProjectBundle as generateV5Bundle,
  generateDeployableProjectFiles as generateV5Files,
  type WebsiteStudioAssetLoader,
} from "./website-studio-project-export-v4";
import type { GeneratedProjectFiles } from "./website-studio-project-export";

const pretty = (value: unknown) => JSON.stringify(value, null, 2);
const q = (value: unknown) => JSON.stringify(value);

function appSource() {
  return `import { useEffect, useState } from "react";
import "./styles.css";
import { StructuralFamilyPage } from "./components/StructuralFamilyPage";
import { StudioPage } from "./components/StudioPage";
import { siteConfig } from "./site-config";
import { track } from "./lib/studio-analytics";

function currentPath() {
  const value = window.location.pathname.replace(/\\/+$/, "") || "/";
  return value;
}

export default function App() {
  const [path, setPath] = useState(() => currentPath());
  useEffect(() => {
    const onPop = () => setPath(currentPath());
    window.addEventListener("popstate", onPop);
    void track("page_view", { pagePath: currentPath() });
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  const pages = siteConfig.studioV6?.pages || [];
  const page = pages.find((item: any) => (item.slug === "/" ? "/" : "/" + item.slug.replace(/^\\//, "")) === path) || pages.find((item: any) => item.slug === "/");
  if (path === "/") return <StructuralFamilyPage />;
  return <StudioPage page={page} pages={pages} />;
}
`;
}

function studioPageSource() {
  return `import { siteConfig } from "../site-config";
import { StudioSection } from "./StudioSection";

export function StudioPage({ page, pages }: { page: any; pages: any[] }) {
  if (!page) return <main className="v6-not-found"><h1>Page not found</h1><a href="/">Return home</a></main>;
  return <div className="v6-site" style={{ "--v6-primary": siteConfig.brand.primary, "--v6-secondary": siteConfig.brand.secondary, "--v6-accent": siteConfig.brand.accent, "--v6-surface": siteConfig.brand.surface, "--v6-text": siteConfig.brand.text } as React.CSSProperties}>
    <header className="v6-header"><div className="v6-shell"><a className="v6-brand" href="/">{siteConfig.brand.logoUrl ? <img src={siteConfig.brand.logoUrl} alt={siteConfig.businessName}/> : <strong>{siteConfig.brand.logoText || siteConfig.businessName}</strong>}</a><nav>{pages.filter((item:any)=>item.visible).slice(0,7).map((item:any)=><a key={item.id} href={item.slug === "/" ? "/" : "/"+item.slug.replace(/^\\//,"")}>{item.title}</a>)}</nav><a href="/contact" className="v6-button">{siteConfig.site.primaryCta}</a></div></header>
    <main>{[...page.sections].sort((a:any,b:any)=>a.order-b.order).map((section:any)=><StudioSection key={section.id} section={section}/>)}</main>
    <footer className="v6-footer"><div className="v6-shell"><strong>{siteConfig.businessName}</strong><span>{siteConfig.contact.address}</span><a href={"mailto:"+siteConfig.contact.email}>{siteConfig.contact.email}</a></div></footer>
  </div>;
}
`;
}

function sectionSource() {
  return `import { siteConfig } from "../site-config";
import { StudioForm } from "./StudioForm";
import { track } from "../lib/studio-analytics";

function records(type: string) { return (siteConfig.studioV6?.industryRecords || []).filter((item:any)=>item.moduleType===type && item.status!=="archived"); }
function genericItems(section:any) { const values=section.content?.items; return Array.isArray(values)&&values.length ? values : siteConfig.site.services; }
function image(item:any) { return item?.media?.[0]?.url || item?.imageUrl || ""; }

export function StudioSection({ section }: { section:any }) {
  const deviceClass = ["v6-section", "v6-" + section.type].join(" ");
  const style = { background: section.style?.background || undefined, paddingTop: section.style?.paddingTop ? section.style.paddingTop+"px" : undefined, paddingBottom: section.style?.paddingBottom ? section.style.paddingBottom+"px" : undefined };
  if (section.type === "hero") return <section className={deviceClass} style={style}><div className="v6-shell v6-hero-grid"><div><span className="v6-kicker">{siteConfig.businessName}</span><h1>{section.content?.headline || section.title || siteConfig.site.headline}</h1><p>{section.content?.tagline || siteConfig.site.tagline}</p><div className="v6-actions"><a href="#next" className="v6-button" onClick={()=>void track("cta_click",{elementId:section.id})}>{siteConfig.site.primaryCta}</a><a href="/contact" className="v6-button secondary">Contact</a></div></div>{siteConfig.site.heroImageUrl?<img className="v6-hero-image" src={siteConfig.site.heroImageUrl} alt={siteConfig.businessName}/>:<div className="v6-hero-card"><strong>{siteConfig.site.description}</strong></div>}</div></section>;
  if (["products","properties","menu","courses","rooms","practitioners","articles","events"].includes(section.type)) {
    const map:Record<string,string>={products:"product",properties:"property",menu:"menu_item",courses:"course",rooms:"room",practitioners:"practitioner",articles:"article",events:"event"}; const data=records(map[section.type]);
    return <section className={deviceClass} style={style}><div className="v6-shell"><SectionHead section={section}/><div className="v6-record-grid">{(data.length?data:genericItems(section).map((title:any,index:number)=>({id:index,title:String(title),data:{description:"Add structured content in Website Studio."},media:[]}))).map((item:any)=><article key={item.id}><>{image(item)?<img src={image(item)} alt={item.media?.[0]?.alt||item.title} loading="lazy"/>:<div className="v6-media-placeholder"/>}</><div><span>{section.type}</span><h3>{item.title}</h3><p>{item.data?.description || item.data?.summary || item.data?.price || ""}</p></div></article>)}</div></div></section>;
  }
  if (section.type === "stats") return <section className={deviceClass} style={style}><div className="v6-shell v6-stat-grid">{siteConfig.site.stats.map((item:any)=><article key={item.label}><strong>{item.value}</strong><span>{item.label}</span></article>)}</div></section>;
  if (section.type === "gallery") return <section className={deviceClass} style={style}><div className="v6-shell"><SectionHead section={section}/><div className="v6-gallery">{siteConfig.site.gallery.map((url:string,index:number)=><img key={url} src={url} alt={siteConfig.businessName+" gallery image "+(index+1)} loading="lazy"/>)}</div></div></section>;
  if (section.type === "testimonials") return <section className={deviceClass} style={style}><div className="v6-shell"><SectionHead section={section}/><div className="v6-card-grid">{siteConfig.site.testimonials.map((value:string)=><blockquote key={value}>“{value}”</blockquote>)}</div></div></section>;
  if (section.type === "process") return <section className={deviceClass} style={style}><div className="v6-shell"><SectionHead section={section}/><div className="v6-card-grid">{siteConfig.site.process.map((value:string,index:number)=><article key={value}><b>{String(index+1).padStart(2,"0")}</b><h3>{value}</h3></article>)}</div></div></section>;
  if (section.type === "faq") { const faqs=(section.content?.items as any[])||[{question:"How do I get started?",answer:"Contact us and we will guide you through the next step."},{question:"Can I request a custom solution?",answer:"Yes. Tell us what you need and we will scope the right approach."}]; return <section className={deviceClass} style={style}><div className="v6-shell"><SectionHead section={section}/><div className="v6-faq">{faqs.map((item:any)=><details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</div></div></section>; }
  if (section.type === "form" || section.type === "contact") return <section className={deviceClass} style={style}><div className="v6-shell v6-contact-grid"><div><SectionHead section={section}/><p>{siteConfig.contact.email}</p><p>{siteConfig.contact.phone}</p><p>{siteConfig.contact.address}</p></div><StudioForm form={(siteConfig.studioV6?.forms||[])[0]}/></div></section>;
  if (section.type === "map") return <section className={deviceClass} style={style}><div className="v6-shell"><SectionHead section={section}/><div className="v6-map-placeholder">{siteConfig.contact.address}</div></div></section>;
  if (section.type === "pricing") return <section className={deviceClass} style={style}><div className="v6-shell"><SectionHead section={section}/><div className="v6-card-grid">{["Starter","Growth","Enterprise"].map((name,index)=><article key={name}><span>{name}</span><h3>{index===2?"Custom":"R"+([499,1499][index] || 0)}</h3><p>Configure pricing and included features in Website Studio.</p></article>)}</div></div></section>;
  if (section.type === "code") return <section className={deviceClass} style={style}><div className="v6-shell"><SectionHead section={section}/><pre className="v6-code">{String(section.content?.code || 'curl -X POST https://api.example.com/v1/action \\\n  -H "Authorization: Bearer $API_KEY"')}</pre></div></section>;
  if (section.type === "integrations" || section.type === "logo-cloud") return <section className={deviceClass} style={style}><div className="v6-shell"><SectionHead section={section}/><div className="v6-logo-cloud">{genericItems(section).slice(0,6).map((item:any)=><span key={String(item)}>{String(item)}</span>)}</div></div></section>;
  if (section.type === "cta") return <section className={deviceClass} style={style}><div className="v6-shell v6-cta"><div><span>READY WHEN YOU ARE</span><h2>{section.content?.title || siteConfig.site.headline}</h2></div><a className="v6-button" href="/contact">{siteConfig.site.primaryCta}</a></div></section>;
  const items=genericItems(section);
  return <section id="next" className={deviceClass} style={style}><div className="v6-shell"><SectionHead section={section}/><div className="v6-card-grid">{items.slice(0,Math.max(3,section.columns||3)).map((item:any,index:number)=><article key={String(item)+index}><span>{String(index+1).padStart(2,"0")}</span><h3>{String(item)}</h3><p>{siteConfig.site.description}</p></article>)}</div></div></section>;
}

function SectionHead({section}:{section:any}) { return <header className="v6-section-head"><span>{section.type}</span><h2>{section.title}</h2><p>{String(section.content?.description || siteConfig.site.description)}</p></header>; }
`;
}

function formSource() {
  return `import { useState, type FormEvent } from "react";
import { submitPublicAction } from "../lib/studio-public-api";
export function StudioForm({form}:{form:any}) {
  const [state,setState]=useState("idle"); if(!form)return null;
  async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();const element=event.currentTarget;const values=Object.fromEntries(new FormData(element).entries());setState("sending");try{await submitPublicAction("form_submit",{formSlug:form.slug,values});element.reset();setState("sent");}catch{setState("error");}}
  return <form className="v6-form" onSubmit={submit}><input className="v6-hp" name="website" tabIndex={-1} autoComplete="off"/>{form.fields.map((field:any)=><label key={field.id}><span>{field.label}</span>{field.type==="textarea"?<textarea name={field.name} required={field.required} rows={5}/>:field.type==="select"?<select name={field.name} required={field.required}>{(field.options||[]).map((option:string)=><option key={option}>{option}</option>)}</select>:field.type==="checkbox"?<input type="checkbox" name={field.name} required={field.required}/>:<input type={field.type} name={field.name} required={field.required}/>}</label>)}<button className="v6-button" disabled={state==="sending"}>{state==="sending"?"Sending…":form.settings.submitLabel}</button>{state==="sent"?<p>{form.settings.successMessage}</p>:null}{state==="error"?<p>We could not submit this form. Please try again.</p>:null}</form>;
}
`;
}

function apiSource() {
  return `import { siteConfig } from "../site-config";
const endpoint=import.meta.env.VITE_STUDIO_PUBLIC_API_ENDPOINT as string|undefined;
const projectToken=import.meta.env.VITE_STUDIO_PROJECT_TOKEN as string|undefined;
export async function submitPublicAction(action:string,payload:Record<string,unknown>){if(!endpoint||!projectToken)throw new Error("PUBLIC_API_NOT_CONFIGURED");const response=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action,projectToken,...payload,sourceUrl:window.location.href})});if(!response.ok)throw new Error("PUBLIC_ACTION_FAILED");return response.json();}
export function projectName(){return siteConfig.businessName;}
`;
}

function analyticsSource() {
  return `import { siteConfig } from "../site-config";
const endpoint=import.meta.env.VITE_STUDIO_PUBLIC_API_ENDPOINT as string|undefined;
const token=import.meta.env.VITE_STUDIO_ANALYTICS_TOKEN as string|undefined;
function session(){let id=sessionStorage.getItem("stu_session");if(!id){id=crypto.randomUUID();sessionStorage.setItem("stu_session",id);}return id;}
export async function track(eventType:string,input:{pagePath?:string;elementId?:string;metadata?:Record<string,unknown>}={}){if(!siteConfig.studioV6?.analytics?.enabled||!endpoint||!token)return;const device=window.innerWidth<640?"mobile":window.innerWidth<1024?"tablet":"desktop";const params=new URLSearchParams(location.search);const campaign={utm_source:params.get("utm_source"),utm_medium:params.get("utm_medium"),utm_campaign:params.get("utm_campaign")};try{await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},keepalive:true,body:JSON.stringify({action:"analytics_event",analyticsToken:token,eventType,pagePath:input.pagePath||location.pathname,elementId:input.elementId||null,sessionId:session(),device:{type:device},campaign,metadata:input.metadata||{}})});}catch{/* analytics never blocks the site */}}
`;
}

function extraCss() {
  return `
:root{--v6-primary:#1737d1;--v6-secondary:#071449;--v6-accent:#03a995;--v6-surface:#f7f9fc;--v6-text:#0b1220}.v6-site{min-height:100vh;color:var(--v6-text);background:#fff}.v6-shell{width:min(1160px,calc(100% - 48px));margin:auto}.v6-header{position:sticky;top:0;z-index:40;background:rgba(255,255,255,.94);backdrop-filter:blur(18px);border-bottom:1px solid #e9edf4}.v6-header>.v6-shell{min-height:74px;display:flex;align-items:center;gap:24px}.v6-brand{margin-right:auto;text-decoration:none;color:var(--v6-secondary);display:flex;align-items:center}.v6-brand img{max-height:44px;max-width:180px}.v6-header nav{display:flex;gap:20px}.v6-header nav a{font-size:13px;font-weight:750;text-decoration:none;color:#556174}.v6-button{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 18px;background:var(--v6-primary);color:#fff;border:0;border-radius:12px;text-decoration:none;font-weight:800;cursor:pointer}.v6-button.secondary{background:#fff;color:var(--v6-secondary);border:1px solid #dce3ee}.v6-section{padding:80px 0}.v6-section:nth-child(even):not(.v6-hero):not(.v6-cta){background:var(--v6-surface)}.v6-hero{padding:88px 0;background:linear-gradient(145deg,#fff,var(--v6-surface))}.v6-hero-grid{display:grid;grid-template-columns:1.05fr .95fr;gap:52px;align-items:center}.v6-hero h1{font-size:clamp(44px,6vw,76px);line-height:.98;letter-spacing:-.055em;color:var(--v6-secondary);margin:15px 0}.v6-hero p,.v6-section-head p{color:#637086;line-height:1.7}.v6-kicker,.v6-section-head>span{font-size:10px;font-weight:900;letter-spacing:.13em;text-transform:uppercase;color:var(--v6-primary)}.v6-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:24px}.v6-hero-image,.v6-hero-card{width:100%;min-height:390px;height:46vw;max-height:520px;border-radius:24px;object-fit:cover;box-shadow:0 28px 70px rgba(7,20,73,.16)}.v6-hero-card{padding:34px;background:var(--v6-secondary);color:#fff;display:flex;align-items:flex-end}.v6-hero-card strong{font-size:28px}.v6-section-head{max-width:720px;margin-bottom:30px}.v6-section-head h2{font-size:clamp(34px,4vw,52px);letter-spacing:-.045em;color:var(--v6-secondary);margin:8px 0}.v6-card-grid,.v6-record-grid,.v6-stat-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.v6-card-grid article,.v6-card-grid blockquote,.v6-record-grid article,.v6-stat-grid article{margin:0;padding:22px;border:1px solid #e3e8f0;border-radius:18px;background:#fff;box-shadow:0 12px 36px rgba(7,20,73,.06)}.v6-card-grid article>span,.v6-record-grid article span{font-size:10px;font-weight:900;color:var(--v6-primary);text-transform:uppercase}.v6-card-grid h3,.v6-record-grid h3{font-size:21px;color:var(--v6-secondary);margin:10px 0}.v6-record-grid article{padding:0;overflow:hidden}.v6-record-grid article>img,.v6-media-placeholder{width:100%;height:210px;object-fit:cover;background:linear-gradient(135deg,var(--v6-secondary),var(--v6-primary))}.v6-record-grid article>div{padding:18px}.v6-stat-grid article{text-align:center}.v6-stat-grid strong{display:block;font-size:38px;color:var(--v6-secondary)}.v6-stat-grid span{font-size:12px;color:#647087}.v6-gallery{display:grid;grid-template-columns:2fr 1fr 1fr;gap:10px}.v6-gallery img{width:100%;height:260px;object-fit:cover;border-radius:16px}.v6-faq{display:grid;gap:10px}.v6-faq details{padding:18px 20px;border:1px solid #e3e8f0;border-radius:14px;background:#fff}.v6-faq summary{font-weight:800;cursor:pointer}.v6-contact-grid{display:grid;grid-template-columns:.9fr 1.1fr;gap:42px}.v6-form{display:grid;gap:13px;padding:24px;background:#fff;border:1px solid #e3e8f0;border-radius:20px}.v6-form label{display:grid;gap:7px;font-size:12px;font-weight:800}.v6-form input,.v6-form textarea,.v6-form select{width:100%;padding:12px 13px;border:1px solid #d9e0eb;border-radius:10px;font:inherit}.v6-hp{position:absolute!important;left:-10000px!important}.v6-map-placeholder{min-height:300px;border-radius:20px;background:linear-gradient(135deg,#eaf1f5,#dce9e5);display:grid;place-items:center;font-weight:800;color:#475569}.v6-code{padding:24px;border-radius:18px;background:#07110d;color:#b9ff43;overflow:auto;line-height:1.7}.v6-logo-cloud{display:grid;grid-template-columns:repeat(6,1fr);gap:10px}.v6-logo-cloud span{padding:20px;border:1px solid #e3e8f0;border-radius:12px;text-align:center;font-weight:900;background:#fff}.v6-cta{padding:36px;border-radius:24px;background:linear-gradient(125deg,var(--v6-secondary),var(--v6-primary));color:#fff;display:flex;align-items:center;justify-content:space-between;gap:30px}.v6-cta h2{font-size:clamp(30px,4vw,48px);margin:8px 0}.v6-cta .v6-button{background:#fff;color:var(--v6-secondary)}.v6-footer{padding:34px 0;background:#071449;color:#fff}.v6-footer>.v6-shell{display:flex;gap:24px;justify-content:space-between;flex-wrap:wrap}.v6-footer a{color:#fff}.v6-not-found{min-height:100vh;display:grid;place-content:center;text-align:center}
@media(max-width:900px){.v6-header nav{display:none}.v6-hero-grid,.v6-contact-grid{grid-template-columns:1fr}.v6-card-grid,.v6-record-grid,.v6-stat-grid{grid-template-columns:repeat(2,1fr)}.v6-logo-cloud{grid-template-columns:repeat(3,1fr)}.v6-gallery{grid-template-columns:1fr 1fr}.v6-hero-image,.v6-hero-card{height:440px}}
@media(max-width:600px){.v6-shell{width:min(100% - 30px,1160px)}.v6-header>.v6-shell{min-height:64px}.v6-header>.v6-shell>.v6-button{display:none}.v6-section,.v6-hero{padding:52px 0}.v6-card-grid,.v6-record-grid,.v6-stat-grid,.v6-logo-cloud,.v6-gallery{grid-template-columns:1fr}.v6-hero h1{font-size:42px}.v6-hero-image,.v6-hero-card{height:320px;min-height:0}.v6-cta{align-items:flex-start;flex-direction:column}}
`;
}

function sitemap(draft: StudioV6Draft) {
  const origin = (draft.studioV6.domain.production || draft.contact.website || "https://example.com").replace(/\/$/, "");
  const urls = draft.studioV6.pages.filter((page) => page.visible && !page.seo.noIndex).map((page) => `${origin}${page.slug === "/" ? "" : `/${page.slug.replace(/^\//, "")}`}`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `  <url><loc>${url.replaceAll("&", "&amp;")}</loc></url>`).join("\n")}\n</urlset>\n`;
}

function publicEnvV6(draft: StudioV6Draft) {
  const base = [
    `VITE_STUDIO_PUBLIC_API_ENDPOINT=${draft.integrations.supabase.managedFormEndpoint.replace(/website-studio-form-submit$/, "website-studio-public-api")}`,
    `VITE_STUDIO_PROJECT_TOKEN=${draft.integrations.supabase.publicSubmitToken}`,
    `VITE_STUDIO_ANALYTICS_TOKEN=${(draft as any).analyticsToken || ""}`,
  ];
  return base.join("\n") + "\n";
}

export function generateDeployableProjectFiles(raw: WebsiteStudioDraft | StudioV6Draft): GeneratedProjectFiles {
  const draft = ensureStudioV6Draft(normalizeWebsiteDraft(raw as WebsiteStudioDraft) as StudioV6Draft);
  const files = generateV5Files(draft);
  files["src/App.tsx"] = appSource();
  files["src/components/StudioPage.tsx"] = studioPageSource();
  files["src/components/StudioSection.tsx"] = sectionSource();
  files["src/components/StudioForm.tsx"] = formSource();
  files["src/lib/studio-public-api.ts"] = apiSource();
  files["src/lib/studio-analytics.ts"] = analyticsSource();
  files["src/site-config.ts"] = `export const siteConfig = ${pretty(draft)} as const;\n`;
  files["src/styles.css"] = String(files["src/styles.css"] || "") + extraCss();
  files["app/studio-v6.json"] = pretty(draft.studioV6);
  files["app/pages.json"] = pretty(draft.studioV6.pages);
  files["app/industry-records.json"] = pretty(draft.studioV6.industryRecords);
  files["app/forms.json"] = pretty(draft.studioV6.forms);
  files["public/sitemap.xml"] = sitemap(draft);
  files["public/robots.txt"] = draft.seo.indexable ? "User-agent: *\nAllow: /\nSitemap: /sitemap.xml\n" : "User-agent: *\nDisallow: /\n";
  files["env/vercel.env.example"] = String(files["env/vercel.env.example"] || "") + "\n" + publicEnvV6(draft);
  files[".env.example"] = String(files[".env.example"] || "") + "\n" + publicEnvV6(draft);
  files["README.md"] = String(files["README.md"] || "") + "\n\n## Website Studio V6\nThis export includes multi-page routing, structured content, forms, analytics hooks, responsive controls and portable assets. No private platform secrets are included.\n";
  return files;
}

function encodeBase64(bytes: Uint8Array) { let binary=""; for(let offset=0;offset<bytes.length;offset+=0x8000) binary+=String.fromCharCode(...bytes.subarray(offset,Math.min(offset+0x8000,bytes.length))); return btoa(binary); }
function ext(url:string,mime=""){const match=url.split(/[?#]/)[0].match(/\.([a-z0-9]{2,5})$/i);if(match?.[1])return match[1].toLowerCase()==="jpeg"?"jpg":match[1].toLowerCase();if(mime.includes("avif"))return"avif";if(mime.includes("webp"))return"webp";if(mime.includes("jpeg"))return"jpg";return"png";}
async function defaultLoader(url:string){const response=await fetch(url);if(!response.ok)throw new Error(`Unable to bundle website asset: ${url}`);return{bytes:new Uint8Array(await response.arrayBuffer()),mimeType:response.headers.get("content-type")||undefined};}

export async function generateDeployableProjectBundle(raw: WebsiteStudioDraft | StudioV6Draft, loadAsset: WebsiteStudioAssetLoader = defaultLoader): Promise<GeneratedProjectFiles> {
  const draft = ensureStudioV6Draft(normalizeWebsiteDraft(raw as WebsiteStudioDraft) as StudioV6Draft);
  const base = await generateV5Bundle(draft, loadAsset);
  const mediaCache = new Map<string,string>(); const binaries:GeneratedProjectFiles={};
  const records = await Promise.all(draft.studioV6.industryRecords.map(async(record,recordIndex)=>({ ...record, media: await Promise.all((record.media||[]).map(async(item,mediaIndex)=>{
    if(!item.url || !/^https?:\/\//.test(item.url)) return item;
    const cached=mediaCache.get(item.url); if(cached)return{...item,url:cached};
    const loaded=await loadAsset(item.url);const target=`/assets/content-${String(recordIndex+1).padStart(2,"0")}-${String(mediaIndex+1).padStart(2,"0")}.${ext(item.url,loaded.mimeType)}`;binaries[`public${target}`]={encoding:"base64",data:encodeBase64(loaded.bytes)};mediaCache.set(item.url,target);return{...item,url:target};
  })) })));
  const portable = ensureStudioV6Draft({ ...draft, studioV6: { ...draft.studioV6, industryRecords: records } } as StudioV6Draft);
  const files = generateDeployableProjectFiles(portable); Object.assign(files, base, files, binaries);
  return files;
}

export async function downloadProjectZip(raw: WebsiteStudioDraft | StudioV6Draft) {
  const draft=ensureStudioV6Draft(raw as StudioV6Draft);const files=await generateDeployableProjectBundle(draft);const blob=createZipBlob(files,draft.slug||"website");const url=URL.createObjectURL(blob);const anchor=document.createElement("a");anchor.href=url;anchor.download=`${draft.slug||"website"}-source.zip`;anchor.click();window.setTimeout(()=>URL.revokeObjectURL(url),2500);return{files:Object.keys(files),bytes:blob.size};
}
