import fs from "node:fs";
import path from "node:path";
import { calculateMarketSize, calculateStartupHealth, scoreIdeaValidation } from "../src/lib/startup-os-phase1";

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");
const required = [
  "src/routes/app/validate.tsx",
  "src/lib/startup-os-phase1.ts",
  "src/startup-os-phase1.css",
  "supabase/migrations/20260827100000_startup_os_phase1_validation_intelligence.sql",
  "supabase/functions/startup-os-company-intelligence/index.ts",
  "docs/PHASE1_IMPLEMENTATION_SPEC.md",
];
for (const file of required) if (!fs.existsSync(path.join(root, file))) throw new Error(`Phase 1 required file missing: ${file}`);

const idea = scoreIdeaValidation({
  ideaName: "Verification test",
  problem: "A specific painful business problem",
  customer: "A defined business customer",
  urgency: 80,
  evidenceCount: 10,
  payingSignals: 5,
  competitorKnowledge: 70,
  differentiation: 65,
  monetisationClarity: 75,
  executionReadiness: 60,
});
if (idea.score < 0 || idea.score > 100) throw new Error("Idea Validator score escaped 0–100");
if (idea.dimensions.length !== 7) throw new Error("Idea Validator must retain all seven evidence dimensions");
if (!idea.dimensions.every((item) => item.evidence.trim())) throw new Error("Idea Validator dimensions must retain evidence descriptions");

const market = calculateMarketSize({ totalCustomers: 1000, annualSpendPerCustomer: 1200, serviceablePercent: 25, obtainablePercent: 10, currency: "ZAR" });
if (market.tam !== 1_200_000 || market.sam !== 300_000 || market.som !== 30_000) throw new Error(`TAM/SAM/SOM formula regression: ${JSON.stringify(market)}`);

const health = calculateStartupHealth({ validation: 100, product: 100, finance: 100, sales: 100, digital: 100, compliance: 100, team: 100 });
if (health.score !== 100) throw new Error("Startup Health full-score baseline must equal 100");
if (health.next.length !== 3) throw new Error("Startup Health must return three next-priority dimensions");

const sql = read("supabase/migrations/20260827100000_startup_os_phase1_validation_intelligence.sql");
const tables = [
  "startup_idea_validations","startup_market_models","startup_competitors","company_intelligence_records",
  "company_intelligence_searches","company_intelligence_saved_leads","startup_customer_personas","startup_customer_interviews",
  "startup_validation_surveys","startup_survey_questions","startup_survey_responses","startup_brand_checks","startup_health_assessments",
];
for (const table of tables) if (!new RegExp(`create table if not exists public\\.${table}\\b`, "i").test(sql)) throw new Error(`Phase 1 table missing: ${table}`);
for (const confidence of ["owner_entered","observed","estimated","verified"]) if (!sql.includes(confidence)) throw new Error(`Evidence confidence state missing: ${confidence}`);
if (/grant\s+(?:all|insert|update|delete)[\s\S]{0,120}startup_survey_responses[\s\S]{0,120}to\s+anon/i.test(sql)) throw new Error("Private survey responses must not be anonymously writable/readable through direct table grants");
if (!/private\.workspace_has_permission/i.test(sql)) throw new Error("Phase 1 writes must reuse Phase 0 workspace permission enforcement");

const edge = read("supabase/functions/startup-os-company-intelligence/index.ts");
if (!/acknowledgeBillable/.test(edge)) throw new Error("Google Places requests must require explicit billable-use acknowledgement");
if (!/acknowledgeUnits/.test(edge)) throw new Error("Semrush requests must require explicit API-unit acknowledgement");
if (!/PRIVATE_TARGET/.test(edge) || !/resolveDns/.test(edge)) throw new Error("Website scanner must retain SSRF/private-network defenses");
if (!/not search volume or revenue/i.test(edge)) throw new Error("Demand proxy must explicitly avoid presenting itself as search volume or revenue");
if (!/not Core Web Vitals/i.test(edge)) throw new Error("Technical performance proxy must explicitly avoid claiming Core Web Vitals");
if (!/evidence_confidence:\s*"observed"/.test(edge)) throw new Error("Public company facts must carry observed evidence confidence");
if (/\broas\b|\bctr\b|\bcpa\b/i.test(edge)) throw new Error("Public Company Intelligence must not fabricate private Meta Ads performance metrics");

const ui = read("src/routes/app/validate.tsx");
if (!/Google Places can be billable/i.test(ui)) throw new Error("Company search UI must warn users about Google Places billing before search");
if (!/No website detected in source record/i.test(ui)) throw new Error("UI must use 'no website detected' rather than claiming a website does not exist");
if (!/not a prediction of success/i.test(ui)) throw new Error("Idea Validator must explain that its score is not a success prediction");
if (!/not a company-name or trademark clearance/i.test(ui)) throw new Error("Brand checker must not imply legal clearance");

const publicCompany = `${read("src/routes/company.tsx")}\n${read("src/routes/index.tsx")}`;
for (const date of [/24\s+August\s+2026/i,/23[-\s]+August[-\s]+2026/i,/22[-\s]+August[-\s]+2027/i]) {
  if (date.test(publicCompany)) throw new Error("Phase 1 regressed the public verification-date privacy rule");
}

console.log(`Startup OS Phase 1 release contract passed: ${tables.length} research tables, deterministic scoring, evidence provenance, billing acknowledgements and scanner safety checks present.`);
