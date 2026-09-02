import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=(p:string)=>fs.readFileSync(path.join(root,p),'utf8');
const exists=(p:string)=>fs.existsSync(path.join(root,p));
const migrationDir=path.join(root,'supabase/migrations');
const migrations=fs.readdirSync(migrationDir).filter(x=>x.endsWith('.sql')).sort();
const versions=new Map<string,string[]>();
for(const file of migrations){const match=file.match(/^(\d{14})_/);if(!match)continue;const rows=versions.get(match[1])||[];rows.push(file);versions.set(match[1],rows);}
const duplicates=[...versions.entries()].filter(([,rows])=>rows.length>1);
if(duplicates.length)throw new Error(`Duplicate Supabase migration versions: ${JSON.stringify(duplicates)}`);

const phaseFiles:Record<number,string[]>={
  0:['20260827090000_startup_os_phase0_foundation.sql','20260827090500_startup_os_phase0_trust_hardening.sql'],
  1:['20260827100000_startup_os_phase1_validation_intelligence.sql','20260827101000_startup_os_phase1_meta_ads_evidence.sql'],
  2:['20260902071000_startup_os_phase2_finance_backend.sql'],
  3:['20260826093000_website_studio_v6_production_suite.sql','20260830113000_website_studio_access_admin_and_commercial_controls.sql','20260830113500_website_studio_approval_enforcement.sql'],
  4:['20260830130000_startup_os_phase4_revenue_operations.sql','20260830130500_startup_os_phase4_public_capture.sql'],
  5:['20260830150000_startup_os_phase5_marketing_growth.sql'],
  6:['20260830151000_startup_os_phase6_operating_company.sql'],
  7:['20260830170000_startup_os_phase7_legal_compliance.sql'],
  8:['20260830180000_startup_os_phase8_funding_investors.sql'],
  9:['20260830183000_startup_os_phase9_network_marketplace.sql'],
  10:['20260830190000_startup_os_phase10_intelligence_automation.sql'],
};
for(const [phase,files] of Object.entries(phaseFiles))for(const file of files)if(!exists(`supabase/migrations/${file}`))throw new Error(`Phase ${phase} migration missing: ${file}`);

const phase2=read('supabase/migrations/20260902071000_startup_os_phase2_finance_backend.sql');
for(const table of ['finance_business_models','finance_lean_canvases','finance_pricing_models','finance_financial_scenarios','finance_assumptions','finance_monthly_projections','finance_expenses','finance_cap_table_entries','finance_financing_instruments','finance_dilution_scenarios','finance_valuation_scenarios','finance_model_snapshots'])if(!phase2.includes(`public.${table}`))throw new Error(`Phase 2 finance table missing: ${table}`);
for(const fn of ['finance_runway','finance_break_even_units','finance_unit_economics','finance_round_model','finance_scenario_summary'])if(!phase2.includes(fn))throw new Error(`Phase 2 finance function missing: ${fn}`);
for(const control of ['private.startup_workspace_member','private.workspace_has_permission','company.manage','enable row level security'])if(!phase2.includes(control))throw new Error(`Phase 2 security control missing: ${control}`);

const phaseSecurity:Record<number,string[]>={0:['enable row level security'],1:['private.startup_workspace_member','enable row level security'],4:['private.startup_workspace_member','private.workspace_has_permission','enable row level security'],5:['private.startup_workspace_member','private.workspace_has_permission','enable row level security'],6:['private.startup_workspace_member','private.workspace_has_permission','enable row level security'],7:['private.startup_workspace_member','private.workspace_has_permission','enable row level security'],8:['private.startup_workspace_member','private.workspace_has_permission','enable row level security'],9:['private.startup_workspace_member','private.workspace_has_permission','enable row level security'],10:['private.startup_workspace_member','private.workspace_has_permission','enable row level security']};
for(const [phase,markers] of Object.entries(phaseSecurity)){const body=phaseFiles[Number(phase)].map(f=>read(`supabase/migrations/${f}`)).join('\n');for(const marker of markers)if(!body.includes(marker))throw new Error(`Phase ${phase} backend security marker missing: ${marker}`);}

const reconcile=read('supabase/migrations/20260902072000_startup_os_backend_reconciliation.sql');
for(let phase=0;phase<=10;phase++)if(!reconcile.includes(`(${phase},`))throw new Error(`Backend registry missing Phase ${phase}`);
for(const marker of ['startup_os_backend_modules','startup_os_backend_audits','startup_os_backend_health','startup_os_record_backend_audit','revoke all on table','from anon','legal-documents'])if(!reconcile.includes(marker))throw new Error(`Backend reconciliation control missing: ${marker}`);
if(!/on conflict\s*\(id\)\s*do update set\s+public\s*=\s*false/i.test(reconcile))throw new Error('Backend reconciliation must force legal-documents bucket private.');

const edgeFunctions=['startup-os-provider-connect','startup-os-company-intelligence','startup-os-revenue-public','startup-os-growth-public','startup-os-legal-public','startup-os-funding-public','startup-os-assistant','website-studio-public-api','website-studio-form-submit','website-studio-deploy-vercel','website-studio-publish-github','website-studio-domain','website-studio-admin-asset-sync'];
for(const fn of edgeFunctions)if(!exists(`supabase/functions/${fn}/index.ts`))throw new Error(`Required Edge Function source missing: ${fn}`);

const walk=(dir:string):string[]=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
const sourceFiles=walk(path.join(root,'src')).filter(f=>/\.(ts|tsx|js|jsx)$/.test(f));
const browserFiles=sourceFiles.filter(f=>!/[\\/]server[\\/]/.test(f)&&!f.includes('.server.'));
for(const file of browserFiles){const body=fs.readFileSync(file,'utf8');if(body.includes('SUPABASE_SERVICE_ROLE_KEY')||body.includes("['service_role']")||body.includes('"service_role"'))throw new Error(`Browser source contains a service-role credential marker: ${path.relative(root,file)}`);}
for(const file of browserFiles){const body=fs.readFileSync(file,'utf8');if(/from\s+['"][^'"]*\.server(?:\.[^'"]*)?['"]/.test(body)||/import\(['"][^'"]*\.server(?:\.[^'"]*)?['"]\)/.test(body))throw new Error(`Browser source imports a server-only module: ${path.relative(root,file)}`);}

const legal=read('supabase/migrations/20260830170000_startup_os_phase7_legal_compliance.sql');
const funding=read('supabase/migrations/20260830180000_startup_os_phase8_funding_investors.sql');
if(!legal.includes('legal-documents')||!/values\s*\(\s*'legal-documents'\s*,\s*'legal-documents'\s*,\s*false/i.test(legal))throw new Error('Legal document bucket must be created private.');
if(!legal.includes('signer_token')||!legal.includes('public_token'))throw new Error('Legal public flows must remain scoped by unguessable tokens.');
if(!funding.includes('public_token'))throw new Error('Investor data-room public gateway token missing.');

// Allow privacy disclosure copy such as “the taxpayer reference number is not published”.
// Reject actual known private dates or number-like taxpayer references in public route source.
const publicFiles=['src/routes/index.tsx','src/routes/company.tsx'].filter(exists);
const forbidden:[RegExp,string][]=[
  [/24\s+August\s+2026/i,'registration date'],
  [/23\s+August\s+2026/i,'certificate issue date'],
  [/22\s+August\s+2027/i,'certificate expiry date'],
  [/taxpayer\s+(?:reference|ref)\s*(?:number|no\.?|:)\s*[:#-]?\s*\d{6,}/i,'taxpayer reference number'],
];
for(const file of publicFiles){const body=read(file);for(const [re,label] of forbidden)if(re.test(body))throw new Error(`Public verification privacy regression in ${file}: ${label}`);}
const publicationPolicy=read('docs/VERIFICATION_PUBLICATION_POLICY.md');
for(const required of ['must **not** publish','registration/effective dates','certificate issue dates','certificate expiry dates','SARS taxpayer reference number'])if(!publicationPolicy.includes(required))throw new Error(`Verification publication policy is missing: ${required}`);

console.log(`Startup OS backend contract passed: ${migrations.length} migrations with unique versions, Phases 0–10 present, Phase 2 finance backend complete, reconciliation/health controls active in source, ${edgeFunctions.length} server gateways present, and browser service-role leakage blocked.`);
