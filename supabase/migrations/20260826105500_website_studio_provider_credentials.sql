-- Website Studio V6 self-service provider credentials.
-- Secret material is intentionally inaccessible through the client API/RLS and
-- is read/written only by authenticated Edge Functions using the service role.

create table if not exists public.website_studio_provider_credentials (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.website_studio_projects(id) on delete cascade,
  provider text not null check (provider in ('github','vercel','stripe','resend','google_business','shopify','wordpress','crm_webhook')),
  ciphertext text not null,
  iv text not null,
  credential_hint text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id, provider)
);

create index if not exists website_studio_provider_credentials_project_idx
  on public.website_studio_provider_credentials(project_id, provider);

alter table public.website_studio_provider_credentials enable row level security;

-- Deliberately no authenticated/anon policies. The service role used by the
-- credential broker bypasses RLS. This prevents ciphertext, IVs and metadata
-- from being downloaded directly by a browser even by a project owner.
revoke all on table public.website_studio_provider_credentials from anon, authenticated;

grant all on table public.website_studio_provider_credentials to service_role;

comment on table public.website_studio_provider_credentials is
  'Encrypted per-project third-party provider credentials. Server access only.';
