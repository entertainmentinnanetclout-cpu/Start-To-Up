-- Keep privileged RLS helpers out of the exposed Data API schema.
-- PostgreSQL policy dependencies follow the function OIDs when functions move,
-- so existing policies continue to work without being recreated.

create schema if not exists private;

alter function public.has_role(uuid, public.app_role) set schema private;
alter function public.is_staff(uuid) set schema private;
alter function public.is_admin(uuid) set schema private;
alter function public.can_view_project(uuid, uuid) set schema private;
alter function public.can_edit_project(uuid, uuid) set schema private;
alter function public.is_conversation_participant(uuid, uuid) set schema private;
alter function public.handle_new_user() set schema private;

alter function private.has_role(uuid, public.app_role) set search_path = '';
alter function private.is_staff(uuid) set search_path = '';
alter function private.is_admin(uuid) set search_path = '';
alter function private.can_view_project(uuid, uuid) set search_path = '';
alter function private.can_edit_project(uuid, uuid) set search_path = '';
alter function private.is_conversation_participant(uuid, uuid) set search_path = '';
alter function private.handle_new_user() set search_path = '';

revoke all on schema private from public, anon, authenticated;
revoke execute on all functions in schema private from public, anon, authenticated;

-- Policies execute these helpers internally. Grant only the minimum database
-- privileges needed for policy evaluation; the private schema is not exposed
-- through PostgREST, so these functions are not available as RPC endpoints.
grant usage on schema private to anon, authenticated;
grant execute on function private.can_view_project(uuid, uuid) to anon, authenticated;
grant execute on function private.is_staff(uuid) to anon, authenticated;
grant execute on function private.has_role(uuid, public.app_role) to authenticated;
grant execute on function private.is_admin(uuid) to authenticated;
grant execute on function private.can_edit_project(uuid, uuid) to authenticated;
grant execute on function private.is_conversation_participant(uuid, uuid) to authenticated;

-- The auth.users trigger invokes this internally; clients must never call it.
revoke execute on function private.handle_new_user() from public, anon, authenticated;
