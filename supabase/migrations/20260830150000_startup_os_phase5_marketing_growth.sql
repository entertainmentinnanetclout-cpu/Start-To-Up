-- Start To Up — Startup OS Phase 5: Marketing & Growth.
-- Campaign identifiers are shared with CRM/revenue attribution. Estimated metrics must remain labelled.

create table if not exists public.growth_campaigns (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 220),
  objective text not null default 'awareness' check (objective in ('awareness','traffic','leads','sales','retention','launch','other')),
  status text not null default 'draft' check (status in ('draft','planned','active','paused','completed','archived')),
  start_date date,
  end_date date,
  audience text,
  offer text,
  primary_channel text,
  currency text not null default 'ZAR',
  budget numeric not null default 0 check (budget >= 0),
  actual_spend numeric not null default 0 check (actual_spend >= 0),
  public_token uuid not null default gen_random_uuid() unique,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists growth_campaigns_org_idx on public.growth_campaigns(organization_id,status,updated_at desc);

create table if not exists public.growth_campaign_channels (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  campaign_id uuid not null references public.growth_campaigns(id) on delete cascade,
  channel text not null,
  objective text,
  budget numeric not null default 0 check (budget >= 0),
  actual_spend numeric not null default 0 check (actual_spend >= 0),
  target_metric text,
  target_value numeric,
  notes text,
  unique(campaign_id,channel)
);

create table if not exists public.growth_content_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  campaign_id uuid references public.growth_campaigns(id) on delete set null,
  title text not null,
  content_type text not null default 'social' check (content_type in ('social','video','blog','email','landing_page','ad','event','other')),
  channel text,
  status text not null default 'idea' check (status in ('idea','draft','review','scheduled','published','cancelled')),
  publish_at timestamptz,
  owner_id uuid references auth.users(id) on delete set null,
  brief text,
  asset_url text,
  published_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists growth_content_calendar_idx on public.growth_content_items(organization_id,publish_at,status);

create table if not exists public.growth_utm_links (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  campaign_id uuid references public.growth_campaigns(id) on delete cascade,
  name text not null,
  destination_url text not null,
  source text not null,
  medium text not null,
  campaign text not null,
  term text,
  content text,
  final_url text not null,
  short_code text,
  clicks integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(organization_id,final_url)
);

create table if not exists public.growth_seo_targets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid references public.website_studio_projects(id) on delete set null,
  keyword text not null,
  target_url text,
  location text,
  intent text not null default 'commercial' check (intent in ('informational','commercial','transactional','navigational','local')),
  priority integer not null default 50 check (priority between 0 and 100),
  search_volume numeric,
  difficulty numeric,
  current_position numeric,
  target_position numeric,
  evidence_confidence text not null default 'owner_entered' check (evidence_confidence in ('owner_entered','observed','estimated','verified')),
  source_provider text,
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists growth_seo_targets_org_idx on public.growth_seo_targets(organization_id,priority desc,updated_at desc);

create table if not exists public.growth_seo_audits (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid references public.website_studio_projects(id) on delete set null,
  url text not null,
  technical_score integer check (technical_score is null or technical_score between 0 and 100),
  content_score integer check (content_score is null or content_score between 0 and 100),
  local_score integer check (local_score is null or local_score between 0 and 100),
  authority_score integer check (authority_score is null or authority_score between 0 and 100),
  findings jsonb not null default '[]'::jsonb,
  evidence_confidence text not null default 'observed' check (evidence_confidence in ('owner_entered','observed','estimated','verified')),
  source_provider text,
  created_at timestamptz not null default now()
);

create table if not exists public.growth_experiments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  campaign_id uuid references public.growth_campaigns(id) on delete set null,
  name text not null,
  hypothesis text not null,
  metric text not null,
  baseline numeric,
  target numeric,
  status text not null default 'planned' check (status in ('planned','running','won','lost','inconclusive','cancelled')),
  start_at timestamptz,
  end_at timestamptz,
  result_summary text,
  learning text,
  owner_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.growth_experiment_measurements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  experiment_id uuid not null references public.growth_experiments(id) on delete cascade,
  variant text not null default 'control',
  value numeric not null,
  sample_size integer,
  measured_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.growth_kpis (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  category text not null default 'growth',
  unit text not null default 'number',
  target numeric,
  direction text not null default 'up' check (direction in ('up','down','maintain')),
  source text not null default 'manual',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(organization_id,name)
);

create table if not exists public.growth_kpi_measurements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  kpi_id uuid not null references public.growth_kpis(id) on delete cascade,
  value numeric not null,
  measured_at timestamptz not null default now(),
  source text not null default 'manual',
  evidence_confidence text not null default 'owner_entered' check (evidence_confidence in ('owner_entered','observed','estimated','verified')),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.growth_retention_measurements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  starting_customers integer not null default 0 check (starting_customers >= 0),
  new_customers integer not null default 0 check (new_customers >= 0),
  ending_customers integer not null default 0 check (ending_customers >= 0),
  retained_customers integer not null default 0 check (retained_customers >= 0),
  churned_customers integer not null default 0 check (churned_customers >= 0),
  retention_rate numeric,
  churn_rate numeric,
  source text not null default 'manual',
  created_at timestamptz not null default now(),
  unique(organization_id,period_start,period_end)
);

create table if not exists public.growth_touchpoints (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  campaign_id uuid references public.growth_campaigns(id) on delete set null,
  utm_link_id uuid references public.growth_utm_links(id) on delete set null,
  account_id uuid references public.revenue_accounts(id) on delete set null,
  contact_id uuid references public.revenue_contacts(id) on delete set null,
  lead_id uuid references public.revenue_leads(id) on delete set null,
  opportunity_id uuid references public.revenue_opportunities(id) on delete set null,
  invoice_id uuid references public.revenue_invoices(id) on delete set null,
  event_type text not null check (event_type in ('page_view','cta_click','form_submit','lead','opportunity','won','invoice','payment','manual')),
  source text,
  medium text,
  session_key text,
  conversion_value numeric not null default 0,
  occurred_at timestamptz not null default now(),
  evidence_confidence text not null default 'observed' check (evidence_confidence in ('owner_entered','observed','estimated','verified')),
  metadata jsonb not null default '{}'::jsonb
);
create index if not exists growth_touchpoints_attr_idx on public.growth_touchpoints(organization_id,campaign_id,occurred_at desc);

create table if not exists public.growth_paid_media_snapshots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  campaign_id uuid references public.growth_campaigns(id) on delete set null,
  provider text not null,
  external_campaign_id text,
  spend numeric,
  impressions numeric,
  clicks numeric,
  leads numeric,
  conversions numeric,
  revenue numeric,
  ctr numeric,
  cpc numeric,
  cpa numeric,
  roas numeric,
  evidence_confidence text not null default 'owner_entered' check (evidence_confidence in ('owner_entered','observed','estimated','verified')),
  period_start date,
  period_end date,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.growth_public_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  campaign_id uuid references public.growth_campaigns(id) on delete cascade,
  utm_link_id uuid references public.growth_utm_links(id) on delete set null,
  event_type text not null,
  session_hash text,
  ip_hash text,
  source_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists growth_public_events_campaign_idx on public.growth_public_events(campaign_id,created_at desc);

create or replace function public.growth_attribute_revenue(org_id uuid, campaign_uuid uuid, lead_uuid uuid default null, opportunity_uuid uuid default null, invoice_uuid uuid default null, conversion_amount numeric default 0)
returns uuid language plpgsql security definer set search_path='' as $$
declare touch_uuid uuid; actor uuid:=auth.uid();
begin
  if not private.workspace_has_permission(org_id,actor,'company.manage') then raise exception 'permission denied'; end if;
  if not exists(select 1 from public.growth_campaigns where id=campaign_uuid and organization_id=org_id) then raise exception 'campaign not found'; end if;
  if lead_uuid is not null and not exists(select 1 from public.revenue_leads where id=lead_uuid and organization_id=org_id) then raise exception 'lead not found'; end if;
  if opportunity_uuid is not null and not exists(select 1 from public.revenue_opportunities where id=opportunity_uuid and organization_id=org_id) then raise exception 'opportunity not found'; end if;
  if invoice_uuid is not null and not exists(select 1 from public.revenue_invoices where id=invoice_uuid and organization_id=org_id) then raise exception 'invoice not found'; end if;
  insert into public.growth_touchpoints(organization_id,campaign_id,lead_id,opportunity_id,invoice_id,event_type,conversion_value,evidence_confidence,metadata)
  values(org_id,campaign_uuid,lead_uuid,opportunity_uuid,invoice_uuid,case when invoice_uuid is not null then 'invoice' when opportunity_uuid is not null then 'opportunity' when lead_uuid is not null then 'lead' else 'manual' end,greatest(coalesce(conversion_amount,0),0),'verified',jsonb_build_object('linkedBy',actor)) returning id into touch_uuid;
  return touch_uuid;
end $$;
revoke all on function public.growth_attribute_revenue(uuid,uuid,uuid,uuid,uuid,numeric) from public,anon;
grant execute on function public.growth_attribute_revenue(uuid,uuid,uuid,uuid,uuid,numeric) to authenticated;

create or replace function public.growth_attribution_summary(org_id uuid)
returns table(campaign_id uuid,campaign_name text,actual_spend numeric,leads bigint,opportunities bigint,invoice_value numeric,roas numeric)
language sql stable security definer set search_path='' as $$
  select c.id,c.name,c.actual_spend,
    count(distinct t.lead_id) filter(where t.lead_id is not null),
    count(distinct t.opportunity_id) filter(where t.opportunity_id is not null),
    coalesce(sum(t.conversion_value) filter(where t.invoice_id is not null),0),
    case when c.actual_spend>0 then coalesce(sum(t.conversion_value) filter(where t.invoice_id is not null),0)/c.actual_spend else null end
  from public.growth_campaigns c left join public.growth_touchpoints t on t.campaign_id=c.id
  where c.organization_id=org_id and private.startup_workspace_member(org_id,auth.uid())
  group by c.id,c.name,c.actual_spend order by c.updated_at desc;
$$;
revoke all on function public.growth_attribution_summary(uuid) from public,anon;
grant execute on function public.growth_attribution_summary(uuid) to authenticated;

-- RLS for private growth records. Public events are service-role only.
do $$ declare t text; begin
  foreach t in array array['growth_campaigns','growth_campaign_channels','growth_content_items','growth_utm_links','growth_seo_targets','growth_seo_audits','growth_experiments','growth_experiment_measurements','growth_kpis','growth_kpi_measurements','growth_retention_measurements','growth_touchpoints','growth_paid_media_snapshots'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('drop policy if exists growth_member_read on public.%I',t);
    execute format('create policy growth_member_read on public.%I for select to authenticated using (private.startup_workspace_member(organization_id,(select auth.uid())))',t);
    execute format('drop policy if exists growth_member_insert on public.%I',t);
    execute format('create policy growth_member_insert on public.%I for insert to authenticated with check (private.workspace_has_permission(organization_id,(select auth.uid()),''company.manage''))',t);
    execute format('drop policy if exists growth_member_update on public.%I',t);
    execute format('create policy growth_member_update on public.%I for update to authenticated using (private.workspace_has_permission(organization_id,(select auth.uid()),''company.manage'')) with check (private.workspace_has_permission(organization_id,(select auth.uid()),''company.manage''))',t);
    execute format('drop policy if exists growth_member_delete on public.%I',t);
    execute format('create policy growth_member_delete on public.%I for delete to authenticated using (private.workspace_has_permission(organization_id,(select auth.uid()),''company.manage''))',t);
  end loop;
end $$;
alter table public.growth_public_events enable row level security;

-- Shared updated_at trigger from Phase 0.
do $$ declare t text; begin
  foreach t in array array['growth_campaigns','growth_content_items','growth_seo_targets','growth_experiments','growth_kpis'] loop
    execute format('drop trigger if exists %I_touch_updated_at on public.%I',t,t);
    execute format('create trigger %I_touch_updated_at before update on public.%I for each row execute function public.tg_set_updated_at()',t,t);
  end loop;
end $$;