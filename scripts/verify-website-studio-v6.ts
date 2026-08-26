import { execFileSync } from "node:child_process";
import { access, mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { applyStudioTemplate, studioTemplates } from "../src/lib/website-studio-template-catalog";
import { applyVisualContractDefaults } from "../src/lib/website-studio-visual-contract-defaults";
import { ensureStudioV6Draft, type StudioV6Draft } from "../src/lib/website-studio-v6";
import { createZipBlob } from "../src/lib/website-studio-project-export";
import { generateDeployableProjectFiles } from "../src/lib/website-studio-export";

const representatives = ["pulse-saas", "habitat-property", "table-flame", "edulaunch", "newsroom-pro"];
const required = [
  "package.json", "index.html", "vite.config.ts", "vercel.json", "src/main.tsx", "src/App.tsx", "src/styles.css", "src/site-config.ts",
  "src/components/StructuralFamilyPage.tsx", "src/components/StudioPage.tsx", "src/components/StudioSection.tsx", "src/components/StudioForm.tsx",
  "src/lib/studio-public-api.ts", "src/lib/studio-analytics.ts", "app/studio-v6.json", "app/pages.json", "app/industry-records.json", "app/forms.json", "public/sitemap.xml",
];

for (const key of representatives) {
  const template = studioTemplates.find((item) => item.key === key);
  if (!template) throw new Error(`Template missing: ${key}`);
  const draft = ensureStudioV6Draft(applyVisualContractDefaults(applyStudioTemplate(template)) as StudioV6Draft);
  draft.slug = `v6-${key}`;
  draft.integrations.supabase.publicSubmitToken = `test-${key}-public-token`;
  draft.studioV6.industryRecords.push({ id: `test-${key}`, moduleType: key === "habitat-property" ? "property" : key === "table-flame" ? "menu_item" : key === "edulaunch" ? "course" : key === "newsroom-pro" ? "article" : "product", title: `Test ${key}`, slug: `test-${key}`, status: "active", data: { description: "Portable V6 structured content" }, media: [] });
  const files = generateDeployableProjectFiles(draft);
  for (const path of required) if (!(path in files)) throw new Error(`${key}: missing ${path}`);
  const config = JSON.parse(String(files["app/studio-v6.json"]));
  if (config.version !== 6 || config.pages.length < 4) throw new Error(`${key}: invalid V6 config`);
  const analytics = String(files["src/lib/studio-analytics.ts"] || "");
  if (!analytics.includes("VITE_STUDIO_PROJECT_TOKEN")) throw new Error(`${key}: analytics fallback token missing`);
  const env = String(files["env/vercel.env.example"] || "");
  if (!env.includes(`VITE_STUDIO_ANALYTICS_TOKEN=test-${key}-public-token`)) throw new Error(`${key}: managed analytics token not exported`);
  if (/SERVICE_ROLE|STRIPE_SECRET|VERCEL_TOKEN|GITHUB.*PRIVATE/i.test(env)) throw new Error(`${key}: private secret leaked into public environment example`);
  const root = `/tmp/start-to-up-${draft.slug}`;
  const zipPath = `${root}.zip`;
  await rm(root, { recursive: true, force: true }); await rm(zipPath, { force: true });
  const zip = createZipBlob(files, draft.slug);
  await writeFile(zipPath, new Uint8Array(await zip.arrayBuffer()));
  execFileSync("unzip", ["-t", zipPath], { stdio: "inherit" });
  await mkdir(root, { recursive: true }); execFileSync("unzip", ["-q", zipPath, "-d", root], { stdio: "inherit" });
  const projectDir = join(root, draft.slug); for (const path of required) await access(join(projectDir, path));
  execFileSync("npm", ["install", "--ignore-scripts"], { cwd: projectDir, stdio: "inherit" });
  execFileSync("npm", ["run", "build"], { cwd: projectDir, stdio: "inherit" });
  await access(join(projectDir, "dist", "index.html"));
  console.log(`${key}: Website Studio V6 multi-page export passed (${Object.keys(files).length} files)`);
}
console.log(`Website Studio V6 export contract passed for ${representatives.length} template families.`);
