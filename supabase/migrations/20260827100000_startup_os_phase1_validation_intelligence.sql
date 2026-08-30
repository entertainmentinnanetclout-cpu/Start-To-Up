-- Startup OS Phase 1 — Validate & Research.
-- Scores must preserve evidence provenance. Estimated signals must never be presented as verified performance.

create table if not exists public.startup_idea_validations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  idea_name text not null check (char_length(idea_name) between 2 and 180),
  problem_statement text not null,
  target_customer text not null,
  input jsonb not null default '{}'::jsonb,
  score integer not null check (score between 0 and 100),
  stage text not null,
  dimensions jsonb not null default '[]'::jsonb,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.startup_market_models (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 180),
  assumptions jsonb not null default '{}'::jsonb,
  tam numeric not null default 0 check (tam >= 0),
  sam numeric not null default 0 check (sam >= 0),
  som numeric not null default 0 check (som >= 0),
  currency text not null default 'ZAR',
  evidence_notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.startup_competitors (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 180),
  website text,
  location text,
  positioning text,
  pricing_notes text,
  strengths text,
  weaknesses text,
  observed_ads boolean,
  ad_evidence_url text,
  seo_score integer check (seo_score is null or seo_score between 0 and 100),
  demand_score integer check (demand_score is null or demand_score between 0 and 100),
  evidence_confidence text not null default 'owner_entered' check (evidence_confidence in ('owner_entered','observed','estimated','verified')),
  source_metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.company_intelligence_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  external_place_id text,
  company_name text not null,
  category text,
  address text,
  location text,
  phone text,
  website text,
  website_status text not null default 'unknown' check (website_status in ('detected','not_detected','unknown','unreachable')),
  rating numeric,
  review_count integer,
  business_status text,
  google_maps_url text,
  seo_score integer check (seo_score is null or seo_score between 0 and 100),
  performance_score integer check (performance_score is null or performance_score between 0 and 100),
  demand_score integer check (demand_score is null or demand_score between 0 and 100),
  reputation_score integer check (reputation_score is null or reputation_score between 0 and 100),
  opportunity_score integer check (opportunity_score is null or opportunity_score between 0 and 100),
  meta_ads_status text not null default 'unknown' check (meta_ads_status in ('active_observed','none_observed','owner_verified','unknown')),
  evidence_confidence text not null default 'observed' check (evidence_confidence in ('owner_entered','observed','estimated','verified')),
  evidence jsonb not null default '{}'::jsonb,
  recommendation jsonb not null default '{}'::jsonb,
  source_provider text,
  source_checked_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, external_place_id)
);

create table if not exists public.company_intelligence_searches (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  query text not null,
  location text,
  filters jsonb not null default '{}'::jsonb,
  provider text not null,
  result_count integer not null default 0,
  billable_request_confirmed boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.company_intelligence_saved_leads (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  intelligence_id uuid not null references public.company_intelligence_records(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'saved' check (status in ('saved','researching','contacted','qualified','not_relevant','converted')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (organization_id,intelligence_id)
);

create table if not exists public.startup_customer_personas (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  segment text,
  demographics text,
  jobs_to_be_done text,
  pain_points text,
  desired_outcomes text,
  buying_triggers text,
  objections text,
  channels text,
  evidence_notes text,
  confidence text not null default 'owner_entered' check (confidence in ('owner_entered','observed','estimated','verified')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.startup_customer_interviews (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  persona_id uuid references public.startup_customer_personas(id) on delete set null,
  participant_label text not null,
  participant_segment text,
  interviewed_at timestamptz not null default now(),
  problem_evidence text,
  current_alternative text,
  urgency_score integer check (urgency_score is null or urgency_score between 0 and 100),
  willingness_to_pay text,
  quotes text,
  insights text,
  next_questions text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.startup_validation_surveys (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  purpose text,
  status text not null default 'draft' check (status in ('draft','published','closed')),
  public_token uuid not null default gen_random_uuid() unique,
  response_count integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.startup_survey_questions (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references public.startup_validation_surveys(id) on delete cascade,
  position integer not null default 0,
  question text not null,
  question_type text not null default 'text' check (question_type in ('text','long_text','number','single_choice','multi_choice','rating','yes_no')),
  required boolean not null default false,
  options jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.startup_survey_responses (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references public.startup_validation_surveys(id) on delete cascade,
  answers jsonb not null default '{}'::jsonb,
  respondent_hash text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.startup_brand_checks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  proposed_name text not null,
  domain text,
  domain_signal text not null default 'unchecked' check (domain_signal in ('unchecked','dns_detected','no_dns_detected','error')),
  company_registry_status text not null default 'not_checked',
  trademark_status text not null default 'not_checked',
  social_status jsonb not null default '{}'::jsonb,
  notes text,
  disclaimer text not null default 'Automated checks are signals only and do not establish company-name, domain or trademark availability.',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.startup_health_assessments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  inputs jsonb not null default '{}'::jsonb,
  score integer not null check (score between 0 and 100),
  next_actions jsonb not null default '[]'::jsonb,
  evidence_notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists startup_ideas_org_idx on public.startup_idea_validations(organization_id,created_at desc);
create index if not exists startup_market_org_idx on public.startup_market_models(organization_id,created_at desc);
create index if not exists startup_competitors_org_idx on public.startup_competitors(organization_id,updated_at desc);
create index if not exists company_intel_org_opportunity_idx on public.company_intelligence_records(organization_id,opportunity_score desc nulls last);
create index if not exists company_intel_website_idx on public.company_intelligence_records(organization_id,website_status);
create index if not exists customer_personas_org_idx on public.startup_customer_personas(organization_id,updated_at desc);
create index if not exists customer_interviews_org_idx on public.startup_customer_interviews(organization_id,interviewed_at desc);
create index if not exists surveys_org_idx on public.startup_validation_surveys(organization_id,updated_at desc);
create index if not exists health_org_idx on public.startup_health_assessments(organization_id,created_at desc);

create or replace function private.startup_workspace_member(org_id uuid, check_user uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select check_user is not null and exists (
    select 1 from public.organization_members m
    where m.organization_id=org_id and m.user_id=check_user
  );
$$;
revoke all on function private.startup_workspace_member(uuid,uuid) from public,anon;
grant execute on function private.startup_workspace_member(uuid,uuid) to authenticated,service_role;

-- RLS: members can read. Editors/owners/admins use the Phase 0 permission helper to write.
do $$
declare t text;
begin
  foreach t in array array[
    'startup_idea_validations','startup_market_models','startup_competitors','company_intelligence_records',
    'company_intelligence_searches','company_intelligence_saved_leads','startup_customer_personas',
    'startup_customer_interviews','startup_validation_surveys','startup_brand_checks','startup_health_assessments'
  ] loop
    execute format('alter table public.%I enable row level security',t);
  end loop;
end $$;
alter table public.startup_survey_questions enable row level security;
alter table public.startup_survey_responses enable row level security;

-- Idempotently recreate member/read and validation/write policies.
do $$
declare t text;
begin
  foreach t in array array[
    'startup_idea_validations','startup_market_models','startup_competitors','company_intelligence_records',
    'company_intelligence_searches','company_intelligence_saved_leads','startup_customer_personas',
    'startup_customer_interviews','startup_validation_surveys','startup_brand_checks','startup_health_assessments'
  ] loop
    execute format('drop policy if exists phase1_member_read on public.%I',t);
    execute format('create policy phase1_member_read on public.%I for select to authenticated using (private.startup_workspace_member(organization_id,(select auth.uid())))',t);
    execute format('drop policy if exists phase1_member_insert on public.%I',t);
    execute format('create policy phase1_member_insert on public.%I for insert to authenticated with check (private.workspace_has_permission(organization_id,(select auth.uid()),''company.manage''))',t);
    execute format('drop policy if exists phase1_member_update on public.%I',t);
    execute format('create policy phase1_member_update on public.%I for update to authenticated using (private.workspace_has_permission(organization_id,(select auth.uid()),''company.manage'')) with check (private.workspace_has_permission(organization_id,(select auth.uid()),''company.manage''))',t);
    execute format('drop policy if exists phase1_member_delete on public.%I',t);
    execute format('create policy phase1_member_delete on public.%I for delete to authenticated using (private.workspace_has_permission(organization_id,(select auth.uid()),''company.manage''))',t);
  end loop;
end $$;

-- Survey questions are visible/manageable through the parent survey workspace.
drop policy if exists survey_question_member_read on public.startup_survey_questions;
create policy survey_question_member_read on public.startup_survey_questions for select to authenticated using (
  exists(select 1 from public.startup_validation_surveys s where s.id=survey_id and private.startup_workspace_member(s.organization_id,(select auth.uid())))
);
drop policy if exists survey_question_member_write on public.startup_survey_questions;
create policy survey_question_member_write on public.startup_survey_questions for all to authenticated using (
  exists(select 1 from public.startup_validation_surveys s where s.id=survey_id and private.workspace_has_permission(s.organization_id,(select auth.uid()),'company.manage'))
) with check (
  exists(select 1 from public.startup_validation_surveys s where s.id=survey_id and private.workspace_has_permission(s.organization_id,(select auth.uid()),'company.manage'))
);

-- Responses are private workspace research data; public collection should use a server function/edge endpoint.
drop policy if exists survey_response_member_read on public.startup_survey_responses;
create policy survey_response_member_read on public.startup_survey_responses for select to authenticated using (
  exists(select 1 from public.startup_validation_surveys s where s.id=survey_id and private.startup_workspace_member(s.organization_id,(select auth.uid())))
);

-- Grants remain RLS constrained. Survey responses have no direct anon grants.
grant select,insert,update,delete on public.startup_idea_validations,public.startup_market_models,public.startup_competitors,
  public.company_intelligence_records,public.company_intelligence_searches,public.company_intelligence_saved_leads,
  public.startup_customer_personas,public.startup_customer_interviews,public.startup_validation_surveys,
  public.startup_survey_questions,public.startup_brand_checks,public.startup_health_assessments to authenticated;
grant select on public.startup_survey_responses to authenticated;

insert into public.feature_flags(flag_key,description,enabled_by_default,rollout_percent) values
  ('startup_os.phase1_validation','Idea validation and market sizing tools',true,100),
  ('startup_os.phase1_company_intelligence','Company and competitor intelligence tools',true,100),
  ('startup_os.phase1_customer_research','Personas, interviews and surveys',true,100)
on conflict(flag_key) do update set description=excluded.description,enabled_by_default=excluded.enabled_by_default,rollout_percent=excluded.rollout_percent,updated_at=now();

notify pgrst,'reload schema';
