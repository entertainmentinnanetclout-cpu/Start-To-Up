import { createServer, type Server } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

const baseRoot = process.env.STU_FIDELITY_BASE || "/tmp/stu-base";
const headRoot = process.env.STU_FIDELITY_HEAD || process.cwd();
const outputRoot = process.env.STU_FIDELITY_OUTPUT || "/tmp/website-studio-fidelity";
const templates = ["pulse-saas","neon-foundry","studio-north","habitat-property","campus-living","table-flame","atelier-mode","medica-clinic","edulaunch","newsroom-pro"];
const devices = [
  { name: "desktop", width: 1448, height: 1086 },
  { name: "tablet", width: 820, height: 1180 },
  { name: "mobile", width: 390, height: 844 },
] as const;
const maxDiffRatio = Number(process.env.STU_FIDELITY_MAX_DIFF || "0.02");

async function renderer(root: string) {
  const catalogUrl = pathToFileURL(join(root, "src/lib/website-studio-template-catalog.ts")).href;
  const defaultsUrl = pathToFileURL(join(root, "src/lib/website-studio-visual-contract-defaults.ts")).href;
  const contractsUrl = pathToFileURL(join(root, "src/lib/website-studio-visual-contracts.ts")).href;
  const catalog = await import(catalogUrl);
  const defaults = await import(defaultsUrl);
  const contracts = await import(contractsUrl);
  const pages = new Map<string,string>();
  for (const key of templates) {
    const template = catalog.studioTemplates.find((item:any) => item.key === key);
    if (!template) throw new Error(`${root}: template missing ${key}`);
    const draft = defaults.applyVisualContractDefaults(catalog.applyStudioTemplate(template));
    pages.set(key, contracts.renderWebsiteStudioHtml(draft));
  }
  return pages;
}

const types: Record<string,string> = { ".png":"image/png", ".jpg":"image/jpeg", ".jpeg":"image/jpeg", ".webp":"image/webp", ".svg":"image/svg+xml", ".css":"text/css", ".js":"text/javascript", ".json":"application/json" };
function serve(root: string, pages: Map<string,string>, port: number): Promise<Server> {
  return new Promise((resolve,reject) => {
    const server=createServer(async(req,res)=>{
      try {
        const url=new URL(req.url||"/",`http://127.0.0.1:${port}`);
        if(url.pathname.startsWith("/__fidelity/")){
          const key=url.pathname.split("/").pop()?.replace(/\.html$/,"")||"";
          const html=pages.get(key); if(!html){res.writeHead(404);res.end("missing");return;}
          res.writeHead(200,{"content-type":"text/html; charset=utf-8","cache-control":"no-store"});res.end(html);return;
        }
        const clean=normalize(url.pathname).replace(/^(\.\.[/\\])+/,"").replace(/^[/\\]+/,"");
        const path=join(root,"public",clean); const data=await readFile(path);res.writeHead(200,{"content-type":types[extname(path).toLowerCase()]||"application/octet-stream","cache-control":"no-store"});res.end(data);
      } catch {res.writeHead(404);res.end("not found");}
    });
    server.once("error",reject);server.listen(port,"127.0.0.1",()=>resolve(server));
  });
}

await mkdir(outputRoot,{recursive:true});
const [basePages,headPages]=await Promise.all([renderer(baseRoot),renderer(headRoot)]);
const [baseServer,headServer]=await Promise.all([serve(baseRoot,basePages,4175),serve(headRoot,headPages,4176)]);
const browser=await chromium.launch({headless:true});
let failures=0;
try {
  for(const key of templates){
    for(const device of devices){
      const context=await browser.newContext({viewport:{width:device.width,height:device.height},deviceScaleFactor:1,reducedMotion:"reduce"});
      const base=await context.newPage();const head=await context.newPage();
      await Promise.all([base.goto(`http://127.0.0.1:4175/__fidelity/${key}.html`,{waitUntil:"networkidle"}),head.goto(`http://127.0.0.1:4176/__fidelity/${key}.html`,{waitUntil:"networkidle"})]);
      const [baseBytes,headBytes]=await Promise.all([base.screenshot({fullPage:true}),head.screenshot({fullPage:true})]);
      let basePng=PNG.sync.read(baseBytes),headPng=PNG.sync.read(headBytes);
      const width=Math.min(basePng.width,headPng.width),height=Math.min(basePng.height,headPng.height);
      const crop=(png:PNG)=>{if(png.width===width&&png.height===height)return png;const out=new PNG({width,height});PNG.bitblt(png,out,0,0,width,height,0,0);return out};basePng=crop(basePng);headPng=crop(headPng);
      const diff=new PNG({width,height});const changed=pixelmatch(basePng.data,headPng.data,diff.data,width,height,{threshold:.12,includeAA:false});const ratio=changed/(width*height);
      const prefix=join(outputRoot,`${key}-${device.name}`);await Promise.all([writeFile(`${prefix}-base.png`,PNG.sync.write(basePng)),writeFile(`${prefix}-head.png`,PNG.sync.write(headPng)),writeFile(`${prefix}-diff.png`,PNG.sync.write(diff))]);
      console.log(`${key}/${device.name}: ${(ratio*100).toFixed(3)}% pixels changed`);if(ratio>maxDiffRatio){failures++;console.error(`Fidelity drift exceeded ${(maxDiffRatio*100).toFixed(1)}% for ${key}/${device.name}`);}
      await context.close();
    }
  }
} finally {await browser.close();await Promise.all([new Promise<void>(r=>baseServer.close(()=>r())),new Promise<void>(r=>headServer.close(()=>r()))]);}
if(failures)throw new Error(`Website Studio visual fidelity failed in ${failures} viewport checks.`);
console.log(`Website Studio visual fidelity passed for ${templates.length} visual contracts across ${devices.length} viewports.`);
