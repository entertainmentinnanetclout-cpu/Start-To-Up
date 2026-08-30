import type { WebsiteStudioDraft } from "./website-studio";
import { applyEntertainmentPages, isEntertainmentTemplate } from "./website-studio-entertainment-templates";
import { entertainmentCss, renderEntertainmentShell } from "./website-studio-entertainment-renderer";
import { ensureStudioV6Draft, type StudioV6Draft } from "./website-studio-v6";
import { generateDeployableProjectFiles as generateV6Files, generateDeployableProjectBundle as generateV6Bundle } from "./website-studio-project-export-v6";
import type { GeneratedProjectFiles } from "./website-studio-project-export";
import type { WebsiteStudioAssetLoader } from "./website-studio-project-export-v4";

const pretty = (value: unknown) => JSON.stringify(value, null, 2);

function prepared(raw: WebsiteStudioDraft | StudioV6Draft) {
  return applyEntertainmentPages(ensureStudioV6Draft(raw as StudioV6Draft));
}
function pagesModule(draft: StudioV6Draft) {
  const rows: Record<string,string> = {};
  for (const page of draft.studioV6.pages.filter((item)=>item.visible)) {
    const copy = structuredClone(draft);
    copy.studioV6.activePageSlug = page.slug;
    const path = page.slug === "/" ? "/" : `/${page.slug.replace(/^\//,"")}`;
    rows[path] = renderEntertainmentShell(copy) || "";
  }
  return `export const entertainmentPages: Record<string,string> = ${pretty(rows)};\n`;
}
function appSource() {
  return `import { useEffect, useState } from "react";\nimport "./styles.css";\nimport { entertainmentPages } from "./entertainment-pages";\n\nfunction path(){return window.location.pathname.replace(/\\/+$/,"")||"/";}\nexport default function App(){\n const [current,setCurrent]=useState(path());\n useEffect(()=>{const pop=()=>setCurrent(path());const click=(event:MouseEvent)=>{const target=event.target instanceof Element?event.target.closest("[data-studio-page]") as HTMLAnchorElement|null:null;if(!target)return;const raw=target.dataset.studioPage||"/";const next=raw==="/"?"/":"/"+raw.replace(/^\\//,"");event.preventDefault();history.pushState({},"",next);setCurrent(next);window.scrollTo({top:0,behavior:"smooth"});};window.addEventListener("popstate",pop);document.addEventListener("click",click);return()=>{window.removeEventListener("popstate",pop);document.removeEventListener("click",click);};},[]);\n const html=entertainmentPages[current]||entertainmentPages["/"];\n return <div dangerouslySetInnerHTML={{__html:html}}/>;\n}\n`;
}
function override(base: GeneratedProjectFiles, draft: StudioV6Draft) {
  base["src/App.tsx"] = appSource();
  base["src/entertainment-pages.ts"] = pagesModule(draft);
  const existing = typeof base["src/styles.css"] === "string" ? String(base["src/styles.css"]) : "";
  base["src/styles.css"] = `${existing}\n${entertainmentCss(draft)}`;
  base["app/ENTERTAINMENT_TEMPLATE.md"] = `# Entertainment visual contract\n\nTemplate: ${draft.templateKey}\n\nThis export contains a multi-page producer/artist visual system. Shared branding, media, navigation and page configuration originate from the same Website Studio draft. Payment and live-stream selling surfaces remain marked Coming Soon until providers are connected.\n`;
  return base;
}

export function generateEntertainmentProjectFiles(raw: WebsiteStudioDraft | StudioV6Draft): GeneratedProjectFiles {
  const draft = prepared(raw);
  if (!isEntertainmentTemplate(draft.templateKey)) return generateV6Files(draft);
  return override(generateV6Files(draft), draft);
}
export async function generateEntertainmentProjectBundle(raw: WebsiteStudioDraft | StudioV6Draft, loadAsset?: WebsiteStudioAssetLoader): Promise<GeneratedProjectFiles> {
  const draft = prepared(raw);
  if (!isEntertainmentTemplate(draft.templateKey)) return generateV6Bundle(draft, loadAsset);
  return override(await generateV6Bundle(draft, loadAsset), draft);
}
