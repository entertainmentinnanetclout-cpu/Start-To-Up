export * from "./website-studio-project-export-v6";

import type { WebsiteStudioDraft } from "./website-studio";
import type { StudioV6Draft } from "./website-studio-v6";
import { createZipBlob } from "./website-studio-project-export";
import type { GeneratedProjectFiles } from "./website-studio-project-export";
import type { WebsiteStudioAssetLoader } from "./website-studio-project-export-v4";
import {
  generateDeployableProjectFiles as generateV6Files,
  generateDeployableProjectBundle as generateV6Bundle,
} from "./website-studio-project-export-v6";
import { generateEntertainmentProjectBundle, generateEntertainmentProjectFiles } from "./website-studio-entertainment-export";
import { isEntertainmentTemplate } from "./website-studio-entertainment-templates";

function patchPublicRuntime(files: GeneratedProjectFiles, raw: WebsiteStudioDraft | StudioV6Draft) {
  const token = raw.integrations?.supabase?.publicSubmitToken || "";
  const patchEnv = (path: string) => {
    const current = files[path];
    if (typeof current !== "string") return;
    files[path] = current.replace(/VITE_STUDIO_ANALYTICS_TOKEN=.*(?:\n|$)/, `VITE_STUDIO_ANALYTICS_TOKEN=${token}\n`);
  };
  patchEnv(".env.example");
  patchEnv("env/vercel.env.example");
  const analytics = files["src/lib/studio-analytics.ts"];
  if (typeof analytics === "string") {
    files["src/lib/studio-analytics.ts"] = analytics.replace(
      'const token=import.meta.env.VITE_STUDIO_ANALYTICS_TOKEN as string|undefined;',
      'const token=(import.meta.env.VITE_STUDIO_ANALYTICS_TOKEN || import.meta.env.VITE_STUDIO_PROJECT_TOKEN) as string|undefined;',
    );
  }
  return files;
}

export function generateDeployableProjectFiles(raw: WebsiteStudioDraft | StudioV6Draft): GeneratedProjectFiles {
  const generated = isEntertainmentTemplate(raw.templateKey) ? generateEntertainmentProjectFiles(raw) : generateV6Files(raw);
  return patchPublicRuntime(generated, raw);
}

export async function generateDeployableProjectBundle(raw: WebsiteStudioDraft | StudioV6Draft, loadAsset?: WebsiteStudioAssetLoader): Promise<GeneratedProjectFiles> {
  const generated = isEntertainmentTemplate(raw.templateKey) ? await generateEntertainmentProjectBundle(raw, loadAsset) : await generateV6Bundle(raw, loadAsset);
  return patchPublicRuntime(generated, raw);
}

export async function downloadProjectZip(raw: WebsiteStudioDraft | StudioV6Draft) {
  const files = await generateDeployableProjectBundle(raw);
  const slug = raw.slug || "website";
  const blob = createZipBlob(files, slug);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${slug}-source.zip`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 2500);
  return { files: Object.keys(files), bytes: blob.size };
}
