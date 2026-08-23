import { normalizeWebsiteDraft, type WebsiteStudioDraft } from "./website-studio";
import { createZipBlob, generateDeployableProjectFiles as generateLegacyFiles, type GeneratedProjectFiles } from "./website-studio-project-export";
import { getStructuralFamily, structuralFamilyLabels } from "./website-studio-structural";
import { hasVisualContract, renderWebsiteStudioShell, websiteStudioCss } from "./website-studio-visual-contracts";

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

export function generateDeployableProjectFiles(raw: WebsiteStudioDraft): GeneratedProjectFiles {
  const draft = normalizeWebsiteDraft(raw);
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
