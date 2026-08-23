alter function public.touch_website_studio_updated_at() set search_path = public, pg_temp;

revoke execute on function public.can_access_website_studio() from anon;
revoke execute on function public.is_website_studio_admin() from anon;
grant execute on function public.can_access_website_studio() to authenticated;
grant execute on function public.is_website_studio_admin() to authenticated;

create index if not exists website_studio_deployments_project_idx
  on public.website_studio_deployments(project_id, created_at desc);
create index if not exists website_studio_deployments_requested_by_idx
  on public.website_studio_deployments(requested_by);
create index if not exists website_studio_integrations_created_by_idx
  on public.website_studio_integrations(created_by);

drop policy if exists "website studio integrations owner select" on public.website_studio_integrations;
drop policy if exists "website studio integrations owner write" on public.website_studio_integrations;
drop policy if exists "website studio deployments owner select" on public.website_studio_deployments;
drop policy if exists "website studio deployments owner insert" on public.website_studio_deployments;
drop policy if exists "website studio submissions owner select" on public.website_studio_form_submissions;

create policy "website studio integrations owner select"
on public.website_studio_integrations
for select
to authenticated
using (
  exists (
    select 1
    from public.website_studio_projects p
    where p.id = website_studio_integrations.project_id
      and (p.owner_id = (select auth.uid()) or (select public.is_website_studio_admin()))
  )
);

create policy "website studio integrations owner insert"
on public.website_studio_integrations
for insert
to authenticated
with check (
  exists (
    select 1
    from public.website_studio_projects p
    where p.id = website_studio_integrations.project_id
      and (p.owner_id = (select auth.uid()) or (select public.is_website_studio_admin()))
  )
);

create policy "website studio integrations owner update"
on public.website_studio_integrations
for update
to authenticated
using (
  exists (
    select 1
    from public.website_studio_projects p
    where p.id = website_studio_integrations.project_id
      and (p.owner_id = (select auth.uid()) or (select public.is_website_studio_admin()))
  )
)
with check (
  exists (
    select 1
    from public.website_studio_projects p
    where p.id = website_studio_integrations.project_id
      and (p.owner_id = (select auth.uid()) or (select public.is_website_studio_admin()))
  )
);

create policy "website studio integrations owner delete"
on public.website_studio_integrations
for delete
to authenticated
using (
  exists (
    select 1
    from public.website_studio_projects p
    where p.id = website_studio_integrations.project_id
      and (p.owner_id = (select auth.uid()) or (select public.is_website_studio_admin()))
  )
);

create policy "website studio deployments owner select"
on public.website_studio_deployments
for select
to authenticated
using (
  exists (
    select 1
    from public.website_studio_projects p
    where p.id = website_studio_deployments.project_id
      and (p.owner_id = (select auth.uid()) or (select public.is_website_studio_admin()))
  )
);

create policy "website studio deployments owner insert"
on public.website_studio_deployments
for insert
to authenticated
with check (
  exists (
    select 1
    from public.website_studio_projects p
    where p.id = website_studio_deployments.project_id
      and (p.owner_id = (select auth.uid()) or (select public.is_website_studio_admin()))
  )
);

create policy "website studio submissions owner select"
on public.website_studio_form_submissions
for select
to authenticated
using (
  exists (
    select 1
    from public.website_studio_projects p
    where p.id = website_studio_form_submissions.project_id
      and (p.owner_id = (select auth.uid()) or (select public.is_website_studio_admin()))
  )
);
