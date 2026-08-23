create index expert_session_registrations_decided_by_idx on public.expert_session_registrations(decided_by) where decided_by is not null;
create index expert_sessions_organization_idx on public.expert_sessions(organization_id) where organization_id is not null;
create index verification_requests_organization_idx on public.verification_requests(organization_id) where organization_id is not null;
create index verification_requests_reviewed_by_idx on public.verification_requests(reviewed_by) where reviewed_by is not null;

drop policy "organization creator adds owner" on public.organization_members;
drop policy "organization owners manage members" on public.organization_members;

create policy "organization member insert" on public.organization_members for insert to authenticated
  with check (
    (user_id = (select auth.uid()) and role = 'owner' and exists (
      select 1 from public.organizations o where o.id = organization_id and o.created_by = (select auth.uid())
    ))
    or private.is_organization_admin(organization_id, (select auth.uid()))
  );
create policy "organization owners update members" on public.organization_members for update to authenticated
  using (private.is_organization_admin(organization_id, (select auth.uid())))
  with check (private.is_organization_admin(organization_id, (select auth.uid())));
create policy "organization owners remove members" on public.organization_members for delete to authenticated
  using (private.is_organization_admin(organization_id, (select auth.uid())));

drop policy "withdraw verification request" on public.verification_requests;
drop policy "staff review verification" on public.verification_requests;
create policy "verification request decisions" on public.verification_requests for update to authenticated
  using (
    private.is_staff((select auth.uid()))
    or (requester_id = (select auth.uid()) and status = 'pending')
  )
  with check (
    private.is_staff((select auth.uid()))
    or (requester_id = (select auth.uid()) and status = 'withdrawn')
  );

notify pgrst, 'reload schema';
