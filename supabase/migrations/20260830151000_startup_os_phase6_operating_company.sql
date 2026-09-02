-- Start To Up — Startup OS Phase 6: Operations, Teams & Execution.
-- All operational records are workspace-scoped and reuse Phase 0 roles/permissions.

create table if not exists public.ops_okrs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 240),
  description text,
  owner_id uuid references auth.users(id) on delete set null,
  period_label text,
  start_date date,
  end_date date,
  status text not null default 'draft' check (status in ('draft','active','at_risk','completed','cancelled')),
  progress numeric not null default 0 check (progress between 0 and 100),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ops_key_results (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  okr_id uuid not null references public.ops_okrs(id) on delete cascade,
  title text not null,
  metric_name text,
  start_value numeric not null default 0,
  current_value numeric not null default 0,
  target_value numeric not null default 100,
  unit text,
  status text not null default 'active' check (status in ('active','at_risk','completed','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ops_decisions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  context text,
  decision text not null,
  rationale text,
  alternatives text,
  impact text,
  reversible boolean not null default true,
  decided_by uuid references auth.users(id) on delete set null,
  decided_at timestamptz not null default now(),
  review_at timestamptz,
  status text not null default 'active' check (status in ('active','superseded','reversed','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ops_risks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  category text not null default 'operational' check (category in ('operational','financial','legal','security','technology','market','people','reputation','other')),
  description text,
  likelihood integer not null default 3 check (likelihood between 1 and 5),
  impact integer not null default 3 check (impact between 1 and 5),
  risk_score integer generated always as (likelihood * impact) stored,
  mitigation text,
  contingency text,
  owner_id uuid references auth.users(id) on delete set null,
  status text not null default 'open' check (status in ('open','monitoring','mitigated','accepted','closed')),
  review_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ops_hiring_plans (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  role_title text not null,
  department text,
  employment_type text not null default 'full_time' check (employment_type in ('full_time','part_time','contract','internship','freelance','temporary')),
  reason text,
  priority integer not null default 50 check (priority between 0 and 100),
  target_start_date date,
  salary_min numeric check (salary_min is null or salary_min >= 0),
  salary_max numeric check (salary_max is null or salary_max >= 0),
  currency text not null default 'ZAR',
  status text not null default 'planned' check (status in ('planned','approved','recruiting','on_hold','filled','cancelled')),
  approved_by uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ops_job_descriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  hiring_plan_id uuid references public.ops_hiring_plans(id) on delete set null,
  title text not null,
  summary text,
  responsibilities jsonb not null default '[]'::jsonb,
  requirements jsonb not null default '[]'::jsonb,
  nice_to_have jsonb not null default '[]'::jsonb,
  location text,
  work_mode text check (work_mode is null or work_mode in ('onsite','hybrid','remote')),
  status text not null default 'draft' check (status in ('draft','approved','published','archived')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ops_candidates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  job_description_id uuid references public.ops_job_descriptions(id) on delete set null,
  full_name text not null,
  email text,
  phone text,
  source text not null default 'manual',
  stage text not null default 'applied' check (stage in ('applied','screening','interview','assessment','offer','hired','rejected','withdrawn')),
  score integer check (score is null or score between 0 and 100),
  notes text,
  cv_url text,
  assigned_to uuid references auth.users(id) on delete set null,
  consent_status text not null default 'unknown' check (consent_status in ('unknown','consented','withdrawn')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ops_candidate_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  candidate_id uuid not null references public.ops_candidates(id) on delete cascade,
  event_type text not null check (event_type in ('note','screen','interview','assessment','stage_change','offer','email','call')),
  summary text not null,
  scheduled_at timestamptz,
  completed_at timestamptz,
  outcome text,
  actor_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.ops_vendors (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  vendor_type text not null default 'vendor' check (vendor_type in ('vendor','freelancer','contractor','consultant','agency','supplier')),
  contact_name text,
  email text,
  phone text,
  website text,
  service_category text,
  status text not null default 'active' check (status in ('prospect','active','paused','blocked','archived')),
  rating numeric check (rating is null or rating between 0 and 5),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ops_vendor_engagements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  vendor_id uuid not null references public.ops_vendors(id) on delete cascade,
  title text not null,
  scope text,
  amount numeric not null default 0 check (amount >= 0),
  currency text not null default 'ZAR',
  start_date date,
  end_date date,
  status text not null default 'planned' check (status in ('planned','active','completed','cancelled','disputed')),
  contract_url text,
  owner_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ops_meetings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  meeting_type text not null default 'internal' check (meeting_type in ('internal','client','investor','partner','vendor','interview','other')),
  starts_at timestamptz not null,
  duration_minutes integer not null default 30 check (duration_minutes between 5 and 1440),
  location_or_link text,
  agenda text,
  notes text,
  decisions text,
  status text not null default 'scheduled' check (status in ('scheduled','completed','cancelled')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ops_meeting_actions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  meeting_id uuid not null references public.ops_meetings(id) on delete cascade,
  title text not null,
  assignee_id uuid references auth.users(id) on delete set null,
  due_at timestamptz,
  status text not null default 'open' check (status in ('open','in_progress','done','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ops_renewals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  category text not null default 'subscription' check (category in ('domain','subscription','licence','contract','insurance','certificate','registration','tax','compliance','other')),
  due_date date not null,
  recurrence text not null default 'once' check (recurrence in ('once','monthly','quarterly','biannual','annual','custom')),
  reminder_days integer not null default 30 check (reminder_days between 0 and 365),
  amount numeric check (amount is null or amount >= 0),
  currency text not null default 'ZAR',
  owner_id uuid references auth.users(id) on delete set null,
  private_detail jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('active','due','completed','cancelled')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ops_command_snapshots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  snapshot_date date not null default current_date,
  company_health integer not null default 0 check (company_health between 0 and 100),
  revenue_health integer not null default 0 check (revenue_health between 0 and 100),
  growth_health integer not null default 0 check (growth_health between 0 and 100),
  execution_health integer not null default 0 check (execution_health between 0 and 100),
  people_health integer not null default 0 check (people_health between 0 and 100),
  risk_health integer not null default 0 check (risk_health between 0 and 100),
  next_actions jsonb not null default '[]'::jsonb,
  inputs jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(organization_id,snapshot_date)
);

create index if not exists ops_okrs_org_idx on public.ops_okrs(organization_id,status,updated_at desc);
create index if not exists ops_risks_org_idx on public.ops_risks(organization_id,status,risk_score desc);
create index if not exists ops_hiring_org_idx on public.ops_hiring_plans(organization_id,status,priority desc);
create index if not exists ops_candidates_org_idx on public.ops_candidates(organization_id,stage,updated_at desc);
create index if not exists ops_vendors_org_idx on public.ops_vendors(organization_id,status,updated_at desc);
create index if not exists ops_meetings_org_idx on public.ops_meetings(organization_id,starts_at desc);
create index if not exists ops_renewals_org_idx on public.ops_renewals(organization_id,due_date asc);

create or replace function public.ops_command_centre(org_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $$
declare
  open_tasks integer := 0;
  overdue_tasks integer := 0;
  active_okrs integer := 0;
  okr_progress numeric := 0;
  open_risks integer := 0;
  high_risks integer := 0;
  active_campaigns integer := 0;
  pipeline_value numeric := 0;
  weighted_pipeline numeric := 0;
  open_hiring integer := 0;
  upcoming_renewals integer := 0;
  verified_records integer := 0;
  execution_score integer := 0;
  risk_score integer := 0;
  revenue_score integer := 0;
  growth_score integer := 0;
  people_score integer := 0;
  company_score integer := 0;
begin
  if not private.startup_workspace_member(org_id,(select auth.uid())) then
    raise exception 'workspace access required';
  end if;

  select count(*), count(*) filter (where due_at is not null and due_at < now())
    into open_tasks,overdue_tasks
  from public.workspace_tasks where organization_id=org_id and status not in ('done','cancelled');

  select count(*), coalesce(avg(progress),0) into active_okrs,okr_progress
  from public.ops_okrs where organization_id=org_id and status in ('active','at_risk');

  select count(*), count(*) filter (where risk_score >= 15) into open_risks,high_risks
  from public.ops_risks where organization_id=org_id and status in ('open','monitoring');

  select count(*) into active_campaigns from public.growth_campaigns where organization_id=org_id and status='active';
  select coalesce(sum(amount),0),coalesce(sum(amount*probability/100.0),0) into pipeline_value,weighted_pipeline from public.revenue_opportunities where organization_id=org_id and status='open';
  select count(*) into open_hiring from public.ops_hiring_plans where organization_id=org_id and status in ('approved','recruiting');
  select count(*) into upcoming_renewals from public.ops_renewals where organization_id=org_id and status in ('active','due') and due_date <= current_date + 30;
  select count(*) into verified_records from public.company_verification_records where organization_id=org_id and status='verified';

  execution_score := greatest(0,least(100,round(case when active_okrs=0 then 50 else okr_progress end)::int - least(overdue_tasks*5,30)));
  risk_score := greatest(0,least(100,100 - least(high_risks*15 + greatest(open_risks-high_risks,0)*3,100)));
  revenue_score := greatest(0,least(100,case when weighted_pipeline>0 then 75 else case when pipeline_value>0 then 55 else 35 end end));
  growth_score := greatest(0,least(100,case when active_campaigns>0 then 75 else 45 end));
  people_score := greatest(0,least(100,case when open_hiring>0 then 60 else 75 end));
  company_score := round((execution_score*0.25)+(risk_score*0.20)+(revenue_score*0.20)+(growth_score*0.15)+(people_score*0.10)+(least(verified_records*20,100)*0.10))::int;

  return jsonb_build_object(
    'company_health',company_score,'execution_health',execution_score,'risk_health',risk_score,'revenue_health',revenue_score,'growth_health',growth_score,'people_health',people_score,
    'open_tasks',open_tasks,'overdue_tasks',overdue_tasks,'active_okrs',active_okrs,'okr_progress',okr_progress,'open_risks',open_risks,'high_risks',high_risks,
    'active_campaigns',active_campaigns,'pipeline_value',pipeline_value,'weighted_pipeline',weighted_pipeline,'open_hiring',open_hiring,'upcoming_renewals',upcoming_renewals,'verified_records',verified_records
  );
end;
$$;
revoke all on function public.ops_command_centre(uuid) from public,anon;
grant execute on function public.ops_command_centre(uuid) to authenticated,service_role;

create or replace function public.ops_refresh_okrs(org_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare rec record;
begin
  if not private.workspace_has_permission(org_id,(select auth.uid()),'company.manage') then raise exception 'workspace manage permission required'; end if;
  for rec in select o.id from public.ops_okrs o where o.organization_id=org_id loop
    update public.ops_okrs o set progress=coalesce((select avg(case when kr.target_value=kr.start_value then case when kr.current_value>=kr.target_value then 100 else 0 end else greatest(0,least(100,((kr.current_value-kr.start_value)/(kr.target_value-kr.start_value))*100)) end) from public.ops_key_results kr where kr.okr_id=rec.id),0), updated_at=now() where o.id=rec.id;
  end loop;
end;$$;
revoke all on function public.ops_refresh_okrs(uuid) from public,anon;
grant execute on function public.ops_refresh_okrs(uuid) to authenticated,service_role;

create or replace function public.ops_touch_updated_at() returns trigger language plpgsql as $$begin new.updated_at=now(); return new; end;$$;

do $$ declare t text; begin
  foreach t in array array['ops_okrs','ops_key_results','ops_decisions','ops_risks','ops_hiring_plans','ops_job_descriptions','ops_candidates','ops_vendors','ops_vendor_engagements','ops_meetings','ops_meeting_actions','ops_renewals'] loop
    execute format('drop trigger if exists %I_touch on public.%I',t,t);
    execute format('create trigger %I_touch before update on public.%I for each row execute function public.ops_touch_updated_at()',t,t);
  end loop;
end $$;

do $$ declare t text; begin
  foreach t in array array['ops_okrs','ops_key_results','ops_decisions','ops_risks','ops_hiring_plans','ops_job_descriptions','ops_candidates','ops_candidate_events','ops_vendors','ops_vendor_engagements','ops_meetings','ops_meeting_actions','ops_renewals','ops_command_snapshots'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('drop policy if exists ops_member_read on public.%I',t);
    execute format('create policy ops_member_read on public.%I for select to authenticated using (private.startup_workspace_member(organization_id,(select auth.uid())))',t);
    execute format('drop policy if exists ops_manager_insert on public.%I',t);
    execute format('create policy ops_manager_insert on public.%I for insert to authenticated with check (private.workspace_has_permission(organization_id,(select auth.uid()),''company.manage''))',t);
    execute format('drop policy if exists ops_manager_update on public.%I',t);
    execute format('create policy ops_manager_update on public.%I for update to authenticated using (private.workspace_has_permission(organization_id,(select auth.uid()),''company.manage'')) with check (private.workspace_has_permission(organization_id,(select auth.uid()),''company.manage''))',t);
    execute format('drop policy if exists ops_manager_delete on public.%I',t);
    execute format('create policy ops_manager_delete on public.%I for delete to authenticated using (private.workspace_has_permission(organization_id,(select auth.uid()),''company.manage''))',t);
  end loop;
end $$;
