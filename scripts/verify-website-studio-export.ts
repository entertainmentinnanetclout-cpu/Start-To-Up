import { execFileSync } from "node:child_process";
import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createWebsiteDraft, normalizeWebsiteDraft } from "../src/lib/website-studio";
import { applyStudioTemplate, studioTemplates } from "../src/lib/website-studio-template-catalog";
import { createZipBlob } from "../src/lib/website-studio-project-export";
import { generateDeployableProjectBundle } from "../src/lib/website-studio-export";
import { getStructuralFamily } from "../src/lib/website-studio-structural";

const required = [
  "package.json","index.html","vite.config.ts","vercel.json",".env.example",".env.production",
  "app/site.json","app/STRUCTURAL_FAMILY.md","app/structural-family.json",
  "src/main.tsx","src/App.tsx","src/styles.css","src/components/StructuralFamilyPage.tsx",
  "src/components/ContactForm.tsx","src/lib/lead-submit.ts","public/assets/brand-mark.svg","api/health.js",
  "supabase/migrations/001_contact_submissions.sql",".github/workflows/build.yml",".lovable/README.md","LOVABLE.md","DEPLOYMENT.md",
];

const keys = ["pulse-saas", "habitat-property", "table-flame", "edulaunch", "newsroom-pro"];
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

for (const key of keys) {
  const template = studioTemplates.find((item) => item.key === key);
  if (!template) throw new Error(`Missing template fixture: ${key}`);
  const draft = normalizeWebsiteDraft({
    ...applyStudioTemplate(template, `Contract ${template.name}`),
    slug: `export-${key}`,
    integrations: {
      ...createWebsiteDraft().integrations,
      supabase: { ...createWebsiteDraft().integrations.supabase, mode: "none" },
    },
  });
  const files = await generateDeployableProjectBundle(draft, async (url) => ({
    bytes: new Uint8Array(await readFile(join(process.cwd(), "public", url.replace(/^\/+/, "")))),
    mimeType: "image/png",
  }));
  for (const path of required) if (!(path in files)) throw new Error(`${key}: missing generated export file ${path}`);
  if (!("public/assets/logo.png" in files)) throw new Error(`${key}: bundled template logo missing`);
  if (!("public/assets/hero.png" in files)) throw new Error(`${key}: bundled template hero missing`);
  const metadata = JSON.parse(String(files["app/structural-family.json"]));
  if (metadata.family !== getStructuralFamily(draft)) throw new Error(`${key}: structural family metadata mismatch`);

  const tempRoot = join(tmpdir(), `start-to-up-${key}`);
  const zipPath = join(tmpdir(), `start-to-up-${key}.zip`);
  await rm(tempRoot, { recursive: true, force: true });
  await rm(zipPath, { force: true });
  const zip = createZipBlob(files, draft.slug);
  await writeFile(zipPath, new Uint8Array(await zip.arrayBuffer()));
  execFileSync("unzip", ["-t", zipPath], { stdio: "inherit" });
  await mkdir(tempRoot, { recursive: true });
  execFileSync("unzip", ["-q", zipPath, "-d", tempRoot], { stdio: "inherit" });
  const projectDir = join(tempRoot, draft.slug);
  for (const path of required) await access(join(projectDir, path));
  execFileSync(npmCommand, ["install", "--ignore-scripts"], { cwd: projectDir, stdio: "inherit", shell: process.platform === "win32" });
  execFileSync(npmCommand, ["run", "build"], { cwd: projectDir, stdio: "inherit", shell: process.platform === "win32" });
  execFileSync("node", ["scripts/verify-export.mjs"], { cwd: projectDir, stdio: "inherit" });
  await access(join(projectDir, "dist", "index.html"));
  console.log(`${key}: ${getStructuralFamily(draft)} export passed (${Object.keys(files).length} files, ${zip.size} bytes)`);
}

console.log(`Website Studio V4 structural ZIP contract passed for ${keys.length} template families.`);
