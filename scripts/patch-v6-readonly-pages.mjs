import fs from "node:fs";
const path = "src/lib/website-studio-project-export-v6.ts";
let source = fs.readFileSync(path, "utf8");
const before = 'export function StudioPage({ page, pages }: { page: any; pages: any[] }) {';
const after = 'export function StudioPage({ page, pages }: { page: any; pages: readonly any[] }) {';
if (!source.includes(before)) throw new Error("StudioPage mutable pages signature not found");
source = source.replace(before, after);
fs.writeFileSync(path, source);
console.log("Updated generated StudioPage pages prop to readonly.");
