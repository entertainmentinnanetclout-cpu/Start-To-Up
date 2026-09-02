-- Start To Up — Startup OS backend reconciliation, Phases 0–10.
-- This migration is intentionally idempotent. It hardens the source-of-truth backend,
-- registers each module, enforces RLS/no-anonymous-direct-access on Startup OS data,
-- and exposes a service-role health report for deployment verification.

create table if not exists public.startup_os_backend_modules (
  phase integer primary key check (phase between 0 and 10),
  module_key text not null unique,
  label text not null,
  table_prefixes text[] not null default '{}',
  expected_min_tables integer not null default 1 check (expected_min_tables >= 0),
  critical_functions text[] not null default '{}',
  expected_edge_functions text[] not null default '{}',
  release_status text not null default 'implemented' check (release_status in ('planned','implemented','verified','degraded')),
  notes text,
  updated_at timestamptz not null default now()
);

insert into public.startup_os_backend_modules(phase,module_key,label,table_prefixes,expected_min_tables,critical_functions,expected_edge_functions,release_status,notes) values
(0,'foundation','Trust, Identity & Foundation',array['company_','workspace_','startup_os_'],12,array[]::text[],array['startup-os-provider-connect'],'implemented','Auth, workspaces, trust, permissions, integrations and audit primitives.'),
(1,'validation','Validate & Research',array['validation_','company_intelligence_'],8,array[]::text[],array['startup-os-company-intelligence'],'implemented','Evidence-labelled validation and company intelligence.'),
(2,'finance','Business Model & Finance',array['finance_'],12,array['finance_scenario_summary','finance_runway','finance_break_even_units','finance_unit_economics','finance_round_model'],array[]::text[],'implemented','Scenario modelling, pricing, unit economics, expenses, cap table and valuation data.'),
(3,'build','Build, Brand & Launch',array['website_studio_'],18,array['can_view_website_studio_project','can_manage_website_studio_project'],array['website-studio-public-api','website-studio-form-submit','website-studio-deploy-vercel','website-studio-publish-github','website-studio-domain'],'implemented','Website Studio, assets, templates, approvals, exports and publication.'),
(4,'revenue','Sales, CRM & Revenue',array['revenue_'],18,array[]::text[],array['startup-os-revenue-public'],'implemented','CRM, pipeline, proposals, quotes, invoices, payments, referrals and support.'),
(5,'growth','Marketing & Growth',array['growth_'],14,array['growth_attribution_summary','growth_attribute_revenue'],array['startup-os-growth-public'],'implemented','Campaigns, UTM, content, SEO, experiments, KPIs, retention and attribution.'),
(6,'operations','Operations, Teams & Execution',array['ops_'],14,array['ops_command_centre','ops_refresh_okrs'],array[]::text[],'implemented','Command Centre, OKRs, risk, hiring, vendors, meetings and renewals.'),
(7,'legal','Legal, Compliance & Administration',array['legal_'],14,array['legal_compliance_summary','legal_weighted_readiness'],array['startup-os-legal-public'],'implemented','Private documents, contracts, e-sign, compliance, tenders and due diligence.'),
(8,'funding','Funding & Investor Readiness',array['funding_'],12,array[]::text[],array['startup-os-funding-public'],'implemented','Funding finder, investor CRM, readiness, data room, rounds and valuation.'),
(9,'ecosystem','Network, Partnerships & Marketplace',array['ecosystem_'],11,array['ecosystem_create_handoff','ecosystem_profile_match_score'],array[]::text[],'implemented','Directory, marketplace, programmes, matching, pilots and handoffs.'),
(10,'intelligence','Intelligence, Automation & Safe Assistance',array['intelligence_'],8,array[]::text[],array['startup-os-assistant'],'implemented','Audited assistance, next-best actions, reversible changes and automations.')
on conflict(phase) do update set module_key=excluded.module_key,label=excluded.label,table_prefixes=excluded.table_prefixes,expected_min_tables=excluded.expected_min_tables,critical_functions=excluded.critical_functions,expected_edge_functions=excluded.expected_edge_functions,notes=excluded.notes,updated_at=now();

-- Backend deployment/audit records. Only workspace/platform/server workflows should write here.
create table if not exists public.startup_os_backend_audits (
  id uuid primary key default gen_random_uuid(),
  audit_type text not null check (audit_type in ('schema','rls','storage','edge_functions','integrity','full')),
  status text not null check (status in ('passed','warning','failed')),
  environment text not null default 'production',
  commit_sha text,
  report jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.startup_os_backend_modules enable row level security;
alter table public.startup_os_backend_audits enable row level security;
revoke all on public.startup_os_backend_modules from anon, authenticated;
revoke all on public.startup_os_backend_audits from anon, authenticated;
grant select,insert,update,delete on public.startup_os_backend_modules to service_role;
grant select,insert,update,delete on public.startup_os_backend_audits to service_role;

-- All Startup OS business records are private-by-default at the database boundary.
-- Public submission/view flows must go through scoped Edge Functions using tokens/custom checks.
do $$
declare r record;
begin
  for r in
    select n.nspname as schema_name,c.relname as table_name
    from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relkind='r' and (
      c.relname like 'company\_%' escape '\' or
      c.relname like 'workspace\_%' escape '\' or
      c.relname like 'startup\_os\_%' escape '\' or
      c.relname like 'validation\_%' escape '\' or
      c.relname like 'company\_intelligence\_%' escape '\' or
      c.relname like 'finance\_%' escape '\' or
      c.relname like 'revenue\_%' escape '\' or
      c.relname like 'growth\_%' escape '\' or
      c.relname like 'ops\_%' escape '\' or
      c.relname like 'legal\_%' escape '\' or
      c.relname like 'funding\_%' escape '\' or
      c.relname like 'ecosystem\_%' escape '\' or
      c.relname like 'intelligence\_%' escape '\'
    )
  loop
    execute format('alter table %I.%I enable row level security',r.schema_name,r.table_name);
    execute format('revoke all on table %I.%I from anon',r.schema_name,r.table_name);
  end loop;
end $$;

-- Legal documents must remain in a private bucket. Never flip this bucket public.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('legal-documents','legal-documents',false,26214400,array['application/pdf','image/png','image/jpeg','image/webp','text/plain','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

-- Service-role health report. This is deliberately not exposed to browser roles.
create or replace function public.startup_os_backend_health()
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $$
declare
  module_row record;
  prefix text;
  fn text;
  table_count integer;
  rls_count integer;
  missing_functions text[];
  modules jsonb:='[]'::jsonb;
  overall text:='passed';
  module_status text;
begin
  for module_row in select * from public.startup_os_backend_modules order by phase loop
    table_count:=0; rls_count:=0; missing_functions:='{}';
    foreach prefix in array module_row.table_prefixes loop
      table_count:=table_count+(select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and c.relname like prefix||'%');
      rls_count:=rls_count+(select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and c.relrowsecurity and c.relname like prefix||'%');
    end loop;
    foreach fn in array module_row.critical_functions loop
      if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','private') and p.proname=fn) then missing_functions:=array_append(missing_functions,fn); end if;
    end loop;
    module_status:=case when table_count<module_row.expected_min_tables or cardinality(missing_functions)>0 or rls_count<table_count then 'failed' else 'passed' end;
    if module_status='failed' then overall:='failed'; end if;
    modules:=modules||jsonb_build_array(jsonb_build_object('phase',module_row.phase,'module',module_row.module_key,'status',module_status,'tables',table_count,'rlsTables',rls_count,'expectedMinTables',module_row.expected_min_tables,'missingFunctions',to_jsonb(missing_functions),'expectedEdgeFunctions',to_jsonb(module_row.expected_edge_functions)));
  end loop;
  return jsonb_build_object(
    'status',overall,
    'checkedAt',now(),
    'modules',modules,
    'legalDocumentsBucketPrivate',coalesce((select not public from storage.buckets where id='legal-documents'),false),
    'publicDatePrivacyPolicy','registration dates, certificate issue dates and certificate expiry dates are private application data and must not be published'
  );
end $$;

revoke all on function public.startup_os_backend_health() from public,anon,authenticated;
grant execute on function public.startup_os_backend_health() to service_role;

-- Helper for server-side deployment verification/audit persistence.
create or replace function public.startup_os_record_backend_audit(audit_kind text,audit_status text,environment_name text,source_commit text,audit_report jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare result_id uuid;
begin
  if audit_kind not in ('schema','rls','storage','edge_functions','integrity','full') then raise exception 'invalid audit type'; end if;
  if audit_status not in ('passed','warning','failed') then raise exception 'invalid audit status'; end if;
  insert into public.startup_os_backend_audits(audit_type,status,environment,commit_sha,report)
  values(audit_kind,audit_status,coalesce(nullif(environment_name,''),'production'),source_commit,coalesce(audit_report,'{}'::jsonb)) returning id into result_id;
  return result_id;
end $$;
revoke all on function public.startup_os_record_backend_audit(text,text,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.startup_os_record_backend_audit(text,text,text,text,jsonb) to service_role;
