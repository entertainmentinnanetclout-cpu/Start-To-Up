create table if not exists public.website_studio_assets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.website_studio_projects(id) on delete set null,
  slot text not null check (slot in ('logo','favicon','hero','gallery','og-image','brand-material')),
  storage_path text not null unique,
  public_url text not null,
  original_filename text not null,
  mime_type text not null,
  byte_size bigint not null check (byte_size > 0 and byte_size <= 15728640),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.website_studio_assets enable row level security;

drop policy if exists website_studio_assets_select_owner on public.website_studio_assets;
create policy website_studio_assets_select_owner on public.website_studio_assets
for select to authenticated
using (owner_id = auth.uid() or public.is_website_studio_admin());

drop policy if exists website_studio_assets_insert_owner on public.website_studio_assets;
create policy website_studio_assets_insert_owner on public.website_studio_assets
for insert to authenticated
with check (owner_id = auth.uid());

drop policy if exists website_studio_assets_delete_owner on public.website_studio_assets;
create policy website_studio_assets_delete_owner on public.website_studio_assets
for delete to authenticated
using (owner_id = auth.uid() or public.is_website_studio_admin());

create index if not exists idx_website_studio_assets_owner_created
on public.website_studio_assets(owner_id, created_at desc);
create index if not exists idx_website_studio_assets_project
on public.website_studio_assets(project_id, created_at desc) where project_id is not null;
