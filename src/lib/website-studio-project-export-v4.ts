import { normalizeWebsiteDraft, type WebsiteStudioDraft } from "./website-studio";
import { createZipBlob, generateDeployableProjectFiles as generateLegacyFiles, type GeneratedProjectFiles } from "./website-studio-project-export";
import { getStructuralFamily, structuralFamilyLabels } from "./website-studio-structural";
import { applyVisualContractDefaults } from "./website-studio-visual-contract-defaults";
import { hasVisualContract, renderWebsiteStudioShell, websiteStudioCss } from "./website-studio-visual-contracts";
import { applyVisualContractMediaDefaults } from "./website-studio-template-assets";

const q = (value: unknown) => JSON.stringify(value);

function generatedApp(draft: WebsiteStudioDraft) {
  const family = getStructuralFamily(draft);
  const contractClass = hasVisualContract(draft) ? " visual-contract-root" : "";
  return `import "./styles.css";\nimport { StructuralFamilyPage } from "./components/StructuralFamilyPage";\n\nexport default function App() {\n  return <div className="site family-root family-${family}${contractClass}"><StructuralFamilyPage /></div>;\n}\n`;
}

function structuralComponent(draft: WebsiteStudioDraft) {
  const family = getStructuralFamily(draft);
  const shell = renderWebsiteStudioShell(draft);
  return `export const structuralFamily = ${q(family)} as const;\nexport const structuralFamilyLabel = ${q(structuralFamilyLabels[family])};\nexport const visualContract = ${hasVisualContract(draft) ? "true" : "false"} as const;\n\nexport function StructuralFamilyPage() {\n  return <div dangerouslySetInnerHTML={{ __html: ${q(shell)} }} />;\n}\n`;
}

function familyReadme(draft: WebsiteStudioDraft) {
  const family = getStructuralFamily(draft);
  const locked = hasVisualContract(draft);
  return `# Website Studio generated project\n\nThis project was generated from the **${structuralFamilyLabels[family]}** Website Studio family.\n\n${locked ? "This template is reference-locked to an approved visual contract. The marketplace preview, editor preview and exported source all use the same template renderer. Media remains replaceable through the Website Studio asset slots without changing the page architecture." : "This template uses the structural family renderer, which changes semantic page architecture, section order and conversion flow."}\n\n## Edit points\n- \`src/components/StructuralFamilyPage.tsx\` — generated template markup\n- \`src/styles.css\` — responsive template styling\n- \`src/site-config.ts\` — complete Website Studio blueprint\n- \`app/site.json\` — portable source configuration\n\nThe project remains a normal Vite + React + TypeScript application and can be committed to GitHub or imported into Vercel without code changes.\n`;
}

function ready(raw: WebsiteStudioDraft) {
  return applyVisualContractDefaults(applyVisualContractMediaDefaults(normalizeWebsiteDraft(raw)));
}

export function generateDeployableProjectFiles(raw: WebsiteStudioDraft): GeneratedProjectFiles {
  const draft = ready(raw);
  const files = generateLegacyFiles(draft);
  files["src/App.tsx"] = generatedApp(draft);
  files["src/components/StructuralFamilyPage.tsx"] = structuralComponent(draft);
  files["src/styles.css"] = websiteStudioCss(draft);
  files["app/STRUCTURAL_FAMILY.md"] = familyReadme(draft);
  files["app/structural-family.json"] = JSON.stringify({
    templateKey: String(draft.templateKey),
    family: getStructuralFamily(draft),
    familyLabel: structuralFamilyLabels[getStructuralFamily(draft)],
    visualContract: hasVisualContract(draft),
  }, null, 2);
  return files;
}

export type WebsiteStudioAssetLoader = (url: string) => Promise<{ bytes: Uint8Array; mimeType?: string }>;

async function fetchAsset(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Unable to bundle website asset: ${url}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  const mimeType = response.headers.get("content-type");
  return mimeType ? { bytes, mimeType } : { bytes };
}

function encodeBase64(bytes: Uint8Array) {
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) binary += String.fromCharCode(...bytes.subarray(offset, Math.min(offset + 0x8000, bytes.length)));
  return btoa(binary);
}

function assetExtension(url: string, mimeType = "") {
  const match = url.split(/[?#]/)[0].match(/\.([a-z0-9]{2,5})$/i);
  const extension = match?.[1]?.toLowerCase();
  if (extension) return extension === "jpeg" ? "jpg" : extension;
  if (mimeType.includes("svg")) return "svg";
  if (mimeType.includes("webp")) return "webp";
  if (mimeType.includes("jpeg")) return "jpg";
  return "png";
}

export async function generateDeployableProjectBundle(raw: WebsiteStudioDraft, loadAsset: WebsiteStudioAssetLoader = fetchAsset): Promise<GeneratedProjectFiles> {
  const draft = ready(raw);
  const binaries: GeneratedProjectFiles = {};
  const cached = new Map<string, string>();
  const portable = async (url: string, name: string) => {
    if (!url) return "";
    const existing = cached.get(url);
    if (existing) return existing;
    const loaded = await loadAsset(url);
    const publicUrl = `/assets/${name}.${assetExtension(url, loaded.mimeType)}`;
    binaries[`public${publicUrl}`] = { encoding: "base64", data: encodeBase64(loaded.bytes) };
    cached.set(url, publicUrl);
    return publicUrl;
  };

  const brand = { ...draft.brand, logoUrl: await portable(draft.brand.logoUrl, "logo"), faviconUrl: await portable(draft.brand.faviconUrl, "favicon") };
  const site = {
    ...draft.site,
    heroImageUrl: await portable(draft.site.heroImageUrl, "hero"),
    gallery: await Promise.all(draft.site.gallery.map((url, index) => portable(url, `gallery-${String(index + 1).padStart(2, "0")}`))),
  };
  const seo = { ...draft.seo, ogImageUrl: await portable(draft.seo.ogImageUrl, "social-share") };
  const files = generateDeployableProjectFiles(normalizeWebsiteDraft({ ...draft, brand, site, seo }));
  Object.assign(files, binaries);
  return files;
}
export async function downloadProjectZip(raw: WebsiteStudioDraft) {
  const draft = ready(raw);
  const files = await generateDeployableProjectBundle(draft);
  const blob = createZipBlob(files, draft.slug || "website");
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${draft.slug || "website"}-source.zip`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 2500);
  return { files: Object.keys(files), bytes: blob.size };
}
