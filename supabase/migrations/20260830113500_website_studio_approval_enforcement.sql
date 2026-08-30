-- Server-side enforcement for Website Studio approval/commercial controls.

create or replace function private.enforce_website_studio_approved_account()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if auth.role() = 'service_role' then return new; end if;
  if not public.can_access_website_studio() then
    raise exception 'website studio approval required';
  end if;
  return new;
end;$$;

create or replace function private.enforce_website_studio_publication_access()
returns trigger language plpgsql security definer set search_path='' as $$
declare template_value text;
begin
  if auth.role() = 'service_role' then return new; end if;
  select p.template_key into template_value from public.website_studio_projects p where p.id=new.project_id;
  if template_value is null or not public.can_extract_website_studio(template_value,'publish') then
    raise exception 'website studio publication entitlement required';
  end if;
  return new;
end;$$;

revoke all on function private.enforce_website_studio_approved_account() from public,anon;
revoke all on function private.enforce_website_studio_publication_access() from public,anon;

drop trigger if exists enforce_website_studio_project_approval on public.website_studio_projects;
create trigger enforce_website_studio_project_approval before insert or update on public.website_studio_projects
for each row execute function private.enforce_website_studio_approved_account();

drop trigger if exists enforce_website_studio_asset_approval on public.website_studio_assets;
create trigger enforce_website_studio_asset_approval before insert or update on public.website_studio_assets
for each row execute function private.enforce_website_studio_approved_account();

drop trigger if exists enforce_website_studio_publication_approval on public.website_studio_publication_jobs;
create trigger enforce_website_studio_publication_approval before insert on public.website_studio_publication_jobs
for each row execute function private.enforce_website_studio_publication_access();

-- Tighten the asset table policy so normal browser inserts must also be approved.
drop policy if exists website_studio_assets_insert_owner on public.website_studio_assets;
create policy website_studio_assets_insert_owner on public.website_studio_assets
for insert to authenticated
with check (owner_id=(select auth.uid()) and public.can_access_website_studio());

notify pgrst,'reload schema';
