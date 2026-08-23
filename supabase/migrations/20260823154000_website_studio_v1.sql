create table if not exists public.website_studio_templates (
  key text primary key,
  name text not null,
  description text not null default '',
  source_repository text,
  default_sections jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.website_studio_settings (
  singleton boolean primary key default true check (singleton = true),
  access_mode text not null default 'client_and_admin' check (access_mode in ('client_and_admin','admin_only')),
  updated_at timestamptz not null default now()
);

create table if not exists public.website_studio_projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_name text not null,
  business_name text not null,
  slug text not null,
  business_category text not null,
  template_key text not null default 'reskonnect-premium' references public.website_studio_templates(key),
  status text not null default 'draft' check (status in ('draft','review','ready','published','archived')),
  access_mode text not null default 'managed_client' check (access_mode in ('managed_client','admin_only')),
  brand_config jsonb not null default '{}'::jsonb,
  site_config jsonb not null default '{}'::jsonb,
  seo_config jsonb not null default '{}'::jsonb,
  contact_config jsonb not null default '{}'::jsonb,
  github_repository_owner text,
  github_repository_name text,
  github_branch text not null default 'main',
  deployment_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id, slug)
);

create table if not exists public.website_studio_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.website_studio_projects(id) on delete cascade,
  version_number integer not null check (version_number > 0),
  snapshot jsonb not null,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(project_id, version_number)
);

create table if not exists public.website_studio_publication_jobs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.website_studio_projects(id) on delete cascade,
  requested_by uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'github' check (provider in ('github','managed_export')),
  repository_owner text,
  repository_name text,
  branch text not null default 'main',
  visibility text not null default 'private' check (visibility in ('private','public')),
  status text not null default 'queued' check (status in ('queued','preparing','ready','synced','failed','cancelled')),
  generated_manifest jsonb not null default '{}'::jsonb,
  last_commit_sha text,
  deployment_url text,
  client_message text,
  internal_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.website_studio_templates(key, name, description, source_repository, default_sections)
values (
  'reskonnect-premium',
  'ResKonnect Premium',
  'A premium, responsive business website system adapted from the proven ResKonnect product design language.',
  'https://github.com/entertainmentinnanetclout-cpu/resi-seek-app',
  '["hero","trust","services","featured","about","process","testimonials","contact"]'::jsonb
)
on conflict (key) do update set
  name = excluded.name,
  description = excluded.description,
  source_repository = excluded.source_repository,
  default_sections = excluded.default_sections,
  is_active = true,
  updated_at = now();

insert into public.website_studio_settings(singleton, access_mode)
values (true, 'client_and_admin')
on conflict (singleton) do nothing;

create or replace function public.is_website_studio_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role::text in ('admin','super_admin')
  );
$$;

create or replace function public.can_access_website_studio()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when (select access_mode from public.website_studio_settings where singleton = true) = 'admin_only'
      then public.is_website_studio_admin()
    else auth.uid() is not null
  end;
$$;

grant execute on function public.is_website_studio_admin() to authenticated;
grant execute on function public.can_access_website_studio() to authenticated;

alter table public.website_studio_templates enable row level security;
alter table public.website_studio_settings enable row level security;
alter table public.website_studio_projects enable row level security;
alter table public.website_studio_versions enable row level security;
alter table public.website_studio_publication_jobs enable row level security;

drop policy if exists website_studio_templates_read on public.website_studio_templates;
create policy website_studio_templates_read on public.website_studio_templates
for select using (is_active = true);

drop policy if exists website_studio_settings_read on public.website_studio_settings;
create policy website_studio_settings_read on public.website_studio_settings
for select to authenticated using (true);

drop policy if exists website_studio_settings_admin_update on public.website_studio_settings;
create policy website_studio_settings_admin_update on public.website_studio_settings
for update to authenticated using (public.is_website_studio_admin()) with check (public.is_website_studio_admin());

drop policy if exists website_studio_projects_select on public.website_studio_projects;
create policy website_studio_projects_select on public.website_studio_projects
for select to authenticated using (owner_id = auth.uid() or public.is_website_studio_admin());

drop policy if exists website_studio_projects_insert on public.website_studio_projects;
create policy website_studio_projects_insert on public.website_studio_projects
for insert to authenticated with check (owner_id = auth.uid() or public.is_website_studio_admin());

drop policy if exists website_studio_projects_update on public.website_studio_projects;
create policy website_studio_projects_update on public.website_studio_projects
for update to authenticated using (owner_id = auth.uid() or public.is_website_studio_admin()) with check (owner_id = auth.uid() or public.is_website_studio_admin());

drop policy if exists website_studio_projects_delete on public.website_studio_projects;
create policy website_studio_projects_delete on public.website_studio_projects
for delete to authenticated using (owner_id = auth.uid() or public.is_website_studio_admin());

drop policy if exists website_studio_versions_select on public.website_studio_versions;
create policy website_studio_versions_select on public.website_studio_versions
for select to authenticated using (
  exists (select 1 from public.website_studio_projects p where p.id = project_id and (p.owner_id = auth.uid() or public.is_website_studio_admin()))
);

drop policy if exists website_studio_versions_insert on public.website_studio_versions;
create policy website_studio_versions_insert on public.website_studio_versions
for insert to authenticated with check (
  created_by = auth.uid()
  and exists (select 1 from public.website_studio_projects p where p.id = project_id and (p.owner_id = auth.uid() or public.is_website_studio_admin()))
);

drop policy if exists website_studio_jobs_select on public.website_studio_publication_jobs;
create policy website_studio_jobs_select on public.website_studio_publication_jobs
for select to authenticated using (
  requested_by = auth.uid()
  or exists (select 1 from public.website_studio_projects p where p.id = project_id and p.owner_id = auth.uid())
  or public.is_website_studio_admin()
);

drop policy if exists website_studio_jobs_insert on public.website_studio_publication_jobs;
create policy website_studio_jobs_insert on public.website_studio_publication_jobs
for insert to authenticated with check (
  requested_by = auth.uid()
  and exists (select 1 from public.website_studio_projects p where p.id = project_id and (p.owner_id = auth.uid() or public.is_website_studio_admin()))
);

drop policy if exists website_studio_jobs_update on public.website_studio_publication_jobs;
create policy website_studio_jobs_update on public.website_studio_publication_jobs
for update to authenticated using (requested_by = auth.uid() or public.is_website_studio_admin()) with check (requested_by = auth.uid() or public.is_website_studio_admin());

create index if not exists idx_website_studio_projects_owner_updated on public.website_studio_projects(owner_id, updated_at desc);
create index if not exists idx_website_studio_versions_project on public.website_studio_versions(project_id, version_number desc);
create index if not exists idx_website_studio_jobs_project on public.website_studio_publication_jobs(project_id, created_at desc);