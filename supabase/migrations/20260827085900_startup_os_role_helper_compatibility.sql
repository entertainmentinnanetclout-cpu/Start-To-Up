-- Startup OS compatibility bridge for platform role helpers.
-- Phase 0 policies call the public helpers while the platform's canonical role checks live in private.

create or replace function public.is_admin(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path=''
as $$
  select private.is_admin(_user_id);
$$;

create or replace function public.is_staff(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path=''
as $$
  select private.is_staff(_user_id);
$$;

revoke all on function public.is_admin(uuid) from public, anon;
revoke all on function public.is_staff(uuid) from public, anon;
grant execute on function public.is_admin(uuid) to authenticated, service_role;
grant execute on function public.is_staff(uuid) to authenticated, service_role;
