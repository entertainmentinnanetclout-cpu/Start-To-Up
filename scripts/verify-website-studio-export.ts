import { execFileSync } from "node:child_process";
import { access, mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { createWebsiteDraft, normalizeWebsiteDraft } from "../src/lib/website-studio";
import { createZipBlob, generateDeployableProjectFiles } from "../src/lib/website-studio-project-export";

const tempRoot = "/tmp/start-to-up-website-studio-export-test";
const zipPath = "/tmp/start-to-up-website-studio-export-test.zip";
const rootFolder = "export-contract";

await rm(tempRoot, { recursive: true, force: true });
await rm(zipPath, { force: true });

const base = createWebsiteDraft("Website Studio Export Contract", "technology");
const draft = normalizeWebsiteDraft({
  ...base,
  slug: rootFolder,
  integrations: {
    ...base.integrations,
    supabase: { ...base.integrations.supabase, mode: "none" },
  },
});

const files = generateDeployableProjectFiles(draft);
const required = [
  "package.json",
  "index.html",
  "vite.config.ts",
  "vercel.json",
  ".env.example",
  ".env.production",
  "app/site.json",
  "src/main.tsx",
  "src/App.tsx",
  "src/styles.css",
  "src/components/ContactForm.tsx",
  "src/lib/lead-submit.ts",
  "public/assets/brand-mark.svg",
  "api/health.js",
  "supabase/migrations/001_contact_submissions.sql",
  ".github/workflows/build.yml",
  ".lovable/README.md",
  "LOVABLE.md",
  "DEPLOYMENT.md",
];

for (const path of required) {
  if (!(path in files)) throw new Error(`Missing generated export file: ${path}`);
}

const zip = createZipBlob(files, rootFolder);
await writeFile(zipPath, new Uint8Array(await zip.arrayBuffer()));
execFileSync("unzip", ["-t", zipPath], { stdio: "inherit" });
await mkdir(tempRoot, { recursive: true });
execFileSync("unzip", ["-q", zipPath, "-d", tempRoot], { stdio: "inherit" });

const projectDir = join(tempRoot, rootFolder);
for (const path of required) await access(join(projectDir, path));

execFileSync("npm", ["install", "--ignore-scripts"], { cwd: projectDir, stdio: "inherit" });
execFileSync("npm", ["run", "build"], { cwd: projectDir, stdio: "inherit" });
execFileSync("node", ["scripts/verify-export.mjs"], { cwd: projectDir, stdio: "inherit" });

const distIndex = join(projectDir, "dist", "index.html");
await access(distIndex);

console.log(`Website Studio ZIP contract passed: ${Object.keys(files).length} files, ${zip.size} bytes.`);
