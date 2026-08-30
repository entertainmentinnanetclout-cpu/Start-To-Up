import fs from "node:fs";
import path from "node:path";
import { createEntertainmentDraft, entertainmentTemplates, publishedStudioTemplates } from "../src/lib/website-studio-entertainment-templates";
import { renderStudioHtml } from "../src/lib/website-studio-render";
import { generateDeployableProjectFiles } from "../src/lib/website-studio-export";

const root=process.cwd();
const read=(file:string)=>fs.readFileSync(path.join(root,file),"utf8");
const required=[
  "src/lib/website-studio-entertainment-templates.ts",
  "src/lib/website-studio-entertainment-renderer.ts",
  "src/lib/website-studio-entertainment-export.ts",
  "src/lib/website-studio-render.ts",
  "src/lib/website-studio-access.ts",
  "src/lib/website-studio-admin.ts",
  "src/routes/app/website-studio-v6-pro.tsx",
  "src/routes/app/studio-control.tsx",
  "supabase/migrations/20260830113000_website_studio_access_admin_and_commercial_controls.sql",
  "supabase/migrations/20260830113500_website_studio_approval_enforcement.sql",
];
for(const file of required)if(!fs.existsSync(path.join(root,file)))throw new Error(`Entertainment/access release file missing: ${file}`);

if(entertainmentTemplates.length!==2)throw new Error("Producer and artist templates must both ship.");
const keys=entertainmentTemplates.map(t=>t.key).sort();
if(keys.join(",")!=="rap-cut-artist,rap-cut-producer")throw new Error(`Unexpected entertainment template keys: ${keys.join(",")}`);
const curated=new Set(publishedStudioTemplates.map(t=>t.key));
for(const key of ["rap-cut-producer","rap-cut-artist","neon-foundry","pulse-saas","studio-north","newsroom-pro"])if(!curated.has(key))throw new Error(`Curated marketplace missing ${key}`);
for(const generic of ["orbit-ai","boldfolio","counsel-prime","ledger-house","vertex-build","freshcart","glow-beauty","tiny-futures","summit-travel","eventspark","secureline","civic-impact","autodrive","block-ledger","homecraft","sportforge"]){if(curated.has(generic))throw new Error(`Generic/non-approved marketplace preset must be hidden: ${generic}`);}

const producer=createEntertainmentDraft(entertainmentTemplates.find(t=>t.key==="rap-cut-producer")!);
const artist=createEntertainmentDraft(entertainmentTemplates.find(t=>t.key==="rap-cut-artist")!);
const producerPages=producer.studioV6.pages.map(p=>p.title);
const artistPages=artist.studioV6.pages.map(p=>p.title);
for(const page of ["Home","Beats","Videos","Services","Merch","Events","About","Contact"])if(!producerPages.includes(page))throw new Error(`Producer website missing page ${page}`);
for(const page of ["Home","Music","Videos","Events","Merch","About","Contact"])if(!artistPages.includes(page))throw new Error(`Artist website missing page ${page}`);
if(producer.studioV6.pages[0].sections.length<8||artist.studioV6.pages[0].sections.length<8)throw new Error("Entertainment homepage must retain combined premium section system.");

const producerHtml=renderStudioHtml(producer);
for(const marker of ["FEATURED BEATS","MUSIC VIDEOS &amp; CLIPS","SERVICES","MERCH","LIVE EVENTS &amp; STREAMS","TESTIMONIALS &amp; COLLABORATORS","JOIN THE RCTJ LIST"])if(!producerHtml.includes(marker))throw new Error(`Producer visual contract missing ${marker}`);
const artistHtml=renderStudioHtml(artist);
for(const marker of ["FEATURED TRACKS","ARTIST · PERFORMER · CREATIVE","BOOK A SHOW"])if(!artistHtml.includes(marker))throw new Error(`Artist visual contract missing ${marker}`);
producer.studioV6.activePageSlug="merch";
if(!renderStudioHtml(producer).includes("PAYMENTS COMING SOON"))throw new Error("Entertainment merch/payment surface must remain explicitly Coming Soon until connected.");
producer.studioV6.activePageSlug="events";
if(!renderStudioHtml(producer).includes("LIVE STREAMING COMING SOON"))throw new Error("Entertainment live streaming surface must remain explicitly Coming Soon until connected.");

const generated=generateDeployableProjectFiles(artist);
for(const file of ["src/App.tsx","src/entertainment-pages.ts","app/ENTERTAINMENT_TEMPLATE.md","src/styles.css"])if(!(file in generated))throw new Error(`Entertainment export missing ${file}`);
const pageModule=String(generated["src/entertainment-pages.ts"]||"");
for(const route of ["/music","/videos","/events","/merch","/about","/contact"])if(!pageModule.includes(`\\"${route}\\"`)&&!pageModule.includes(`"${route}"`))throw new Error(`Exported artist source missing route ${route}`);

const editor=read("src/routes/app/website-studio-v6-pro.tsx");
if(!/sandbox=\"allow-same-origin\"/.test(editor))throw new Error("Visual preview must be sandboxed without navigation permissions.");
if(!/preventDefault\(\).*stopPropagation\(\)/s.test(editor))throw new Error("Visual preview must intercept navigation during editing.");
if(!/dataset\.studioPage/.test(editor))throw new Error("Multi-page preview must switch parent source rather than navigate the iframe.");
if(!/Double-click desktop · double-tap mobile/.test(editor))throw new Error("Contextual visual editing affordance missing.");
if(/readAsDataUrl/.test(editor))throw new Error("Unsigned local image upload fallback must not return; image upload requires signed-in approved media storage.");

const assets=read("src/lib/website-studio-assets.ts");
if(!/requireApprovedUploadAccess/.test(assets)||!/APPROVAL_REQUIRED/.test(assets))throw new Error("Asset library must require approved signed-in Website Studio access.");
const migration=read("supabase/migrations/20260830113000_website_studio_access_admin_and_commercial_controls.sql");
for(const token of ["builder_access_status","website_studio_template_catalog","website_studio_user_entitlements","website_studio_access_requests","can_extract_website_studio","admin_set_studio_user_access","admin_set_studio_template","admin_grant_studio_entitlement","admin_revoke_studio_entitlement"])if(!migration.includes(token))throw new Error(`Access/commercial migration missing ${token}`);
if(!/access_type text not null default 'paid'/.test(migration))throw new Error("Template commercial model must default to paid.");
const enforcement=read("supabase/migrations/20260830113500_website_studio_approval_enforcement.sql");
if(!/enforce_website_studio_project_approval/.test(enforcement)||!/enforce_website_studio_publication_approval/.test(enforcement))throw new Error("Server-side managed save/publication approval triggers missing.");
const admin=read("src/routes/app/studio-control.tsx");
for(const feature of ["Approve","Pause","Template commercial controls","Projects & deployments","System controls"])if(!admin.includes(feature))throw new Error(`Studio Control missing admin capability: ${feature}`);

console.log(`Website Studio entertainment/access release contract passed: ${publishedStudioTemplates.length} curated templates, producer ${producerPages.length} pages, artist ${artistPages.length} pages, sandboxed visual editing, approval-gated uploads/extraction and admin controls present.`);
