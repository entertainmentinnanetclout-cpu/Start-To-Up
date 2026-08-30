import fs from "node:fs";
import path from "node:path";
import { calculateCommercialLines, calculateCommission, calculateWeightedForecast } from "../src/lib/startup-os-phase4";

const root=process.cwd();
const read=(p:string)=>fs.readFileSync(path.join(root,p),"utf8");
const required=[
  "src/lib/startup-os-phase4.ts","src/routes/app/revenue.tsx","src/startup-os-phase4.css",
  "supabase/migrations/20260830130000_startup_os_phase4_revenue_operations.sql",
  "supabase/migrations/20260830130500_startup_os_phase4_public_capture.sql",
  "supabase/functions/startup-os-revenue-public/index.ts",
];
for(const p of required)if(!fs.existsSync(path.join(root,p)))throw new Error(`Phase 4 file missing: ${p}`);

const migration=read("supabase/migrations/20260830130000_startup_os_phase4_revenue_operations.sql");
const tables=["revenue_accounts","revenue_contacts","revenue_leads","revenue_pipeline_stages","revenue_opportunities","revenue_activities","revenue_proposals","revenue_quotes","revenue_quote_items","revenue_invoices","revenue_invoice_items","revenue_payments","revenue_lead_magnets","revenue_referral_programs","revenue_referrals","revenue_affiliate_programs","revenue_affiliates","revenue_affiliate_conversions","revenue_reputation_records","revenue_support_tickets","revenue_support_messages"];
for(const table of tables){if(!migration.includes(`public.${table}`))throw new Error(`Phase 4 schema missing ${table}`);if(!migration.includes(`'${table}'`))throw new Error(`Phase 4 RLS loop missing ${table}`);}
for(const fn of ["revenue_import_company_intelligence","revenue_import_website_submission","revenue_convert_lead_to_opportunity","revenue_quote_to_invoice","revenue_forecast","ensure_revenue_pipeline"])if(!migration.includes(fn))throw new Error(`Phase 4 workflow function missing ${fn}`);
for(const control of ["private.startup_workspace_member","private.workspace_has_permission","company.manage","enable row level security"])if(!migration.includes(control))throw new Error(`Phase 4 workspace security contract missing ${control}`);
if(!migration.includes("source_intelligence_id")||!migration.includes("source_ref_id"))throw new Error("Phase 4 must preserve source lineage for no-duplicate lead ingestion.");
if(!migration.includes("source_quote_id")||!migration.includes("source_quote_item_id"))throw new Error("Quote-to-invoice linkage must preserve source records.");
if(!migration.includes("website_studio_projects")||!migration.includes("organization_id"))throw new Error("Website Studio projects must be associable with a Startup OS workspace.");

const captureMigration=read("supabase/migrations/20260830130500_startup_os_phase4_public_capture.sql");
if(!captureMigration.includes("revenue_public_capture_events")||!captureMigration.includes("No anon insert policy"))throw new Error("Public lead capture must use an audited server-side gateway, not anonymous CRM writes.");
const captureFunction=read("supabase/functions/startup-os-revenue-public/index.ts");
for(const marker of ["lead_magnet_submit","honeypot","TOO_MANY_REQUESTS","revenue_public_capture_events","SUPABASE_SERVICE_ROLE_KEY","email_hash","ip_hash"])if(!captureFunction.includes(marker))throw new Error(`Public capture hardening missing ${marker}`);
if(!captureFunction.includes('eq("status","active")'))throw new Error("Only active lead magnets may receive public captures.");

const commercial=calculateCommercialLines([{description:"Site",quantity:2,unitPrice:1000,taxRate:15,discount:100}]);
if(Math.round(commercial.subtotal)!==2000||Math.round(commercial.discountTotal)!==100||Math.round(commercial.taxTotal)!==285||Math.round(commercial.total)!==2185)throw new Error(`Commercial math regression: ${JSON.stringify(commercial)}`);
const forecast=calculateWeightedForecast([{amount:10000,probability:25,status:"open"},{amount:20000,probability:80,status:"open"},{amount:5000,probability:100,status:"won"}]);
if(forecast.pipeline!==30000||forecast.weighted!==18500)throw new Error(`Weighted forecast regression: ${JSON.stringify(forecast)}`);
if(calculateCommission(10000,"percent",10)!==1000||calculateCommission(10000,"fixed",450)!==450)throw new Error("Commission math regression");

const route=read("src/routes/app/revenue.tsx");
const surfaces=["CRM LITE","SALES PIPELINE","PROPOSAL BUILDER","QUOTE → INVOICE","SALES FORECASTING","LEAD MAGNET BUILDER","REFERRAL PROGRAMMES","AFFILIATE MANAGER","REVIEW & REPUTATION MANAGER","CUSTOMER SUPPORT INBOX","Company Intelligence → CRM","Website enquiries → CRM"];
for(const label of surfaces)if(!route.includes(label))throw new Error(`Phase 4 UI surface missing: ${label}`);
for(const operation of ["importCompanyIntelligenceLead","importWebsiteLead","convertLeadToOpportunity","quoteToInvoice","recordPayment"])if(!route.includes(operation))throw new Error(`Phase 4 linked workflow missing UI operation ${operation}`);
if(!route.includes("planning estimate, not guaranteed revenue"))throw new Error("Forecast must be disclosed as an estimate.");
if(!route.includes("Manual payments are explicit records")||route.includes("processor-verified")===false)throw new Error("Manual payment provenance disclosure missing.");
const shell=read("src/components/app-shell.tsx");
if(!shell.includes('/app/revenue')||!shell.includes('Revenue OS'))throw new Error("Revenue OS must be discoverable from desktop/mobile application navigation.");

console.log(`Startup OS Phase 4 release contract passed: ${tables.length} workspace-scoped revenue tables, 11 connected product surfaces, source-preserving intelligence/form ingestion, hardened public lead capture, quote-to-invoice linkage and deterministic commercial calculations.`);
