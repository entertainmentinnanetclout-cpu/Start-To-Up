create type public.media_kind as enum ('build_reel','project_video','webinar_replay','research_demo');
create type public.media_status as enum ('draft','processing','published','restricted','removed');
create type public.live_event_status as enum ('draft','scheduled','live','ended','cancelled');
create type public.program_status as enum ('draft','open','active','completed','archived');

create table public.media_publications (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 180),
  caption text,
  kind public.media_kind not null,
  status public.media_status not null default 'draft',
  visibility public.visibility_level not null default 'community',
  storage_path text not null,
  thumbnail_path text,
  duration_seconds integer check (duration_seconds is null or duration_seconds between 1 and 14400),
  language_code text not null default 'en' check (language_code ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  transcript text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.live_events (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete set null,
  expert_session_id uuid references public.expert_sessions(id) on delete set null,
  title text not null check (char_length(title) between 5 and 180),
  summary text not null check (char_length(summary) between 20 and 4000),
  provider text not null default 'external',
  public_landing_url text,
  protected_join_url text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  status public.live_event_status not null default 'draft',
  replay_media_id uuid references public.media_publications(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at)
);

create table public.ecosystem_programs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 180),
  description text not null,
  status public.program_status not null default 'draft',
  eligibility jsonb not null default '{}'::jsonb,
  starts_on date,
  ends_on date,
  public_metrics_enabled boolean not null default false,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on is null or starts_on is null or ends_on >= starts_on)
);

create table public.program_participations (
  program_id uuid not null references public.ecosystem_programs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  consented_at timestamptz not null,
  aggregate_reporting_consent boolean not null default false,
  status text not null default 'active' check (status in ('applied','active','completed','withdrawn')),
  joined_at timestamptz not null default now(),
  primary key (program_id,user_id)
);

create table public.recommendation_events (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade,
  session_key uuid,
  entity_type text not null,
  entity_id uuid not null,
  event_type text not null check (event_type in ('impression','open','save','follow','apply','dismiss')),
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (user_id is not null or session_key is not null)
);

create table public.platform_plans (
  id text primary key,
  name text not null,
  audience text not null,
  description text not null,
  monthly_price_zar numeric(12,2),
  features jsonb not null default '[]'::jsonb,
  is_public boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.account_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade,
  plan_id text not null references public.platform_plans(id),
  status text not null default 'inactive' check (status in ('trial','active','past_due','cancelled','inactive')),
  starts_at timestamptz,
  ends_at timestamptz,
  provider_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((user_id is not null)::int + (organization_id is not null)::int = 1)
);

create index media_publications_discovery_idx on public.media_publications(status,kind,published_at desc);
create index media_publications_creator_idx on public.media_publications(creator_id,created_at desc);
create index media_publications_project_idx on public.media_publications(project_id) where project_id is not null;
create index live_events_schedule_idx on public.live_events(status,starts_at);
create index live_events_host_idx on public.live_events(host_id,starts_at);
create index live_events_organization_idx on public.live_events(organization_id) where organization_id is not null;
create index live_events_session_idx on public.live_events(expert_session_id) where expert_session_id is not null;
create index live_events_replay_idx on public.live_events(replay_media_id) where replay_media_id is not null;
create index ecosystem_programs_org_idx on public.ecosystem_programs(organization_id,status);
create index ecosystem_programs_creator_idx on public.ecosystem_programs(created_by);
create index program_participations_user_idx on public.program_participations(user_id,status);
create index recommendation_events_user_idx on public.recommendation_events(user_id,created_at desc) where user_id is not null;
create index recommendation_events_session_idx on public.recommendation_events(session_key,created_at desc) where session_key is not null;
create index account_entitlements_user_idx on public.account_entitlements(user_id) where user_id is not null;
create index account_entitlements_org_idx on public.account_entitlements(organization_id) where organization_id is not null;

alter table public.media_publications enable row level security;
alter table public.live_events enable row level security;
alter table public.ecosystem_programs enable row level security;
alter table public.program_participations enable row level security;
alter table public.recommendation_events enable row level security;
alter table public.platform_plans enable row level security;
alter table public.account_entitlements enable row level security;

create policy "published media visible" on public.media_publications for select to anon,authenticated
  using ((status='published' and visibility='public') or creator_id=(select auth.uid()) or private.can_view_project(project_id,(select auth.uid())) or private.is_staff((select auth.uid())));
create policy "creators publish media" on public.media_publications for insert to authenticated
  with check (creator_id=(select auth.uid()) and private.is_permanent_user());
create policy "creators manage media" on public.media_publications for update to authenticated
  using (creator_id=(select auth.uid()) or private.is_staff((select auth.uid())))
  with check (creator_id=(select auth.uid()) or private.is_staff((select auth.uid())));

create policy "scheduled live events visible" on public.live_events for select to anon,authenticated
  using (status in ('scheduled','live','ended') or host_id=(select auth.uid()) or private.is_staff((select auth.uid())));
create policy "hosts create live events" on public.live_events for insert to authenticated
  with check (host_id=(select auth.uid()) and private.is_permanent_user());
create policy "hosts manage live events" on public.live_events for update to authenticated
  using (host_id=(select auth.uid()) or private.is_staff((select auth.uid())))
  with check (host_id=(select auth.uid()) or private.is_staff((select auth.uid())));

create policy "open programs visible" on public.ecosystem_programs for select to anon,authenticated
  using (status in ('open','active','completed') or private.is_organization_admin(organization_id,(select auth.uid())) or private.is_staff((select auth.uid())));
create policy "organization admins create programs" on public.ecosystem_programs for insert to authenticated
  with check (private.is_organization_admin(organization_id,(select auth.uid())) and private.is_permanent_user());
create policy "organization admins manage programs" on public.ecosystem_programs for update to authenticated
  using (private.is_organization_admin(organization_id,(select auth.uid())) or private.is_staff((select auth.uid())))
  with check (private.is_organization_admin(organization_id,(select auth.uid())) or private.is_staff((select auth.uid())));

create policy "own program participation" on public.program_participations for select to authenticated
  using (user_id=(select auth.uid()) or private.is_organization_admin((select p.organization_id from public.ecosystem_programs p where p.id=program_id),(select auth.uid())) or private.is_staff((select auth.uid())));
create policy "join program with consent" on public.program_participations for insert to authenticated
  with check (user_id=(select auth.uid()) and consented_at is not null and private.is_permanent_user());
create policy "own recommendation events" on public.recommendation_events for all to authenticated
  using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
create policy "public plans visible" on public.platform_plans for select to anon,authenticated using (is_public);
create policy "own entitlements visible" on public.account_entitlements for select to authenticated
  using (user_id=(select auth.uid()) or private.is_organization_admin(organization_id,(select auth.uid())) or private.is_staff((select auth.uid())));

grant select on public.media_publications,public.live_events,public.ecosystem_programs,public.platform_plans to anon;
grant select,insert,update,delete on public.media_publications,public.live_events,public.ecosystem_programs,public.program_participations,public.recommendation_events,public.platform_plans,public.account_entitlements to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
('build-media','build-media',false,524288000,array['video/mp4','video/webm','image/jpeg','image/png','image/webp','text/vtt'])
on conflict(id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create policy "build media owned upload" on storage.objects for insert to authenticated
  with check (bucket_id='build-media' and (storage.foldername(name))[1]=(select auth.uid())::text and private.is_permanent_user());
create policy "build media owned read" on storage.objects for select to authenticated
  using (bucket_id='build-media' and owner_id=(select auth.uid())::text);
create policy "build media owned update" on storage.objects for update to authenticated
  using (bucket_id='build-media' and owner_id=(select auth.uid())::text)
  with check (bucket_id='build-media' and owner_id=(select auth.uid())::text);
create policy "build media owned delete" on storage.objects for delete to authenticated
  using (bucket_id='build-media' and owner_id=(select auth.uid())::text);

notify pgrst,'reload schema';
