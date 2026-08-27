-- Startup OS Phase 0 trust hardening.
-- Verified status and regulator-logo authorisation are platform review decisions,
-- not self-asserted workspace fields.

alter table public.company_profiles
  drop column if exists public_registration_status,
  drop column if exists public_tax_status,
  drop column if exists public_bbbee_status,
  drop column if exists bbbee_level,
  drop column if exists procurement_recognition;

-- Workspace members can prepare evidence, but only platform staff can mark a record verified.
drop policy if exists "phase0 verification manage" on public.company_verification_records;

create policy "phase0 verification submit pending" on public.company_verification_records
for insert to authenticated
with check (
  private.workspace_has_permission(organization_id,auth.uid(),'verification.manage')
  and status in ('unverified','pending')
  and verified_by is null
  and verified_at is null
);

create policy "phase0 verification edit pending" on public.company_verification_records
for update to authenticated
using (
  private.workspace_has_permission(organization_id,auth.uid(),'verification.manage')
  and status in ('unverified','pending')
)
with check (
  private.workspace_has_permission(organization_id,auth.uid(),'verification.manage')
  and status in ('unverified','pending')
  and verified_by is null
  and verified_at is null
);

create policy "phase0 verification delete pending" on public.company_verification_records
for delete to authenticated
using (
  private.workspace_has_permission(organization_id,auth.uid(),'verification.manage')
  and status in ('unverified','pending')
);

create policy "phase0 verification staff insert" on public.company_verification_records
for insert to authenticated
with check (public.is_staff(auth.uid()));

create policy "phase0 verification staff review" on public.company_verification_records
for update to authenticated
using (public.is_staff(auth.uid()))
with check (public.is_staff(auth.uid()));

create policy "phase0 verification staff delete" on public.company_verification_records
for delete to authenticated
using (public.is_staff(auth.uid()));

-- Workspace owners may submit logo-permission evidence, but cannot self-authorise an official mark.
drop policy if exists "phase0 logo permission manage" on public.regulator_logo_permissions;

create policy "phase0 logo permission submit" on public.regulator_logo_permissions
for insert to authenticated
with check (
  private.workspace_has_permission(organization_id,auth.uid(),'verification.manage')
  and status in ('not_assessed','restricted')
  and reviewed_by is null
  and reviewed_at is null
);

create policy "phase0 logo permission edit pending" on public.regulator_logo_permissions
for update to authenticated
using (
  private.workspace_has_permission(organization_id,auth.uid(),'verification.manage')
  and status in ('not_assessed','restricted')
)
with check (
  private.workspace_has_permission(organization_id,auth.uid(),'verification.manage')
  and status in ('not_assessed','restricted')
  and reviewed_by is null
  and reviewed_at is null
);

create policy "phase0 logo permission delete pending" on public.regulator_logo_permissions
for delete to authenticated
using (
  private.workspace_has_permission(organization_id,auth.uid(),'verification.manage')
  and status in ('not_assessed','restricted')
);

create policy "phase0 logo permission staff insert" on public.regulator_logo_permissions
for insert to authenticated
with check (public.is_staff(auth.uid()));

create policy "phase0 logo permission staff review" on public.regulator_logo_permissions
for update to authenticated
using (public.is_staff(auth.uid()))
with check (public.is_staff(auth.uid()));

create policy "phase0 logo permission staff delete" on public.regulator_logo_permissions
for delete to authenticated
using (public.is_staff(auth.uid()));

-- Return records safely for DELETE/INSERT/UPDATE trigger operations.
create or replace function private.audit_workspace_change()
returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  before_state jsonb;
  after_state jsonb;
  state jsonb;
  org_id uuid;
  object_id uuid;
begin
  before_state := case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) else null end;
  after_state := case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) else null end;
  state := coalesce(after_state,before_state,'{}'::jsonb);
  org_id := nullif(state->>'organization_id','')::uuid;
  object_id := coalesce(nullif(state->>'id','')::uuid,org_id);

  if org_id is not null then
    insert into public.workspace_audit_log(
      organization_id,actor_id,action,entity_type,entity_id,previous_state,new_state
    ) values (
      org_id,auth.uid(),lower(tg_op),tg_table_name,object_id,before_state,after_state
    );
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

revoke all on function private.audit_workspace_change() from public, anon, authenticated;
grant execute on function private.audit_workspace_change() to service_role;

notify pgrst,'reload schema';
