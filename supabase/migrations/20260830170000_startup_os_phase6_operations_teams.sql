-- Start To Up — Startup OS Phase 6: Operations, Teams & Execution.
-- Command Centre derives from actual workspace records; no static readiness claims.

create table if not exists public.ops_okrs (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null, period text, status text not null default 'active' check(status in ('draft','active','completed','paused','cancelled')),
  owner_id uuid references auth.users(id) on delete set null, description text, start_date date, end_date date,
  created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.ops_key_results (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  okr_id uuid not null references public.ops_okrs(id) on delete cascade, title text not null, start_value numeric not null default 0,
  current_value numeric not null default 0, target_value numeric not null default 100, unit text not null default 'number', weight numeric not null default 1 check(weight>0),
  updated_at timestamptz not null default now()
);
create table if not exists public.ops_decisions (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null, context text, decision text not null, rationale text, alternatives text, impact text,
  status text not null default 'active' check(status in ('active','superseded','reversed')),
  decided_by uuid references auth.users(id) on delete set null, decided_at timestamptz not null default now(), created_at timestamptz not null default now()
);
create table if not exists public.ops_risks (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null, category text not null default 'operational', description text, probability integer not null default 3 check(probability between 1 and 5),
  impact integer not null default 3 check(impact between 1 and 5), risk_score integer generated always as (probability*impact) stored,
  status text not null default 'open' check(status in ('open','mitigating','accepted','closed')),
  mitigation text, contingency text, owner_id uuid references auth.users(id) on delete set null, review_date date,
  created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists ops_risks_org_idx on public.ops_risks(organization_id,status,risk_score desc);

create table if not exists public.ops_hiring_plans (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  role_title text not null, department text, reason text, priority text not null default 'medium' check(priority in ('low','medium','high','critical')),
  employment_type text not null default 'full_time', target_hire_date date, monthly_budget numeric not null default 0 check(monthly_budget>=0), currency text not null default 'ZAR',
  status text not null default 'planned' check(status in ('planned','approved','recruiting','filled','paused','cancelled')),
  created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.ops_job_roles (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  hiring_plan_id uuid references public.ops_hiring_plans(id) on delete set null, title text not null, department text, location text,
  employment_type text not null default 'full_time', summary text, responsibilities jsonb not null default '[]'::jsonb,
  requirements jsonb not null default '[]'::jsonb, scorecard jsonb not null default '[]'::jsonb, salary_min numeric, salary_max numeric, currency text not null default 'ZAR',
  status text not null default 'draft' check(status in ('draft','open','paused','closed')),
  created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.ops_candidates (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  job_role_id uuid references public.ops_job_roles(id) on delete set null, full_name text not null, email text, phone text, source text,
  stage text not null default 'applied' check(stage in ('applied','screening','interview','assessment','offer','hired','rejected','withdrawn')),
  score numeric check(score is null or (score>=0 and score<=100)), notes text, cv_url text,
  created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists ops_candidates_stage_idx on public.ops_candidates(organization_id,job_role_id,stage,updated_at desc);
create table if not exists public.ops_candidate_interviews (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  candidate_id uuid not null references public.ops_candidates(id) on delete cascade, interview_at timestamptz, interviewer_id uuid references auth.users(id) on delete set null,
  score numeric check(score is null or (score>=0 and score<=100)), notes text, recommendation text, created_at timestamptz not null default now()
);

create table if not exists public.ops_vendors (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null, category text, contact_name text, email text, phone text, website text,
  status text not null default 'active' check(status in ('prospect','active','paused','terminated','archived')), rating numeric check(rating is null or (rating>=0 and rating<=5)),
  monthly_cost numeric not null default 0 check(monthly_cost>=0), currency text not null default 'ZAR', contract_start date, contract_end date, notes text,
  created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.ops_vendor_engagements (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  vendor_id uuid not null references public.ops_vendors(id) on delete cascade, title text not null, scope text, value numeric not null default 0, currency text not null default 'ZAR',
  status text not null default 'active' check(status in ('planned','active','completed','cancelled')), start_date date, end_date date, created_at timestamptz not null default now()
);

create table if not exists public.ops_meetings (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null, meeting_at timestamptz not null default now(), location text, attendee_notes text, agenda text, notes text, decisions text,
  status text not null default 'scheduled' check(status in ('scheduled','completed','cancelled')),
  created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.ops_meeting_actions (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  meeting_id uuid not null references public.ops_meetings(id) on delete cascade, title text not null, owner_id uuid references auth.users(id) on delete set null,
  due_at timestamptz, status text not null default 'open' check(status in ('open','in_progress','done','cancelled')), linked_task_id uuid references public.workspace_tasks(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.ops_deadlines (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null, category text not null default 'operational', due_date date not null, recurring_rule text, owner_id uuid references auth.users(id) on delete set null,
  status text not null default 'open' check(status in ('open','completed','snoozed','cancelled')), reminder_days integer[] not null default array[30,14,7,1],
  source text not null default 'manual', source_ref_id uuid, notes text, created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists ops_deadlines_org_idx on public.ops_deadlines(organization_id,status,due_date);

create or replace function public.ops_meeting_action_to_task(action_uuid uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare a record; task_uuid uuid; actor uuid:=auth.uid(); begin
  select * into a from public.ops_meeting_actions where id=action_uuid;
  if a.id is null or not private.workspace_has_permission(a.organization_id,actor,'company.manage') then raise exception 'permission denied'; end if;
  if a.linked_task_id is not null then return a.linked_task_id; end if;
  insert into public.workspace_tasks(organization_id,title,status,priority,due_at,assigned_to,created_by)
  values(a.organization_id,a.title,'todo','medium',a.due_at,a.owner_id,actor) returning id into task_uuid;
  update public.ops_meeting_actions set linked_task_id=task_uuid,updated_at=now() where id=a.id;
  return task_uuid;
end $$;
revoke all on function public.ops_meeting_action_to_task(uuid) from public,anon;grant execute on function public.ops_meeting_action_to_task(uuid) to authenticated;

create or replace function public.startup_command_centre(org_id uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb; begin
  if not private.startup_workspace_member(org_id,auth.uid()) then raise exception 'permission denied'; end if;
  select jsonb_build_object(
    'validationScore',coalesce((select score from public.startup_health_assessments where organization_id=org_id order by created_at desc limit 1),0),
    'openTasks',coalesce((select count(*) from public.workspace_tasks where organization_id=org_id and status not in ('done','cancelled')),0),
    'openPipeline',coalesce((select sum(amount) from public.revenue_opportunities where organization_id=org_id and status='open'),0),
    'overdueValue',coalesce((select sum(amount_due) from public.revenue_invoices where organization_id=org_id and amount_due>0 and due_date<current_date and status not in ('paid','void')),0),
    'activeCampaigns',coalesce((select count(*) from public.growth_campaigns where organization_id=org_id and status='active'),0),
    'verifiedRecords',coalesce((select count(*) from public.company_verification_records where organization_id=org_id and status='verified'),0),
    'websiteProjects',coalesce((select count(*) from public.website_studio_projects where organization_id=org_id),0),
    'highRisks',coalesce((select count(*) from public.ops_risks where organization_id=org_id and status in ('open','mitigating') and risk_score>=15),0),
    'openRoles',coalesce((select count(*) from public.ops_job_roles where organization_id=org_id and status='open'),0),
    'upcomingDeadlines',coalesce((select count(*) from public.ops_deadlines where organization_id=org_id and status='open' and due_date between current_date and current_date+30),0),
    'okrProgress',coalesce((select round(avg(case when target_value=start_value then 100 else greatest(0,least(100,(current_value-start_value)*100.0/nullif(target_value-start_value,0))) end),1) from public.ops_key_results where organization_id=org_id),0)
  ) into result;
  return result;
end $$;
revoke all on function public.startup_command_centre(uuid) from public,anon;grant execute on function public.startup_command_centre(uuid) to authenticated;

-- Workspace-scoped RLS.
do $$ declare t text; begin
  foreach t in array array['ops_okrs','ops_key_results','ops_decisions','ops_risks','ops_hiring_plans','ops_job_roles','ops_candidates','ops_candidate_interviews','ops_vendors','ops_vendor_engagements','ops_meetings','ops_meeting_actions','ops_deadlines'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('drop policy if exists ops_member_read on public.%I',t); execute format('create policy ops_member_read on public.%I for select to authenticated using (private.startup_workspace_member(organization_id,(select auth.uid())))',t);
    execute format('drop policy if exists ops_member_insert on public.%I',t); execute format('create policy ops_member_insert on public.%I for insert to authenticated with check (private.workspace_has_permission(organization_id,(select auth.uid()),''company.manage''))',t);
    execute format('drop policy if exists ops_member_update on public.%I',t); execute format('create policy ops_member_update on public.%I for update to authenticated using (private.workspace_has_permission(organization_id,(select auth.uid()),''company.manage'')) with check (private.workspace_has_permission(organization_id,(select auth.uid()),''company.manage''))',t);
    execute format('drop policy if exists ops_member_delete on public.%I',t); execute format('create policy ops_member_delete on public.%I for delete to authenticated using (private.workspace_has_permission(organization_id,(select auth.uid()),''company.manage''))',t);
  end loop;
end $$;

do $$ declare t text; begin foreach t in array array['ops_okrs','ops_key_results','ops_risks','ops_hiring_plans','ops_job_roles','ops_candidates','ops_vendors','ops_meetings','ops_meeting_actions','ops_deadlines'] loop execute format('drop trigger if exists %I_touch_updated_at on public.%I',t,t); execute format('create trigger %I_touch_updated_at before update on public.%I for each row execute function public.tg_set_updated_at()',t,t); end loop; end $$;