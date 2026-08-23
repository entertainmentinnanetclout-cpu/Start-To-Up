import { normalizeWebsiteDraft, type WebsiteStudioDraft } from "./website-studio";
import { createZipBlob, generateDeployableProjectFiles as generateLegacyFiles, type GeneratedProjectFiles } from "./website-studio-project-export";
import { getStructuralFamily, renderStructuralBody, structuralCss, structuralFamilyLabels } from "./website-studio-structural";

const q = (value: unknown) => JSON.stringify(value);

function generatedApp(draft: WebsiteStudioDraft) {
  const family = getStructuralFamily(draft);
  return `import "./styles.css";\nimport { StructuralFamilyPage } from "./components/StructuralFamilyPage";\n\nexport default function App() {\n  return <div className="site family-root family-${family}"><StructuralFamilyPage /></div>;\n}\n`;
}

function structuralComponent(draft: WebsiteStudioDraft) {
  const family = getStructuralFamily(draft);
  const body = renderStructuralBody(draft);
  const brand = draft.brand.logoUrl
    ? `<img src="${draft.brand.logoUrl.replaceAll('"', '&quot;')}" alt="${draft.businessName.replaceAll('"', '&quot;')}"/>`
    : `<strong>${(draft.brand.logoText || draft.businessName).replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</strong>`;
  const announcement = draft.site.showAnnouncement ? `<div class="announcement">${draft.site.announcement.replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</div>` : "";
  const shell = `${announcement}<header class="family-nav"><div class="shell"><a class="logo" href="#top">${brand}</a><nav><a href="#explore">Explore</a><a href="#primary-action">Contact</a></nav><a class="button primary" href="#primary-action">${draft.site.primaryCta.replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</a></div></header><main id="top">${body}</main><footer><div class="shell"><strong>${draft.businessName.replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</strong><span>Built with Start To Up Website Studio · ${structuralFamilyLabels[family]}</span></div></footer>`;
  return `export const structuralFamily = ${q(family)} as const;\nexport const structuralFamilyLabel = ${q(structuralFamilyLabels[family])};\n\nexport function StructuralFamilyPage() {\n  return <div dangerouslySetInnerHTML={{ __html: ${q(shell)} }} />;\n}\n`;
}

function familyReadme(draft: WebsiteStudioDraft) {
  const family = getStructuralFamily(draft);
  return `# Structural website family\n\nThis project was generated from the **${structuralFamilyLabels[family]}** Website Studio family.\n\nUnlike a visual preset, this family changes the semantic page architecture, section order and conversion flow.\n\n## Edit points\n- \`src/components/StructuralFamilyPage.tsx\` — family-specific markup\n- \`src/styles.css\` — responsive family styling\n- \`src/site-config.ts\` — complete Website Studio blueprint\n- \`app/site.json\` — portable source configuration\n\nThe project remains a normal Vite + React + TypeScript application and can be committed to GitHub or imported into Vercel without code changes.\n`;
}

export function generateDeployableProjectFiles(raw: WebsiteStudioDraft): GeneratedProjectFiles {
  const draft = normalizeWebsiteDraft(raw);
  const files = generateLegacyFiles(draft);
  files["src/App.tsx"] = generatedApp(draft);
  files["src/components/StructuralFamilyPage.tsx"] = structuralComponent(draft);
  files["src/styles.css"] = structuralCss(draft);
  files["app/STRUCTURAL_FAMILY.md"] = familyReadme(draft);
  files["app/structural-family.json"] = JSON.stringify({
    templateKey: String(draft.templateKey),
    family: getStructuralFamily(draft),
    familyLabel: structuralFamilyLabels[getStructuralFamily(draft)],
  }, null, 2);
  return files;
}

export function downloadProjectZip(raw: WebsiteStudioDraft) {
  const draft = normalizeWebsiteDraft(raw);
  const files = generateDeployableProjectFiles(draft);
  const blob = createZipBlob(files, draft.slug || "website");
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${draft.slug || "website"}-source.zip`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 2500);
  return { files: Object.keys(files), bytes: blob.size };
}
