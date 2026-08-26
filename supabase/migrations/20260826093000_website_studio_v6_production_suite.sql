-- Website Studio V6 production schema. Idempotent so it can reconcile projects where
-- the V6 tables were already applied through the managed Supabase workflow.

alter table public.website_studio_projects
  add column if not exists settings_config jsonb not null default '{}'::jsonb,
  add column if not exists default_locale text not null default 'en-ZA',
  add column if not exists timezone text not null default 'Africa/Johannesburg';

alter table public.website_studio_versions
  add column if not exists name text,
  add column if not exists description text not null default '',
  add column if not exists is_auto boolean not null default false,
  add column if not exists parent_version_id uuid references public.website_studio_versions(id) on delete set null;

alter table public.website_studio_assets
  add column if not exists alt_text text not null default '',
  add column if not exists focal_x double precision not null default .5,
  add column if not exists focal_y double precision not null default .5,
  add column if not exists checksum_sha256 text,
  add column if not exists source text not null default 'upload',
  add column if not exists transform_config jsonb not null default '{}'::jsonb;

alter table public.website_studio_form_submissions
  add column if not exists form_id uuid,
  add column if not exists status text not null default 'new',
  add column if not exists tags text[] not null default '{}'::text[],
  add column if not exists payload jsonb not null default '{}'::jsonb,
  add column if not exists spam_score numeric not null default 0,
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.website_studio_pages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.website_studio_projects(id) on delete cascade,
  slug text not null,
  title text not null,
  page_type text not null default 'custom',
  sort_order integer not null default 0,
  is_home boolean not null default false,
  is_published boolean not null default true,
  seo_config jsonb not null default '{}'::jsonb,
  responsive_config jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id, slug)
);

create table if not exists public.website_studio_sections (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.website_studio_projects(id) on delete cascade,
  page_id uuid not null references public.website_studio_pages(id) on delete cascade,
  section_key text not null,
  section_type text not null,
  sort_order integer not null default 0,
  content jsonb not null default '{}'::jsonb,
  style_config jsonb not null default '{}'::jsonb,
  responsive_config jsonb not null default '{}'::jsonb,
  locked boolean not null default false,
  visibility text not null default 'visible',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(page_id, section_key)
);

create table if not exists public.website_studio_brand_kits (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  tokens jsonb not null default '{}'::jsonb,
  media jsonb not null default '{}'::jsonb,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.website_studio_industry_records (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.website_studio_projects(id) on delete cascade,
  module_type text not null,
  record_key text not null,
  title text not null,
  slug text not null,
  status text not null default 'active',
  sort_order integer not null default 0,
  data jsonb not null default '{}'::jsonb,
  media jsonb not null default '[]'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id, module_type, record_key)
);

create table if not exists public.website_studio_collaborators (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.website_studio_projects(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  invited_email text,
  role text not null default 'viewer' check (role in ('viewer','commenter','editor','developer','publisher')),
  status text not null default 'pending' check (status in ('pending','active','revoked')),
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists website_studio_collaborators_project_email_key on public.website_studio_collaborators(project_id, lower(invited_email)) where invited_email is not null;
create unique index if not exists website_studio_collaborators_project_user_key on public.website_studio_collaborators(project_id, user_id) where user_id is not null;

create table if not exists public.website_studio_comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.website_studio_projects(id) on delete cascade,
  page_id uuid references public.website_studio_pages(id) on delete cascade,
  section_id uuid references public.website_studio_sections(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  status text not null default 'open' check (status in ('open','resolved')),
  resolved_by uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.website_studio_approvals (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.website_studio_projects(id) on delete cascade,
  version_id uuid references public.website_studio_versions(id) on delete set null,
  reviewer_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','approved','changes_requested')),
  message text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.website_studio_audits (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.website_studio_projects(id) on delete cascade,
  audit_type text not null check (audit_type in ('seo','accessibility','performance')),
  score integer not null check (score between 0 and 100),
  findings jsonb not null default '[]'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.website_studio_domains (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.website_studio_projects(id) on delete cascade,
  hostname text not null,
  environment text not null default 'production' check (environment in ('staging','production')),
  status text not null default 'pending',
  ssl_status text not null default 'pending',
  dns_config jsonb not null default '{}'::jsonb,
  provider_config jsonb not null default '{}'::jsonb,
  last_checked_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id, hostname)
);

create table if not exists public.website_studio_forms (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.website_studio_projects(id) on delete cascade,
  name text not null,
  slug text not null,
  fields jsonb not null default '[]'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  spam_config jsonb not null default '{}'::jsonb,
  autoresponder_config jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id, slug)
);

create table if not exists public.website_studio_bookings (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.website_studio_projects(id) on delete cascade,
  booking_type text not null,
  customer jsonb not null default '{}'::jsonb,
  start_at timestamptz,
  end_at timestamptz,
  status text not null default 'pending',
  payment_status text not null default 'unpaid',
  amount numeric(14,2) not null default 0,
  currency text not null default 'zar',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.website_studio_payments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.website_studio_projects(id) on delete cascade,
  booking_id uuid references public.website_studio_bookings(id) on delete set null,
  provider text not null default 'stripe',
  provider_payment_id text,
  status text not null default 'pending',
  amount numeric(14,2) not null default 0,
  currency text not null default 'zar',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.website_studio_analytics_events (
  id bigint generated by default as identity primary key,
  project_id uuid not null references public.website_studio_projects(id) on delete cascade,
  event_type text not null,
  page_path text not null default '/',
  session_id text,
  device jsonb not null default '{}'::jsonb,
  campaign jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create table if not exists public.website_studio_import_jobs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.website_studio_projects(id) on delete cascade,
  source_type text not null,
  source_url text,
  config jsonb not null default '{}'::jsonb,
  status text not null default 'queued',
  progress integer not null default 0 check (progress between 0 and 100),
  result jsonb not null default '{}'::jsonb,
  error_message text,
  requested_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.website_studio_saved_sections (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  name text not null,
  section_type text not null,
  structural_family text,
  content jsonb not null default '{}'::jsonb,
  style_config jsonb not null default '{}'::jsonb,
  responsive_config jsonb not null default '{}'::jsonb,
  is_global boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.website_studio_fidelity_runs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.website_studio_projects(id) on delete cascade,
  template_key text not null,
  device text not null check (device in ('desktop','tablet','mobile')),
  score numeric(6,3) not null,
  status text not null,
  metrics jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.website_studio_assistant_threads (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.website_studio_projects(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Builder chat',
  mode text not null default 'deterministic',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.website_studio_assistant_messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.website_studio_projects(id) on delete cascade,
  thread_id uuid not null references public.website_studio_assistant_threads(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  parsed_intent jsonb not null default '{}'::jsonb,
  applied_patch jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.website_studio_asset_sync_manifest (
  id uuid primary key default gen_random_uuid(),
  template_key text not null,
  asset_key text not null,
  source_path text not null,
  storage_path text,
  expected_sha256 text,
  actual_sha256 text,
  status text not null default 'pending',
  metadata jsonb not null default '{}'::jsonb,
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(template_key, asset_key)
);

create table if not exists public.website_studio_asset_variants (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.website_studio_assets(id) on delete cascade,
  project_id uuid references public.website_studio_projects(id) on delete cascade,
  variant_key text not null,
  format text not null,
  width integer not null,
  height integer not null,
  byte_size bigint not null,
  storage_path text not null,
  public_url text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(asset_id, variant_key)
);

-- Server-only encrypted bring-your-own-provider credentials. No client RLS policy is
-- created on purpose; only authenticated Edge Functions using the service role may
-- read or write ciphertext.
create table if not exists public.website_studio_provider_credentials (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.website_studio_projects(id) on delete cascade,
  provider text not null check (provider in ('github','vercel','supabase','lovable','stripe','resend','google_business','crm_webhook')),
  ciphertext text not null,
  iv text not null,
  credential_hint text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id, provider)
);

-- Widen the older integration provider check for V6 self-service integrations.
alter table public.website_studio_integrations drop constraint if exists website_studio_integrations_provider_check;
alter table public.website_studio_integrations add constraint website_studio_integrations_provider_check
  check (provider in ('github','vercel','supabase','lovable','stripe','resend','google_business','crm_webhook'));

create or replace function public.can_view_website_studio_project(target_project_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists(select 1 from public.website_studio_projects p where p.id=target_project_id and p.owner_id=auth.uid())
    or public.is_website_studio_admin()
    or exists(select 1 from public.website_studio_collaborators c where c.project_id=target_project_id and c.status in ('pending','active') and (c.user_id=auth.uid() or lower(c.invited_email)=lower(coalesce(auth.jwt()->>'email',''))));
$$;
create or replace function public.can_edit_website_studio_project(target_project_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists(select 1 from public.website_studio_projects p where p.id=target_project_id and p.owner_id=auth.uid())
    or public.is_website_studio_admin()
    or exists(select 1 from public.website_studio_collaborators c where c.project_id=target_project_id and c.status='active' and c.role in ('editor','developer','publisher') and (c.user_id=auth.uid() or lower(c.invited_email)=lower(coalesce(auth.jwt()->>'email',''))));
$$;
revoke all on function public.can_view_website_studio_project(uuid) from public;
revoke all on function public.can_edit_website_studio_project(uuid) from public;
grant execute on function public.can_view_website_studio_project(uuid) to authenticated;
grant execute on function public.can_edit_website_studio_project(uuid) to authenticated;

-- Indexes for editor, CRM and analytics hot paths.
create index if not exists website_studio_pages_project_order_idx on public.website_studio_pages(project_id, sort_order);
create index if not exists website_studio_sections_page_order_idx on public.website_studio_sections(page_id, sort_order);
create index if not exists website_studio_industry_records_project_module_idx on public.website_studio_industry_records(project_id, module_type, sort_order);
create index if not exists website_studio_comments_project_status_idx on public.website_studio_comments(project_id, status, created_at desc);
create index if not exists website_studio_bookings_project_start_idx on public.website_studio_bookings(project_id, start_at desc);
create index if not exists website_studio_payments_project_created_idx on public.website_studio_payments(project_id, created_at desc);
create index if not exists website_studio_analytics_project_time_idx on public.website_studio_analytics_events(project_id, occurred_at desc);
create index if not exists website_studio_analytics_project_event_idx on public.website_studio_analytics_events(project_id, event_type, occurred_at desc);
create index if not exists website_studio_import_jobs_project_idx on public.website_studio_import_jobs(project_id, created_at desc);
create index if not exists website_studio_fidelity_project_idx on public.website_studio_fidelity_runs(project_id, created_at desc);
create index if not exists website_studio_provider_credentials_project_idx on public.website_studio_provider_credentials(project_id, provider);

-- RLS. Provider credentials intentionally have no client-readable policies.
alter table public.website_studio_pages enable row level security;
alter table public.website_studio_sections enable row level security;
alter table public.website_studio_brand_kits enable row level security;
alter table public.website_studio_industry_records enable row level security;
alter table public.website_studio_collaborators enable row level security;
alter table public.website_studio_comments enable row level security;
alter table public.website_studio_approvals enable row level security;
alter table public.website_studio_audits enable row level security;
alter table public.website_studio_domains enable row level security;
alter table public.website_studio_forms enable row level security;
alter table public.website_studio_bookings enable row level security;
alter table public.website_studio_payments enable row level security;
alter table public.website_studio_analytics_events enable row level security;
alter table public.website_studio_import_jobs enable row level security;
alter table public.website_studio_saved_sections enable row level security;
alter table public.website_studio_fidelity_runs enable row level security;
alter table public.website_studio_assistant_threads enable row level security;
alter table public.website_studio_assistant_messages enable row level security;
alter table public.website_studio_asset_sync_manifest enable row level security;
alter table public.website_studio_asset_variants enable row level security;
alter table public.website_studio_provider_credentials enable row level security;

-- Project-scoped content policies.
do $$
declare t text;
begin
  foreach t in array array['website_studio_pages','website_studio_sections','website_studio_industry_records','website_studio_comments','website_studio_approvals','website_studio_audits','website_studio_domains','website_studio_forms','website_studio_bookings','website_studio_payments','website_studio_import_jobs','website_studio_fidelity_runs','website_studio_assistant_threads','website_studio_assistant_messages']
  loop
    execute format('drop policy if exists v6_view on public.%I',t);
    execute format('drop policy if exists v6_edit on public.%I',t);
    execute format('create policy v6_view on public.%I for select using (public.can_view_website_studio_project(project_id))',t);
    execute format('create policy v6_edit on public.%I for all using (public.can_edit_website_studio_project(project_id)) with check (public.can_edit_website_studio_project(project_id))',t);
  end loop;
end $$;

drop policy if exists v6_collaborators_view on public.website_studio_collaborators;
drop policy if exists v6_collaborators_owner_write on public.website_studio_collaborators;
create policy v6_collaborators_view on public.website_studio_collaborators for select using (public.can_view_website_studio_project(project_id));
create policy v6_collaborators_owner_write on public.website_studio_collaborators for all using (
  exists(select 1 from public.website_studio_projects p where p.id=project_id and p.owner_id=auth.uid()) or public.is_website_studio_admin()
) with check (
  exists(select 1 from public.website_studio_projects p where p.id=project_id and p.owner_id=auth.uid()) or public.is_website_studio_admin()
);

drop policy if exists v6_brand_kits_owner on public.website_studio_brand_kits;
create policy v6_brand_kits_owner on public.website_studio_brand_kits for all using (owner_id=auth.uid() or public.is_website_studio_admin()) with check (owner_id=auth.uid() or public.is_website_studio_admin());

drop policy if exists v6_saved_sections_read on public.website_studio_saved_sections;
drop policy if exists v6_saved_sections_write on public.website_studio_saved_sections;
create policy v6_saved_sections_read on public.website_studio_saved_sections for select using (is_global=true or owner_id=auth.uid() or public.is_website_studio_admin());
create policy v6_saved_sections_write on public.website_studio_saved_sections for all using (owner_id=auth.uid() or public.is_website_studio_admin()) with check (owner_id=auth.uid() or public.is_website_studio_admin());

drop policy if exists v6_variants_view on public.website_studio_asset_variants;
drop policy if exists v6_variants_write on public.website_studio_asset_variants;
create policy v6_variants_view on public.website_studio_asset_variants for select using (
  exists(select 1 from public.website_studio_assets a where a.id=asset_id and (a.owner_id=auth.uid() or public.is_website_studio_admin()))
);
create policy v6_variants_write on public.website_studio_asset_variants for all using (
  exists(select 1 from public.website_studio_assets a where a.id=asset_id and (a.owner_id=auth.uid() or public.is_website_studio_admin()))
) with check (
  exists(select 1 from public.website_studio_assets a where a.id=asset_id and (a.owner_id=auth.uid() or public.is_website_studio_admin()))
);

drop policy if exists v6_asset_manifest_admin on public.website_studio_asset_sync_manifest;
create policy v6_asset_manifest_admin on public.website_studio_asset_sync_manifest for all using (public.is_website_studio_admin()) with check (public.is_website_studio_admin());

-- Analytics reads remain private to project collaborators; anonymous writes happen
-- through the token-validated public Edge API instead of direct table access.
drop policy if exists v6_analytics_view on public.website_studio_analytics_events;
create policy v6_analytics_view on public.website_studio_analytics_events for select using (public.can_view_website_studio_project(project_id));

-- Provider credential ciphertext stays service-role only.
revoke all on public.website_studio_provider_credentials from anon, authenticated;
