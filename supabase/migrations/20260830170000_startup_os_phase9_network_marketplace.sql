-- Start To Up — Startup OS Phase 9: Network, Partnerships & Opportunity Marketplace.
-- Workspace-scoped ecosystem records with explicit evidence and structured handoffs.

create table if not exists public.ecosystem_profiles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  profile_type text not null default 'startup' check (profile_type in ('startup','investor','institution','supplier','service_provider','developer','creator','other')),
  display_name text not null,
  industry text,
  stage text,
  geography text,
  bio text,
  capabilities text[] not null default '{}',
  needs text[] not null default '{}',
  availability text not null default 'open' check (availability in ('open','limited','closed')),
  budget_status text,
  is_discoverable boolean not null default false,
  verification_score integer not null default 0 check (verification_score between 0 and 100),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(organization_id)
);

create table if not exists public.ecosystem_opportunities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  opportunity_type text not null check (opportunity_type in ('partnership','supplier','pilot','tender','funding','programme','wil','contract','collaboration','other')),
  title text not null,
  description text,
  industry text,
  stage text,
  geography text,
  capabilities_needed text[] not null default '{}',
  budget_min numeric check (budget_min is null or budget_min >= 0),
  budget_max numeric check (budget_max is null or budget_max >= 0),
  currency text not null default 'ZAR',
  closes_at timestamptz,
  source_url text,
  evidence_confidence text not null default 'owner_entered' check (evidence_confidence in ('owner_entered','observed','estimated','verified')),
  visibility text not null default 'network' check (visibility in ('private','network','public')),
  status text not null default 'open' check (status in ('draft','open','paused','closed','awarded','cancelled')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ecosystem_saved_opportunities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  opportunity_id uuid not null references public.ecosystem_opportunities(id) on delete cascade,
  saved_by uuid references auth.users(id) on delete set null,
  status text not null default 'saved' check (status in ('saved','reviewing','applying','won','lost','archived')),
  notes text,
  created_at timestamptz not null default now(),
  unique(organization_id,opportunity_id)
);

create table if not exists public.ecosystem_opportunity_applications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  opportunity_id uuid not null references public.ecosystem_opportunities(id) on delete cascade,
  applicant_profile_id uuid references public.ecosystem_profiles(id) on delete set null,
  pitch text,
  evidence jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft','submitted','reviewing','shortlisted','accepted','rejected','withdrawn')),
  submitted_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(organization_id,opportunity_id)
);

create table if not exists public.ecosystem_matches (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  target_organization_id uuid references public.organizations(id) on delete cascade,
  opportunity_id uuid references public.ecosystem_opportunities(id) on delete cascade,
  match_type text not null default 'partner' check (match_type in ('partner','supplier','investor','developer','institution','pilot','programme','opportunity')),
  match_score integer not null check (match_score between 0 and 100),
  reasons jsonb not null default '[]'::jsonb,
  evidence_confidence text not null default 'estimated' check (evidence_confidence in ('owner_entered','observed','estimated','verified')),
  status text not null default 'suggested' check (status in ('suggested','saved','contacted','accepted','declined','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ecosystem_partnerships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  partner_organization_id uuid references public.organizations(id) on delete set null,
  opportunity_id uuid references public.ecosystem_opportunities(id) on delete set null,
  title text not null,
  objective text,
  scope text,
  owner_id uuid references auth.users(id) on delete set null,
  status text not null default 'proposed' check (status in ('proposed','negotiating','active','paused','completed','terminated')),
  start_date date,
  review_date date,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ecosystem_programs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  provider_name text,
  program_type text not null default 'accelerator' check (program_type in ('accelerator','incubator','grant','competition','enterprise_development','supplier_development','wil','training','pilot','other')),
  description text,
  eligibility text,
  geography text,
  source_url text,
  opens_at timestamptz,
  closes_at timestamptz,
  evidence_confidence text not null default 'owner_entered' check (evidence_confidence in ('owner_entered','observed','estimated','verified')),
  status text not null default 'open' check (status in ('draft','open','closed','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ecosystem_program_applications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  program_id uuid not null references public.ecosystem_programs(id) on delete cascade,
  status text not null default 'planning' check (status in ('planning','submitted','reviewing','accepted','rejected','withdrawn')),
  notes text,
  submitted_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(organization_id,program_id)
);

create table if not exists public.ecosystem_supplier_profiles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  categories text[] not null default '{}',
  service_regions text[] not null default '{}',
  capacity_notes text,
  minimum_contract_value numeric check (minimum_contract_value is null or minimum_contract_value >= 0),
  verified_document_count integer not null default 0 check (verified_document_count >= 0),
  readiness_score integer not null default 0 check (readiness_score between 0 and 100),
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(organization_id)
);

create table if not exists public.ecosystem_pilot_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  problem_statement text not null,
  desired_outcome text,
  industry text,
  geography text,
  budget numeric check (budget is null or budget >= 0),
  currency text not null default 'ZAR',
  status text not null default 'open' check (status in ('draft','open','matching','active','completed','cancelled')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ecosystem_handoffs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  opportunity_id uuid references public.ecosystem_opportunities(id) on delete set null,
  match_id uuid references public.ecosystem_matches(id) on delete set null,
  target_type text not null check (target_type in ('crm','collaboration','project','task','website_studio')),
  target_path text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'created' check (status in ('created','opened','completed','cancelled')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists ecosystem_opportunities_discovery_idx on public.ecosystem_opportunities(status,visibility,opportunity_type,industry,created_at desc);
create index if not exists ecosystem_matches_org_idx on public.ecosystem_matches(organization_id,status,match_score desc);
create index if not exists ecosystem_applications_org_idx on public.ecosystem_opportunity_applications(organization_id,status,updated_at desc);
create index if not exists ecosystem_partnerships_org_idx on public.ecosystem_partnerships(organization_id,status,updated_at desc);
create index if not exists ecosystem_handoffs_org_idx on public.ecosystem_handoffs(organization_id,created_at desc);

create or replace function public.ecosystem_profile_match_score(source_profile public.ecosystem_profiles,target_profile public.ecosystem_profiles)
returns integer language sql immutable set search_path='' as $$
  select least(100,greatest(0,
    (case when source_profile.industry is not null and source_profile.industry=target_profile.industry then 25 else 0 end)+
    (case when source_profile.geography is not null and source_profile.geography=target_profile.geography then 15 else 0 end)+
    (case when source_profile.stage is not null and source_profile.stage=target_profile.stage then 10 else 0 end)+
    least(30,cardinality(array(select unnest(coalesce(source_profile.needs,'{}'::text[])) intersect select unnest(coalesce(target_profile.capabilities,'{}'::text[]))))*10)+
    least(20,target_profile.verification_score/5)
  ))::integer;
$$;

create or replace function public.ecosystem_create_handoff(org_id uuid,opportunity_uuid uuid,target_kind text)
returns uuid language plpgsql security definer set search_path='' as $$
declare result_id uuid; target text; payload_value jsonb;
begin
  if not private.startup_workspace_member(org_id,(select auth.uid())) then raise exception 'workspace access required'; end if;
  if not private.workspace_has_permission(org_id,(select auth.uid()),'company.manage') then raise exception 'manage permission required'; end if;
  if target_kind not in ('crm','collaboration','project','task','website_studio') then raise exception 'invalid target'; end if;
  target := case target_kind when 'crm' then '/app/revenue' when 'collaboration' then '/app/collaboration' when 'project' then '/app/create' when 'task' then '/app/operations' else '/app/website-studio-v6' end;
  select jsonb_build_object('opportunityId',o.id,'title',o.title,'type',o.opportunity_type,'sourceOrganizationId',o.organization_id,'sourceUrl',o.source_url)
    into payload_value from public.ecosystem_opportunities o where o.id=opportunity_uuid;
  if payload_value is null then raise exception 'opportunity not found'; end if;
  insert into public.ecosystem_handoffs(organization_id,opportunity_id,target_type,target_path,payload,created_by)
    values(org_id,opportunity_uuid,target_kind,target,payload_value,(select auth.uid())) returning id into result_id;
  return result_id;
end $$;

grant execute on function public.ecosystem_create_handoff(uuid,uuid,text) to authenticated;

-- Workspace RLS. Public/network discovery uses a separate read policy on opportunities/profiles/programs only.
do $$ declare t text; begin
  foreach t in array array['ecosystem_profiles','ecosystem_opportunities','ecosystem_saved_opportunities','ecosystem_opportunity_applications','ecosystem_matches','ecosystem_partnerships','ecosystem_programs','ecosystem_program_applications','ecosystem_supplier_profiles','ecosystem_pilot_requests','ecosystem_handoffs'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('drop policy if exists %I on public.%I',t||'_workspace_select',t);
    execute format('create policy %I on public.%I for select to authenticated using (private.startup_workspace_member(organization_id,(select auth.uid())))',t||'_workspace_select',t);
    execute format('drop policy if exists %I on public.%I',t||'_workspace_manage',t);
    execute format('create policy %I on public.%I for all to authenticated using (private.workspace_has_permission(organization_id,(select auth.uid()),''company.manage'')) with check (private.workspace_has_permission(organization_id,(select auth.uid()),''company.manage''))',t||'_workspace_manage',t);
  end loop;
end $$;

-- Discoverable records can be browsed by authenticated members without exposing private workspace records.
drop policy if exists ecosystem_profiles_discovery on public.ecosystem_profiles;
create policy ecosystem_profiles_discovery on public.ecosystem_profiles for select to authenticated using (is_discoverable=true);
drop policy if exists ecosystem_opportunities_discovery on public.ecosystem_opportunities;
create policy ecosystem_opportunities_discovery on public.ecosystem_opportunities for select to authenticated using (visibility in ('network','public') and status='open');
drop policy if exists ecosystem_programs_discovery on public.ecosystem_programs;
create policy ecosystem_programs_discovery on public.ecosystem_programs for select to authenticated using (status='open');
