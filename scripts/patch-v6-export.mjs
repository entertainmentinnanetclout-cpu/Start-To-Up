import fs from "node:fs";

const path = "src/lib/website-studio-project-export-v6.ts";
let source = fs.readFileSync(path, "utf8");
const replacements = [
  [
    '  const deviceClass = ["v6-section", `v6-${section.type}`].join(" ");',
    '  const deviceClass = ["v6-section", "v6-" + section.type].join(" ");',
  ],
  [
    '<h3>{index===2?"Custom":`R${[499,1499][index] || 0}`}</h3>',
    '<h3>{index===2?"Custom":"R"+([499,1499][index] || 0)}</h3>',
  ],
];

let changed = false;
for (const [before, after] of replacements) {
  if (source.includes(before)) {
    source = source.replaceAll(before, after);
    changed = true;
  }
}
if (!changed) throw new Error("Expected V6 export template-literal hazards were not found.");
fs.writeFileSync(path, source);
console.log("Patched nested template literals in Website Studio V6 export source.");
