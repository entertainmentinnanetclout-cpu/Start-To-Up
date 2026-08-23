alter table public.website_studio_projects
  add column if not exists integration_config jsonb not null default '{}'::jsonb,
  add column if not exists export_config jsonb not null default '{}'::jsonb,
  add column if not exists public_submit_token uuid not null default gen_random_uuid(),
  add column if not exists last_exported_at timestamptz;

create unique index if not exists website_studio_projects_public_submit_token_key
  on public.website_studio_projects(public_submit_token);

create table if not exists public.website_studio_integrations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.website_studio_projects(id) on delete cascade,
  provider text not null check (provider in ('github','vercel','supabase','lovable')),
  status text not null default 'disconnected' check (status in ('disconnected','ready','connected','deploying','deployed','error')),
  external_project_id text,
  external_url text,
  config jsonb not null default '{}'::jsonb,
  last_error text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id, provider)
);

create table if not exists public.website_studio_deployments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.website_studio_projects(id) on delete cascade,
  provider text not null check (provider in ('vercel','github','lovable')),
  status text not null default 'queued',
  external_project_id text,
  external_deployment_id text,
  preview_url text,
  production_url text,
  metadata jsonb not null default '{}'::jsonb,
  requested_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.website_studio_form_submissions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.website_studio_projects(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  message text not null,
  source_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.website_studio_integrations enable row level security;
alter table public.website_studio_deployments enable row level security;
alter table public.website_studio_form_submissions enable row level security;

create policy "website studio integrations owner select" on public.website_studio_integrations
for select using (
  exists (select 1 from public.website_studio_projects p where p.id = project_id and (p.owner_id = auth.uid() or public.is_website_studio_admin()))
);

create policy "website studio integrations owner write" on public.website_studio_integrations
for all using (
  exists (select 1 from public.website_studio_projects p where p.id = project_id and (p.owner_id = auth.uid() or public.is_website_studio_admin()))
) with check (
  exists (select 1 from public.website_studio_projects p where p.id = project_id and (p.owner_id = auth.uid() or public.is_website_studio_admin()))
);

create policy "website studio deployments owner select" on public.website_studio_deployments
for select using (
  exists (select 1 from public.website_studio_projects p where p.id = project_id and (p.owner_id = auth.uid() or public.is_website_studio_admin()))
);

create policy "website studio deployments owner insert" on public.website_studio_deployments
for insert with check (
  exists (select 1 from public.website_studio_projects p where p.id = project_id and (p.owner_id = auth.uid() or public.is_website_studio_admin()))
);

create policy "website studio submissions owner select" on public.website_studio_form_submissions
for select using (
  exists (select 1 from public.website_studio_projects p where p.id = project_id and (p.owner_id = auth.uid() or public.is_website_studio_admin()))
);
