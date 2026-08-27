import fs from "node:fs";
import path from "node:path";
import { startupOsProviders } from "../src/lib/startup-os-foundation";

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");
const required = [
  "src/routes/app/startup-os.tsx",
  "src/routes/app/integrations.tsx",
  "src/lib/startup-os-foundation.ts",
  "src/startup-os.css",
  "supabase/migrations/20260827090000_startup_os_phase0_foundation.sql",
  "supabase/functions/startup-os-provider-connect/index.ts",
  "docs/PHASE0_IMPLEMENTATION_SPEC.md",
];

for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) throw new Error(`Phase 0 required file missing: ${file}`);
}

const publicCompany = `${read("src/routes/company.tsx")}\n${read("src/routes/index.tsx")}`;
const forbiddenPublicPatterns: Array<[RegExp, string]> = [
  [/24\s+August\s+2026/i, "company registration date"],
  [/23[-\s]+August[-\s]+2026/i, "certificate issue date"],
  [/22[-\s]+August[-\s]+2027/i, "certificate expiry date"],
  [/certificate\s+expir(?:y|es|ation)\s*:/i, "certificate expiry label"],
  [/effective\s+24\s+August\s+2026/i, "registration effective date"],
  [/taxpayer\s+(?:reference|ref)\s*(?:number|no\.?|:)\s*\d+/i, "taxpayer reference number"],
];
for (const [pattern, label] of forbiddenPublicPatterns) {
  if (pattern.test(publicCompany)) throw new Error(`Public verification copy exposes forbidden ${label}`);
}

if (!/2026\/672029\/07/.test(publicCompany)) throw new Error("Public company registration number is missing");
if (!/B-BBEE Level 1 Contributor/i.test(publicCompany)) throw new Error("Public B-BBEE Level 1 status is missing");
if (!/135% procurement recognition/i.test(publicCompany)) throw new Error("Public procurement recognition status is missing");

for (const provider of startupOsProviders) {
  if (provider.steps.length !== 3) throw new Error(`${provider.name} must have exactly three beginner setup steps`);
  if (!provider.setupUrl.startsWith("https://")) throw new Error(`${provider.name} setup link must use HTTPS`);
  if (!provider.docsUrl.startsWith("https://")) throw new Error(`${provider.name} documentation link must use HTTPS`);
  if (!provider.cost.trim()) throw new Error(`${provider.name} must explain cost/quota implications`);
  if (/service[-_ ]?role/i.test(`${provider.credentialLabel} ${provider.credentialPlaceholder}`)) {
    throw new Error(`${provider.name} asks a normal user for a service-role credential`);
  }
}

const sql = read("supabase/migrations/20260827090000_startup_os_phase0_foundation.sql");
if (/create\s+type\s+if\s+not\s+exists/i.test(sql)) throw new Error("Phase 0 migration contains unsupported CREATE TYPE IF NOT EXISTS syntax");
if (!/audit_workspace_change/i.test(sql)) throw new Error("Phase 0 migration must install workspace audit logging");
if (!/company-vault/.test(sql)) throw new Error("Phase 0 migration must create the private company vault");
if (!/startup_os_provider_credentials/.test(sql)) throw new Error("Phase 0 migration must include server-side provider credential storage");
if (/grant\s+(?:select|all|insert|update|delete)[\s\S]{0,120}startup_os_provider_credentials[\s\S]{0,120}to\s+authenticated/i.test(sql)) {
  throw new Error("Encrypted provider credentials must not be granted to authenticated browser clients");
}
const issuedPrivate = /comment\s+on\s+column\s+public\.company_verification_records\.issued_at\s+is\s+'[^']*Never publish directly\.'/i.test(sql);
const expiryPrivate = /comment\s+on\s+column\s+public\.company_verification_records\.expires_at\s+is\s+'[^']*Never publish directly\.'/i.test(sql);
if (!issuedPrivate || !expiryPrivate) {
  throw new Error("Verification date fields must be explicitly documented as private-only metadata");
}

const connector = read("supabase/functions/startup-os-provider-connect/index.ts");
if (!/AES-GCM/.test(connector)) throw new Error("Provider connector must encrypt stored credentials");
if (!/workspace_audit_log/.test(connector)) throw new Error("Provider connector must write integration audit events");
if (!/google_places/.test(connector) || !/semrush/.test(connector)) throw new Error("Company Intelligence provider hooks must remain available");
if (!/deferredVerification/.test(connector)) throw new Error("Billable provider validation must support deferred verification");

console.log(`Startup OS Phase 0 release contract passed: ${startupOsProviders.length} integrations, private verification dates, RLS/audit/secret controls present.`);
