import fs from "node:fs";

const path = "src/lib/website-studio-project-export-v6.ts";
let source = fs.readFileSync(path, "utf8");
const beforeImport = `import {\n  createZipBlob,\n  generateDeployableProjectBundle as generateV5Bundle,\n  generateDeployableProjectFiles as generateV5Files,\n  type WebsiteStudioAssetLoader,\n} from "./website-studio-project-export-v4";`;
const afterImport = `import {\n  generateDeployableProjectBundle as generateV5Bundle,\n  generateDeployableProjectFiles as generateV5Files,\n  type WebsiteStudioAssetLoader,\n} from "./website-studio-project-export-v4";`;
if (!source.includes(beforeImport)) throw new Error("V6 export import block not found");
source = source.replace(beforeImport, afterImport);
const beforeType = 'import type { GeneratedProjectFiles } from "./website-studio-project-export";';
const afterType = 'import { createZipBlob, type GeneratedProjectFiles } from "./website-studio-project-export";';
if (!source.includes(beforeType)) throw new Error("GeneratedProjectFiles import not found");
source = source.replace(beforeType, afterType);
fs.writeFileSync(path, source);
console.log("Corrected createZipBlob import in Website Studio V6 exporter.");
