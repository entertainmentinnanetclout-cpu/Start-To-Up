-- Start To Up — Startup OS Phase 7: Legal, Compliance & Business Administration.
-- Private-by-default legal records, explicit workspace RLS, signed-share audit trails.

create table if not exists public.legal_setup_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  item_key text not null,
  title text not null,
  category text not null default 'company',
  status text not null default 'not_started' check (status in ('not_started','in_progress','complete','not_applicable')),
  guidance text,
  evidence_document_id uuid,
  owner_id uuid references auth.users(id) on delete set null,
  completed_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(organization_id,item_key)
);

create table if not exists public.legal_obligations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  authority text,
  category text not null default 'compliance' check (category in ('company','tax','bee','privacy','employment','licence','insurance','contract','procurement','compliance','other')),
  due_date date,
  recurrence text not null default 'once' check (recurrence in ('once','monthly','quarterly','biannual','annual','custom')),
  reminder_days integer not null default 30 check (reminder_days between 0 and 365),
  status text not null default 'active' check (status in ('active','due','complete','not_applicable','cancelled')),
  notes text,
  source_url text,
  owner_id uuid references auth.users(id) on delete set null,
  private_metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.legal_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  document_type text not null default 'other' check (document_type in ('company_registration','tax','bee','financial','bank','insurance','policy','contract','agreement','tender','supplier','identity','licence','certificate','other')),
  storage_path text not null,
  file_name text not null,
  mime_type text,
  file_size bigint check (file_size is null or file_size >= 0),
  status text not null default 'current' check (status in ('draft','current','expired','superseded','archived')),
  issue_date date,
  expiry_date date,
  reference_private text,
  public_safe_label text,
  verification_status text not null default 'unverified' check (verification_status in ('unverified','pending','verified','rejected')),
  verification_source text,
  checksum text,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.legal_setup_items drop constraint if exists legal_setup_items_evidence_document_id_fkey;
alter table public.legal_setup_items add constraint legal_setup_items_evidence_document_id_fkey foreign key (evidence_document_id) references public.legal_documents(id) on delete set null;

create table if not exists public.legal_contract_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  contract_type text not null default 'services' check (contract_type in ('cofounder','nda','services','partnership','contractor','employment','supplier','licence','other')),
  description text,
  clauses jsonb not null default '[]'::jsonb,
  is_default boolean not null default false,
  version integer not null default 1,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.legal_contracts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  template_id uuid references public.legal_contract_templates(id) on delete set null,
  title text not null,
  contract_type text not null default 'services' check (contract_type in ('cofounder','nda','services','partnership','contractor','employment','supplier','licence','other')),
  status text not null default 'draft' check (status in ('draft','review','approved','sent','part_signed','signed','declined','terminated','archived')),
  body text not null,
  clauses jsonb not null default '[]'::jsonb,
  effective_on date,
  termination_notice_days integer check (termination_notice_days is null or termination_notice_days between 0 and 3650),
  governing_law text default 'South Africa',
  version integer not null default 1,
  source_document_id uuid references public.legal_documents(id) on delete set null,
  approved_by uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.legal_contract_parties (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  contract_id uuid not null references public.legal_contracts(id) on delete cascade,
  party_name text not null,
  party_type text not null default 'company' check (party_type in ('company','individual')),
  email text,
  role_label text,
  registration_or_id_private text,
  signing_order integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.legal_signature_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  contract_id uuid not null references public.legal_contracts(id) on delete cascade,
  title text not null,
  status text not null default 'draft' check (status in ('draft','sent','viewed','part_signed','completed','declined','expired','cancelled')),
  expires_at timestamptz,
  message text,
  sequential_signing boolean not null default false,
  completed_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.legal_signature_recipients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  request_id uuid not null references public.legal_signature_requests(id) on delete cascade,
  contract_party_id uuid references public.legal_contract_parties(id) on delete set null,
  full_name text not null,
  email text not null,
  signing_order integer not null default 1,
  signer_token uuid not null default gen_random_uuid() unique,
  status text not null default 'pending' check (status in ('pending','sent','viewed','signed','declined','expired')),
  consent_text text,
  signature_type text check (signature_type is null or signature_type in ('typed','drawn','uploaded')),
  signature_value_private text,
  signature_hash text,
  signed_at timestamptz,
  signed_ip_hash text,
  signed_user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.legal_signature_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  request_id uuid not null references public.legal_signature_requests(id) on delete cascade,
  recipient_id uuid references public.legal_signature_recipients(id) on delete set null,
  event_type text not null check (event_type in ('created','sent','viewed','consented','signed','declined','expired','cancelled','downloaded')),
  actor_type text not null default 'workspace_user' check (actor_type in ('workspace_user','signer','system')),
  actor_id uuid references auth.users(id) on delete set null,
  ip_hash text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.legal_tender_assessments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  tender_name text not null,
  issuer text,
  reference text,
  source_url text,
  closing_at timestamptz,
  status text not null default 'assessing' check (status in ('assessing','ready','submitted','won','lost','withdrawn','closed')),
  readiness_score integer not null default 0 check (readiness_score between 0 and 100),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.legal_tender_requirements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  assessment_id uuid not null references public.legal_tender_assessments(id) on delete cascade,
  requirement text not null,
  category text not null default 'document',
  weight integer not null default 10 check (weight between 1 and 100),
  status text not null default 'missing' check (status in ('missing','in_progress','met','not_applicable')),
  document_id uuid references public.legal_documents(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.legal_supplier_assessments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null default 'Supplier readiness',
  target_customer text,
  status text not null default 'active' check (status in ('active','ready','submitted','archived')),
  readiness_score integer not null default 0 check (readiness_score between 0 and 100),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.legal_supplier_requirements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  assessment_id uuid not null references public.legal_supplier_assessments(id) on delete cascade,
  requirement_key text not null,
  title text not null,
  weight integer not null default 10 check (weight between 1 and 100),
  status text not null default 'missing' check (status in ('missing','in_progress','met','not_applicable')),
  document_id uuid references public.legal_documents(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(assessment_id,requirement_key)
);

create table if not exists public.legal_due_diligence_shares (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  public_token uuid not null default gen_random_uuid() unique,
  allowed_document_ids uuid[] not null default '{}',
  expires_at timestamptz not null,
  passcode_hash text,
  max_views integer check (max_views is null or max_views > 0),
  view_count integer not null default 0,
  revoked_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.legal_share_access_log (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  share_id uuid not null references public.legal_due_diligence_shares(id) on delete cascade,
  event_type text not null check (event_type in ('opened','document_viewed','downloaded','denied','expired','revoked')),
  document_id uuid references public.legal_documents(id) on delete set null,
  ip_hash text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists legal_setup_org_idx on public.legal_setup_items(organization_id,status,updated_at desc);
create index if not exists legal_obligations_org_idx on public.legal_obligations(organization_id,status,due_date);
create index if not exists legal_documents_org_idx on public.legal_documents(organization_id,document_type,status,updated_at desc);
create index if not exists legal_contracts_org_idx on public.legal_contracts(organization_id,status,updated_at desc);
create index if not exists legal_signature_requests_org_idx on public.legal_signature_requests(organization_id,status,updated_at desc);
create index if not exists legal_tender_org_idx on public.legal_tender_assessments(organization_id,status,closing_at);
create index if not exists legal_supplier_org_idx on public.legal_supplier_assessments(organization_id,status,updated_at desc);
create index if not exists legal_share_org_idx on public.legal_due_diligence_shares(organization_id,expires_at desc);

create or replace function public.legal_weighted_readiness(assessment_kind text, assessment_uuid uuid)
returns integer language plpgsql stable security definer set search_path='' as $$
declare org_id uuid; total_weight numeric:=0; met_weight numeric:=0; result integer:=0; begin
  if assessment_kind='tender' then
    select organization_id into org_id from public.legal_tender_assessments where id=assessment_uuid;
    if org_id is null or not private.startup_workspace_member(org_id,(select auth.uid())) then raise exception 'workspace access required'; end if;
    select coalesce(sum(weight) filter(where status<>'not_applicable'),0),coalesce(sum(weight) filter(where status='met'),0) into total_weight,met_weight from public.legal_tender_requirements where assessment_id=assessment_uuid;
  elsif assessment_kind='supplier' then
    select organization_id into org_id from public.legal_supplier_assessments where id=assessment_uuid;
    if org_id is null or not private.startup_workspace_member(org_id,(select auth.uid())) then raise exception 'workspace access required'; end if;
    select coalesce(sum(weight) filter(where status<>'not_applicable'),0),coalesce(sum(weight) filter(where status='met'),0) into total_weight,met_weight from public.legal_supplier_requirements where assessment_id=assessment_uuid;
  else raise exception 'unsupported assessment kind'; end if;
  result:=case when total_weight=0 then 0 else round((met_weight/total_weight)*100)::int end;
  return greatest(0,least(100,result));
end $$;

create or replace function public.legal_compliance_summary(org_id uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare setup_total int:=0; setup_done int:=0; obligations_open int:=0; obligations_due int:=0; current_docs int:=0; expiring_docs int:=0; contracts_open int:=0; signatures_open int:=0; score int:=0; begin
  if not private.startup_workspace_member(org_id,(select auth.uid())) then raise exception 'workspace access required'; end if;
  select count(*),count(*) filter(where status in ('complete','not_applicable')) into setup_total,setup_done from public.legal_setup_items where organization_id=org_id;
  select count(*) filter(where status in ('active','due')),count(*) filter(where status='due' or (due_date is not null and due_date<=current_date+30 and status='active')) into obligations_open,obligations_due from public.legal_obligations where organization_id=org_id;
  select count(*) filter(where status='current'),count(*) filter(where status='current' and expiry_date is not null and expiry_date<=current_date+30) into current_docs,expiring_docs from public.legal_documents where organization_id=org_id;
  select count(*) into contracts_open from public.legal_contracts where organization_id=org_id and status in ('draft','review','sent','part_signed');
  select count(*) into signatures_open from public.legal_signature_requests where organization_id=org_id and status in ('draft','sent','viewed','part_signed');
  score:=greatest(0,least(100,round((case when setup_total=0 then 50 else setup_done*100.0/setup_total end)*0.45 + (case when obligations_due=0 then 100 else greatest(0,100-obligations_due*20) end)*0.30 + (case when expiring_docs=0 then 100 else greatest(0,100-expiring_docs*15) end)*0.25)::int));
  return jsonb_build_object('score',score,'setup_total',setup_total,'setup_complete',setup_done,'open_obligations',obligations_open,'due_obligations',obligations_due,'current_documents',current_docs,'expiring_documents',expiring_docs,'open_contracts',contracts_open,'open_signature_requests',signatures_open);
end $$;

-- Private storage bucket. Paths must begin with organization UUID.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('legal-documents','legal-documents',false,26214400,array['application/pdf','image/png','image/jpeg','image/webp','text/plain','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists legal_documents_storage_select on storage.objects;
create policy legal_documents_storage_select on storage.objects for select to authenticated using (
  bucket_id='legal-documents' and (storage.foldername(name))[1] is not null and private.startup_workspace_member(((storage.foldername(name))[1])::uuid,(select auth.uid()))
);
drop policy if exists legal_documents_storage_insert on storage.objects;
create policy legal_documents_storage_insert on storage.objects for insert to authenticated with check (
  bucket_id='legal-documents' and (storage.foldername(name))[1] is not null and private.workspace_has_permission(((storage.foldername(name))[1])::uuid,(select auth.uid()),'company.manage')
);
drop policy if exists legal_documents_storage_update on storage.objects;
create policy legal_documents_storage_update on storage.objects for update to authenticated using (
  bucket_id='legal-documents' and (storage.foldername(name))[1] is not null and private.workspace_has_permission(((storage.foldername(name))[1])::uuid,(select auth.uid()),'company.manage')
) with check (
  bucket_id='legal-documents' and (storage.foldername(name))[1] is not null and private.workspace_has_permission(((storage.foldername(name))[1])::uuid,(select auth.uid()),'company.manage')
);
drop policy if exists legal_documents_storage_delete on storage.objects;
create policy legal_documents_storage_delete on storage.objects for delete to authenticated using (
  bucket_id='legal-documents' and (storage.foldername(name))[1] is not null and private.workspace_has_permission(((storage.foldername(name))[1])::uuid,(select auth.uid()),'company.manage')
);

do $$ declare t text; begin
  foreach t in array array['legal_setup_items','legal_obligations','legal_documents','legal_contract_templates','legal_contracts','legal_contract_parties','legal_signature_requests','legal_signature_recipients','legal_signature_events','legal_tender_assessments','legal_tender_requirements','legal_supplier_assessments','legal_supplier_requirements','legal_due_diligence_shares','legal_share_access_log'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('drop policy if exists %I on public.%I',t||'_select',t);
    execute format('create policy %I on public.%I for select to authenticated using (private.startup_workspace_member(organization_id,(select auth.uid())))',t||'_select',t);
    execute format('drop policy if exists %I on public.%I',t||'_insert',t);
    execute format('create policy %I on public.%I for insert to authenticated with check (private.workspace_has_permission(organization_id,(select auth.uid()),''company.manage''))',t||'_insert',t);
    execute format('drop policy if exists %I on public.%I',t||'_update',t);
    execute format('create policy %I on public.%I for update to authenticated using (private.workspace_has_permission(organization_id,(select auth.uid()),''company.manage'')) with check (private.workspace_has_permission(organization_id,(select auth.uid()),''company.manage''))',t||'_update',t);
    execute format('drop policy if exists %I on public.%I',t||'_delete',t);
    execute format('create policy %I on public.%I for delete to authenticated using (private.workspace_has_permission(organization_id,(select auth.uid()),''company.manage''))',t||'_delete',t);
  end loop;
end $$;

revoke all on function public.legal_compliance_summary(uuid) from public;
grant execute on function public.legal_compliance_summary(uuid) to authenticated;
revoke all on function public.legal_weighted_readiness(text,uuid) from public;
grant execute on function public.legal_weighted_readiness(text,uuid) to authenticated;
