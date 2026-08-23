-- Start To Up Phase 2: collaboration and trust foundations.

create type public.verification_kind as enum ('identity', 'investor', 'organization');
create type public.verification_status as enum ('pending', 'in_review', 'approved', 'rejected', 'withdrawn');
create type public.organization_member_role as enum ('owner', 'admin', 'member');
create type public.session_status as enum ('draft', 'published', 'cancelled', 'completed');
create type public.registration_status as enum ('pending', 'approved', 'rejected', 'cancelled', 'attended');

alter table public.protected_access_requests
  add column expires_at timestamptz,
  add column revoked_at timestamptz,
  add column revocation_reason text,
  add column terms_version text not null default '1.0';

alter table public.evidence_events
  add column storage_path text,
  add column original_filename text,
  add column content_type text,
  add column size_bytes bigint check (size_bytes is null or size_bytes >= 0);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 2 and 120),
  organization_type text not null,
  description text,
  logo_path text,
  website text,
  country text,
  city text,
  is_verified boolean not null default false,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.organization_member_role not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table public.verification_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade,
  kind public.verification_kind not null,
  status public.verification_status not null default 'pending',
  statement text not null check (char_length(statement) between 20 and 3000),
  document_paths text[] not null default '{}',
  consent_confirmed boolean not null default false,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  decision_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((kind = 'organization' and organization_id is not null) or kind <> 'organization')
);

create unique index verification_requests_one_active_idx
  on public.verification_requests (requester_id, kind, coalesce(organization_id, '00000000-0000-0000-0000-000000000000'::uuid))
  where status in ('pending', 'in_review');

create table public.expert_sessions (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete set null,
  title text not null check (char_length(title) between 5 and 180),
  summary text not null check (char_length(summary) between 20 and 4000),
  sector text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  capacity integer check (capacity is null or capacity > 0),
  external_meeting_url text,
  status public.session_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table public.expert_session_registrations (
  session_id uuid not null references public.expert_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status public.registration_status not null default 'pending',
  motivation text,
  decided_by uuid references auth.users(id) on delete set null,
  decided_at timestamptz,
  registered_at timestamptz not null default now(),
  primary key (session_id, user_id)
);

create index organizations_created_by_idx on public.organizations(created_by);
create index organization_members_user_id_idx on public.organization_members(user_id);
create index verification_requests_requester_idx on public.verification_requests(requester_id, created_at desc);
create index verification_requests_review_idx on public.verification_requests(status, created_at);
create index expert_sessions_host_idx on public.expert_sessions(host_id, starts_at);
create index expert_sessions_discovery_idx on public.expert_sessions(status, starts_at);
create index expert_session_registrations_user_idx on public.expert_session_registrations(user_id);
create index collaboration_requests_status_idx on public.collaboration_requests(status, created_at desc);
create index collaboration_applications_applicant_idx on public.collaboration_applications(applicant_id, created_at desc);
create index protected_access_requests_requester_idx on public.protected_access_requests(requester_id, created_at desc);
create index protected_access_requests_project_status_idx on public.protected_access_requests(project_id, status);
create index project_members_user_idx on public.project_members(user_id);
create index messages_conversation_created_idx on public.messages(conversation_id, created_at);
create index notifications_user_unread_idx on public.notifications(user_id, created_at desc) where read_at is null;
create index content_reports_reporter_idx on public.content_reports(reporter_id, created_at desc);
create index ip_misuse_reports_claimant_idx on public.ip_misuse_reports(claimant_id, created_at desc);
create index moderation_actions_subject_idx on public.moderation_actions(subject_type, subject_id, created_at desc);
create index appeals_user_idx on public.appeals(user_id, created_at desc);
create index evidence_events_project_created_idx on public.evidence_events(project_id, created_at desc);
create index admin_audit_log_actor_idx on public.admin_audit_log(actor_id, created_at desc);

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.verification_requests enable row level security;
alter table public.expert_sessions enable row level security;
alter table public.expert_session_registrations enable row level security;

create or replace function private.is_organization_admin(org_id uuid, check_user uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select check_user is not null and exists (
    select 1 from public.organization_members m
    where m.organization_id = org_id and m.user_id = check_user and m.role in ('owner','admin')
  );
$$;
revoke all on function private.is_organization_admin(uuid, uuid) from public, anon;
grant execute on function private.is_organization_admin(uuid, uuid) to authenticated, service_role;

create policy "organizations are discoverable" on public.organizations for select to anon, authenticated using (true);
create policy "create organization" on public.organizations for insert to authenticated with check (created_by = (select auth.uid()));
create policy "organization owners update" on public.organizations for update to authenticated
  using (private.is_organization_admin(id, (select auth.uid())))
  with check (private.is_organization_admin(id, (select auth.uid())));

create policy "organization members visible" on public.organization_members for select to authenticated
  using (user_id = (select auth.uid()) or private.is_organization_admin(organization_id, (select auth.uid())));
create policy "organization creator adds owner" on public.organization_members for insert to authenticated
  with check (user_id = (select auth.uid()) and role = 'owner' and exists (select 1 from public.organizations o where o.id = organization_id and o.created_by = (select auth.uid())));
create policy "organization owners manage members" on public.organization_members for all to authenticated
  using (private.is_organization_admin(organization_id, (select auth.uid())))
  with check (private.is_organization_admin(organization_id, (select auth.uid())));

create policy "own verification requests" on public.verification_requests for select to authenticated
  using (requester_id = (select auth.uid()) or private.is_staff((select auth.uid())));
create policy "submit verification request" on public.verification_requests for insert to authenticated
  with check (requester_id = (select auth.uid()) and consent_confirmed);
create policy "withdraw verification request" on public.verification_requests for update to authenticated
  using (requester_id = (select auth.uid()) and status = 'pending')
  with check (requester_id = (select auth.uid()) and status = 'withdrawn');
create policy "staff review verification" on public.verification_requests for update to authenticated
  using (private.is_staff((select auth.uid()))) with check (private.is_staff((select auth.uid())));

create policy "published expert sessions visible" on public.expert_sessions for select to anon, authenticated
  using (status = 'published' or host_id = (select auth.uid()) or private.is_staff((select auth.uid())));
create policy "experts create sessions" on public.expert_sessions for insert to authenticated with check (host_id = (select auth.uid()));
create policy "hosts manage sessions" on public.expert_sessions for update to authenticated
  using (host_id = (select auth.uid()) or private.is_staff((select auth.uid())))
  with check (host_id = (select auth.uid()) or private.is_staff((select auth.uid())));

create policy "registrations visible" on public.expert_session_registrations for select to authenticated
  using (user_id = (select auth.uid()) or exists (select 1 from public.expert_sessions s where s.id = session_id and s.host_id = (select auth.uid())) or private.is_staff((select auth.uid())));
create policy "register for expert session" on public.expert_session_registrations for insert to authenticated
  with check (user_id = (select auth.uid()) and exists (select 1 from public.expert_sessions s where s.id = session_id and s.status = 'published'));
create policy "manage session registration" on public.expert_session_registrations for update to authenticated
  using (user_id = (select auth.uid()) or exists (select 1 from public.expert_sessions s where s.id = session_id and s.host_id = (select auth.uid())))
  with check (user_id = (select auth.uid()) or exists (select 1 from public.expert_sessions s where s.id = session_id and s.host_id = (select auth.uid())));

grant select on public.organizations, public.expert_sessions to anon;
grant select, insert, update, delete on public.organizations, public.organization_members, public.verification_requests, public.expert_sessions, public.expert_session_registrations to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('avatars', 'avatars', true, 5242880, array['image/jpeg','image/png','image/webp']),
  ('project-media', 'project-media', false, 52428800, array['image/jpeg','image/png','image/webp','video/mp4','application/pdf']),
  ('evidence-vault', 'evidence-vault', false, 52428800, array['image/jpeg','image/png','application/pdf','text/plain','application/zip']),
  ('verification-documents', 'verification-documents', false, 15728640, array['image/jpeg','image/png','application/pdf']),
  ('organization-assets', 'organization-assets', true, 10485760, array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "avatar uploads owned" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "avatar updates owned" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and owner_id = (select auth.uid())::text)
  with check (bucket_id = 'avatars' and owner_id = (select auth.uid())::text);
create policy "avatar deletes owned" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and owner_id = (select auth.uid())::text);

create policy "private upload paths owned" on storage.objects for insert to authenticated
  with check (bucket_id in ('project-media','evidence-vault','verification-documents','organization-assets') and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "private objects owned read" on storage.objects for select to authenticated
  using (bucket_id in ('project-media','evidence-vault','verification-documents','organization-assets') and owner_id = (select auth.uid())::text);
create policy "private objects owned update" on storage.objects for update to authenticated
  using (bucket_id in ('project-media','evidence-vault','verification-documents','organization-assets') and owner_id = (select auth.uid())::text)
  with check (bucket_id in ('project-media','evidence-vault','verification-documents','organization-assets') and owner_id = (select auth.uid())::text);
create policy "private objects owned delete" on storage.objects for delete to authenticated
  using (bucket_id in ('project-media','evidence-vault','verification-documents','organization-assets') and owner_id = (select auth.uid())::text);

create or replace function private.log_moderation_action()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.admin_audit_log(actor_id, action, entity_type, entity_id, reason, previous_state, new_state)
  values (new.actor_id, new.action, new.subject_type, new.subject_id, new.reason, new.previous_state, new.new_state);
  return new;
end;
$$;
revoke all on function private.log_moderation_action() from public, anon, authenticated;
grant execute on function private.log_moderation_action() to service_role;

create trigger moderation_action_audit after insert on public.moderation_actions
for each row execute function private.log_moderation_action();

notify pgrst, 'reload schema';
