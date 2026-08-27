-- Startup OS Phase 0 — trust, identity, workspaces, integrations and shared business primitives.
-- Public UI must never expose registration dates, certificate issue/expiry dates, tax references,
-- personal identity numbers, residential addresses or private verification documents.

create type if not exists public.workspace_member_role as enum ('owner','admin','editor','member','viewer');
create type if not exists public.workspace_permission_key as enum (
  'workspace.manage','members.manage','company.manage','documents.manage','metrics.manage',
  'tasks.manage','integrations.manage','verification.manage','feature_flags.manage','audit.read'
);
create type if not exists public.integration_connection_status as enum ('disconnected','ready','connected','error');
create type if not exists public.verification_record_kind as enum ('company_registration','tax_registration','bbbee','bank','insurance','supplier','other');
create type if not exists public.verification_record_status as enum ('unverified','pending','verified','rejected','revoked');
create type if not exists public.logo_permission_status as enum ('not_assessed','restricted','authorised','expired','revoked');
create type if not exists public.workspace_task_status as enum ('todo','in_progress','blocked','done','cancelled');
create type if not exists public.workspace_task_priority as enum ('low','normal','high','urgent');

alter table public.organizations
  add column if not exists legal_name text,
  add column if not exists registration_number text,
  add column if not exists workspace_status text not null default 'active',
  add column if not exists default_currency text not null default 'ZAR',
  add column if not exists timezone text not null default 'Africa/Johannesburg',
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.organization_members
  add column if not exists workspace_role public.workspace_member_role,
  add column if not exists invited_by uuid references auth.users(id) on delete set null,
  add column if not exists last_active_at timestamptz;

update public.organization_members
set workspace_role = case role::text
  when 'owner' then 'owner'::public.workspace_member_role
  when 'admin' then 'admin'::public.workspace_member_role
  else 'member'::public.workspace_member_role
end
where workspace_role is null;

alter table public.organization_members alter column workspace_role set default 'member';
alter table public.organization_members alter column workspace_role set not null;

create table if not exists public.workspace_member_permissions (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  permission public.workspace_permission_key not null,
  granted boolean not null default true,
  granted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (organization_id,user_id,permission)
);

create table if not exists public.company_profiles (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  trading_name text,
  legal_name text,
  registration_number text,
  business_type text,
  industry text,
  description text,
  website text,
  email text,
  phone text,
  address_line text,
  city text,
  province text,
  country text not null default 'South Africa',
  postal_code text,
  public_registration_status boolean not null default false,
  public_tax_status boolean not null default false,
  public_bbbee_status boolean not null default false,
  bbbee_level text,
  procurement_recognition text,
  brand_config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.company_contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  full_name text not null,
  job_title text,
  email text,
  phone text,
  contact_type text not null default 'general',
  is_primary boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.company_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  document_type text not null,
  title text not null,
  storage_path text not null,
  visibility text not null default 'private' check (visibility in ('private','workspace','due_diligence')),
  checksum_sha256 text,
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  metadata jsonb not null default '{}'::jsonb,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.company_verification_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  kind public.verification_record_kind not null,
  status public.verification_record_status not null default 'unverified',
  public_label text,
  public_detail text,
  evidence_document_id uuid references public.company_documents(id) on delete set null,
  private_reference text,
  issued_at date,
  expires_at date,
  verified_by uuid references auth.users(id) on delete set null,
  verified_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id,kind)
);

create table if not exists public.regulator_logo_permissions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  authority_name text not null,
  logo_key text not null,
  status public.logo_permission_status not null default 'not_assessed',
  permission_source_url text,
  permission_document_id uuid references public.company_documents(id) on delete set null,
  allowed_context text,
  restrictions text,
  internal_expiry_at date,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id,logo_key)
);

create table if not exists public.company_metrics (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  metric_key text not null,
  label text not null,
  value_numeric numeric,
  value_text text,
  unit text,
  period_start date,
  period_end date,
  source text,
  confidence text not null default 'owner_entered' check (confidence in ('owner_entered','observed','estimated','verified')),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 240),
  description text,
  status public.workspace_task_status not null default 'todo',
  priority public.workspace_task_priority not null default 'normal',
  due_at timestamptz,
  assignee_id uuid references auth.users(id) on delete set null,
  module_key text,
  entity_type text,
  entity_id uuid,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_activities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  summary text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.workspace_audit_log (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  previous_state jsonb,
  new_state jsonb,
  ip_hash text,
  user_agent text,
  created_at timestamptz not null default now()
);

create table if not exists public.startup_os_integrations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  provider text not null,
  status public.integration_connection_status not null default 'disconnected',
  config jsonb not null default '{}'::jsonb,
  external_url text,
  external_account_id text,
  credential_hint text,
  last_checked_at timestamptz,
  last_error text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id,provider)
);

create table if not exists public.startup_os_provider_credentials (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  provider text not null,
  ciphertext text not null,
  iv text not null,
  credential_hint text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (organization_id,provider)
);

create table if not exists public.feature_flags (
  flag_key text primary key,
  description text not null,
  enabled_by_default boolean not null default false,
  rollout_percent integer not null default 0 check (rollout_percent between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_feature_flags (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  flag_key text not null references public.feature_flags(flag_key) on delete cascade,
  enabled boolean not null,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (organization_id,flag_key)
);

create table if not exists public.user_session_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_fingerprint text not null,
  device_label text,
  last_seen_at timestamptz not null default now(),
  first_seen_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  unique (user_id,session_fingerprint)
);

create index if not exists company_contacts_org_idx on public.company_contacts(organization_id,created_at desc);
create index if not exists company_documents_org_idx on public.company_documents(organization_id,created_at desc);
create index if not exists company_verification_org_idx on public.company_verification_records(organization_id,status);
create index if not exists company_metrics_org_idx on public.company_metrics(organization_id,metric_key,period_end desc);
create index if not exists workspace_tasks_org_idx on public.workspace_tasks(organization_id,status,due_at);
create index if not exists workspace_activities_org_idx on public.workspace_activities(organization_id,created_at desc);
create index if not exists workspace_audit_org_idx on public.workspace_audit_log(organization_id,created_at desc);
create index if not exists startup_os_integrations_org_idx on public.startup_os_integrations(organization_id,status);
create index if not exists session_activity_user_idx on public.user_session_activity(user_id,last_seen_at desc);

create or replace function private.workspace_role(org_id uuid, check_user uuid)
returns public.workspace_member_role language sql stable security definer set search_path = '' as $$
  select m.workspace_role from public.organization_members m
  where m.organization_id = org_id and m.user_id = check_user
  limit 1;
$$;

create or replace function private.workspace_has_permission(org_id uuid, check_user uuid, permission_key public.workspace_permission_key)
returns boolean language sql stable security definer set search_path = '' as $$
  select check_user is not null and (
    exists (select 1 from public.organization_members m where m.organization_id = org_id and m.user_id = check_user and m.workspace_role in ('owner','admin'))
    or exists (select 1 from public.workspace_member_permissions p where p.organization_id = org_id and p.user_id = check_user and p.permission = permission_key and p.granted)
    or (
      permission_key not in ('workspace.manage','members.manage','integrations.manage','verification.manage','feature_flags.manage','audit.read')
      and exists (select 1 from public.organization_members m where m.organization_id = org_id and m.user_id = check_user and m.workspace_role = 'editor')
    )
    or (
      permission_key in ('tasks.manage','metrics.manage')
      and exists (select 1 from public.organization_members m where m.organization_id = org_id and m.user_id = check_user and m.workspace_role = 'member')
    )
  );
$$;

revoke all on function private.workspace_role(uuid,uuid) from public, anon;
revoke all on function private.workspace_has_permission(uuid,uuid,public.workspace_permission_key) from public, anon;
grant execute on function private.workspace_role(uuid,uuid), private.workspace_has_permission(uuid,uuid,public.workspace_permission_key) to authenticated, service_role;

create or replace function public.create_startup_workspace(workspace_name text, workspace_slug text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare new_id uuid;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if workspace_name is null or char_length(trim(workspace_name)) < 2 then raise exception 'workspace name required'; end if;
  if workspace_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then raise exception 'invalid workspace slug'; end if;
  insert into public.organizations(slug,name,organization_type,created_by)
  values (workspace_slug,trim(workspace_name),'company',auth.uid()) returning id into new_id;
  insert into public.organization_members(organization_id,user_id,role,workspace_role)
  values (new_id,auth.uid(),'owner','owner') on conflict do nothing;
  insert into public.company_profiles(organization_id,trading_name,legal_name)
  values (new_id,trim(workspace_name),trim(workspace_name)) on conflict do nothing;
  insert into public.workspace_activities(organization_id,actor_id,action,summary)
  values (new_id,auth.uid(),'workspace.created','Workspace created');
  return new_id;
end;
$$;
revoke all on function public.create_startup_workspace(text,text) from public, anon;
grant execute on function public.create_startup_workspace(text,text) to authenticated;

create or replace function public.my_startup_workspaces()
returns table (organization_id uuid, slug text, name text, role public.workspace_member_role, is_verified boolean)
language sql stable security definer set search_path = '' as $$
  select o.id,o.slug,o.name,m.workspace_role,o.is_verified
  from public.organization_members m join public.organizations o on o.id=m.organization_id
  where m.user_id=auth.uid() order by o.name;
$$;
revoke all on function public.my_startup_workspaces() from public, anon;
grant execute on function public.my_startup_workspaces() to authenticated;

create or replace function public.current_feature_flags(org_id uuid)
returns table(flag_key text, enabled boolean) language sql stable security definer set search_path = '' as $$
  select f.flag_key, coalesce(w.enabled, f.enabled_by_default or (f.rollout_percent >= 100))
  from public.feature_flags f
  left join public.workspace_feature_flags w on w.flag_key=f.flag_key and w.organization_id=org_id
  where exists(select 1 from public.organization_members m where m.organization_id=org_id and m.user_id=auth.uid());
$$;
revoke all on function public.current_feature_flags(uuid) from public, anon;
grant execute on function public.current_feature_flags(uuid) to authenticated;

alter table public.workspace_member_permissions enable row level security;
alter table public.company_profiles enable row level security;
alter table public.company_contacts enable row level security;
alter table public.company_documents enable row level security;
alter table public.company_verification_records enable row level security;
alter table public.regulator_logo_permissions enable row level security;
alter table public.company_metrics enable row level security;
alter table public.workspace_tasks enable row level security;
alter table public.workspace_activities enable row level security;
alter table public.workspace_audit_log enable row level security;
alter table public.startup_os_integrations enable row level security;
alter table public.startup_os_provider_credentials enable row level security;
alter table public.feature_flags enable row level security;
alter table public.workspace_feature_flags enable row level security;
alter table public.user_session_activity enable row level security;

create policy "workspace permissions visible to admins" on public.workspace_member_permissions for select to authenticated
  using (user_id=auth.uid() or private.workspace_has_permission(organization_id,auth.uid(),'members.manage'));
create policy "workspace permissions managed by admins" on public.workspace_member_permissions for all to authenticated
  using (private.workspace_has_permission(organization_id,auth.uid(),'members.manage'))
  with check (private.workspace_has_permission(organization_id,auth.uid(),'members.manage'));

create policy "company profile workspace read" on public.company_profiles for select to authenticated
  using (exists(select 1 from public.organization_members m where m.organization_id=company_profiles.organization_id and m.user_id=auth.uid()));
create policy "company profile workspace manage" on public.company_profiles for all to authenticated
  using (private.workspace_has_permission(organization_id,auth.uid(),'company.manage'))
  with check (private.workspace_has_permission(organization_id,auth.uid(),'company.manage'));

create policy "company contacts workspace read" on public.company_contacts for select to authenticated
  using (exists(select 1 from public.organization_members m where m.organization_id=company_contacts.organization_id and m.user_id=auth.uid()));
create policy "company contacts manage" on public.company_contacts for all to authenticated
  using (private.workspace_has_permission(organization_id,auth.uid(),'company.manage'))
  with check (private.workspace_has_permission(organization_id,auth.uid(),'company.manage'));

create policy "company documents workspace read" on public.company_documents for select to authenticated
  using (exists(select 1 from public.organization_members m where m.organization_id=company_documents.organization_id and m.user_id=auth.uid()));
create policy "company documents manage" on public.company_documents for all to authenticated
  using (private.workspace_has_permission(organization_id,auth.uid(),'documents.manage'))
  with check (private.workspace_has_permission(organization_id,auth.uid(),'documents.manage'));

create policy "verification workspace read" on public.company_verification_records for select to authenticated
  using (exists(select 1 from public.organization_members m where m.organization_id=company_verification_records.organization_id and m.user_id=auth.uid()));
create policy "verification workspace manage" on public.company_verification_records for all to authenticated
  using (private.workspace_has_permission(organization_id,auth.uid(),'verification.manage'))
  with check (private.workspace_has_permission(organization_id,auth.uid(),'verification.manage'));

create policy "logo permission workspace read" on public.regulator_logo_permissions for select to authenticated
  using (exists(select 1 from public.organization_members m where m.organization_id=regulator_logo_permissions.organization_id and m.user_id=auth.uid()));
create policy "logo permission manage" on public.regulator_logo_permissions for all to authenticated
  using (private.workspace_has_permission(organization_id,auth.uid(),'verification.manage'))
  with check (private.workspace_has_permission(organization_id,auth.uid(),'verification.manage'));

create policy "metrics workspace read" on public.company_metrics for select to authenticated
  using (exists(select 1 from public.organization_members m where m.organization_id=company_metrics.organization_id and m.user_id=auth.uid()));
create policy "metrics manage" on public.company_metrics for all to authenticated
  using (private.workspace_has_permission(organization_id,auth.uid(),'metrics.manage'))
  with check (private.workspace_has_permission(organization_id,auth.uid(),'metrics.manage'));

create policy "tasks workspace read" on public.workspace_tasks for select to authenticated
  using (exists(select 1 from public.organization_members m where m.organization_id=workspace_tasks.organization_id and m.user_id=auth.uid()));
create policy "tasks manage" on public.workspace_tasks for all to authenticated
  using (private.workspace_has_permission(organization_id,auth.uid(),'tasks.manage'))
  with check (private.workspace_has_permission(organization_id,auth.uid(),'tasks.manage'));

create policy "activities workspace read" on public.workspace_activities for select to authenticated
  using (exists(select 1 from public.organization_members m where m.organization_id=workspace_activities.organization_id and m.user_id=auth.uid()));
create policy "activities append" on public.workspace_activities for insert to authenticated
  with check (actor_id=auth.uid() and exists(select 1 from public.organization_members m where m.organization_id=workspace_activities.organization_id and m.user_id=auth.uid()));

create policy "audit admins read" on public.workspace_audit_log for select to authenticated
  using (private.workspace_has_permission(organization_id,auth.uid(),'audit.read'));

create policy "integrations workspace read" on public.startup_os_integrations for select to authenticated
  using (exists(select 1 from public.organization_members m where m.organization_id=startup_os_integrations.organization_id and m.user_id=auth.uid()));
create policy "integrations manage" on public.startup_os_integrations for all to authenticated
  using (private.workspace_has_permission(organization_id,auth.uid(),'integrations.manage'))
  with check (private.workspace_has_permission(organization_id,auth.uid(),'integrations.manage'));

-- Credential ciphertext is intentionally not selectable by normal authenticated clients.
-- Only the service role Edge Function reads/writes this table.

create policy "feature flags readable" on public.feature_flags for select to authenticated using (true);
create policy "feature flags staff manage" on public.feature_flags for all to authenticated
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "workspace flags read" on public.workspace_feature_flags for select to authenticated
  using (exists(select 1 from public.organization_members m where m.organization_id=workspace_feature_flags.organization_id and m.user_id=auth.uid()));
create policy "workspace flags manage" on public.workspace_feature_flags for all to authenticated
  using (private.workspace_has_permission(organization_id,auth.uid(),'feature_flags.manage'))
  with check (private.workspace_has_permission(organization_id,auth.uid(),'feature_flags.manage'));

create policy "session activity own" on public.user_session_activity for select to authenticated using (user_id=auth.uid());
create policy "session activity own upsert" on public.user_session_activity for insert to authenticated with check (user_id=auth.uid());
create policy "session activity own update" on public.user_session_activity for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy "session activity own delete" on public.user_session_activity for delete to authenticated using (user_id=auth.uid());

grant select,insert,update,delete on public.workspace_member_permissions,public.company_profiles,public.company_contacts,
  public.company_documents,public.company_verification_records,public.regulator_logo_permissions,public.company_metrics,
  public.workspace_tasks,public.workspace_activities,public.startup_os_integrations,public.workspace_feature_flags,public.user_session_activity to authenticated;
grant select on public.workspace_audit_log,public.feature_flags to authenticated;
grant all on public.startup_os_provider_credentials,public.workspace_audit_log to service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('company-vault','company-vault',false,52428800,array['application/pdf','image/jpeg','image/png','image/webp','text/csv','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create policy "company vault upload own workspace" on storage.objects for insert to authenticated
with check (bucket_id='company-vault' and exists(
  select 1 from public.organization_members m
  where m.organization_id::text=(storage.foldername(name))[1] and m.user_id=auth.uid()
));
create policy "company vault read workspace" on storage.objects for select to authenticated
using (bucket_id='company-vault' and exists(
  select 1 from public.organization_members m
  where m.organization_id::text=(storage.foldername(name))[1] and m.user_id=auth.uid()
));
create policy "company vault update workspace" on storage.objects for update to authenticated
using (bucket_id='company-vault' and exists(
  select 1 from public.organization_members m
  where m.organization_id::text=(storage.foldername(name))[1] and m.user_id=auth.uid()
)) with check (bucket_id='company-vault' and exists(
  select 1 from public.organization_members m
  where m.organization_id::text=(storage.foldername(name))[1] and m.user_id=auth.uid()
));
create policy "company vault delete workspace" on storage.objects for delete to authenticated
using (bucket_id='company-vault' and exists(
  select 1 from public.organization_members m
  where m.organization_id::text=(storage.foldername(name))[1] and m.user_id=auth.uid()
));

insert into public.feature_flags(flag_key,description,enabled_by_default,rollout_percent) values
('startup_os.foundation','Startup OS foundation workspace',true,100),
('startup_os.integrations','Global integration centre',true,100),
('startup_os.company_intelligence','Phase 1 company intelligence',false,0),
('startup_os.finance','Phase 2 founder finance',false,0),
('startup_os.launch','Phase 3 build and launch',false,0)
on conflict(flag_key) do update set description=excluded.description;

notify pgrst,'reload schema';
