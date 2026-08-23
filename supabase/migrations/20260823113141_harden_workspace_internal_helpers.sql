-- Keep workspace authorization helpers out of the exposed public RPC surface.

create or replace function private.is_workspace_member(_workspace_id uuid, _user_id uuid)
returns boolean language sql stable security definer set search_path=''
as $$
  select _user_id is not null and exists(
    select 1 from public.collaboration_workspace_members m
    where m.workspace_id=_workspace_id and m.user_id=_user_id and m.status='active'
  );
$$;

create or replace function private.can_manage_workspace(_workspace_id uuid, _user_id uuid)
returns boolean language sql stable security definer set search_path=''
as $$
  select _user_id is not null and (
    exists(select 1 from public.collaboration_workspaces w where w.id=_workspace_id and w.created_by=_user_id)
    or exists(select 1 from public.collaboration_workspace_members m where m.workspace_id=_workspace_id and m.user_id=_user_id and m.status='active' and m.can_manage)
    or private.is_staff(_user_id)
  );
$$;

create or replace function private.can_access_workspace(_workspace_id uuid, _user_id uuid)
returns boolean language sql stable security definer set search_path=''
as $$
  select private.can_manage_workspace(_workspace_id,_user_id)
      or private.is_workspace_member(_workspace_id,_user_id);
$$;

revoke all on function private.is_workspace_member(uuid,uuid) from public;
revoke all on function private.can_manage_workspace(uuid,uuid) from public;
revoke all on function private.can_access_workspace(uuid,uuid) from public;
grant execute on function private.is_workspace_member(uuid,uuid) to anon,authenticated,service_role;
grant execute on function private.can_manage_workspace(uuid,uuid) to anon,authenticated,service_role;
grant execute on function private.can_access_workspace(uuid,uuid) to anon,authenticated,service_role;

drop policy if exists "workspace summaries visible" on public.collaboration_workspaces;
create policy "workspace summaries visible" on public.collaboration_workspaces for select to anon,authenticated
using((is_public and status in ('open','active','completed')) or created_by=auth.uid() or private.is_workspace_member(id,auth.uid()) or private.is_staff(auth.uid()));
drop policy if exists "workspace managers update" on public.collaboration_workspaces;
create policy "workspace managers update" on public.collaboration_workspaces for update to authenticated using(private.can_manage_workspace(id,auth.uid())) with check(private.can_manage_workspace(id,auth.uid()));
drop policy if exists "workspace managers delete" on public.collaboration_workspaces;
create policy "workspace managers delete" on public.collaboration_workspaces for delete to authenticated using(private.can_manage_workspace(id,auth.uid()));

drop policy if exists "workspace members visible" on public.collaboration_workspace_members;
create policy "workspace members visible" on public.collaboration_workspace_members for select to authenticated using(user_id=auth.uid() or private.can_access_workspace(workspace_id,auth.uid()) or private.can_manage_workspace(workspace_id,auth.uid()));
drop policy if exists "request or add workspace member" on public.collaboration_workspace_members;
create policy "request or add workspace member" on public.collaboration_workspace_members for insert to authenticated with check(private.can_manage_workspace(workspace_id,auth.uid()) or (user_id=auth.uid() and status='requested' and exists(select 1 from public.collaboration_workspaces w where w.id=workspace_id and w.is_public and w.status in ('open','active'))));
drop policy if exists "workspace managers update members" on public.collaboration_workspace_members;
create policy "workspace managers update members" on public.collaboration_workspace_members for update to authenticated using(private.can_manage_workspace(workspace_id,auth.uid())) with check(private.can_manage_workspace(workspace_id,auth.uid()));
drop policy if exists "cancel own workspace request" on public.collaboration_workspace_members;
create policy "cancel own workspace request" on public.collaboration_workspace_members for delete to authenticated using(user_id=auth.uid() or private.can_manage_workspace(workspace_id,auth.uid()));

drop policy if exists "room messages visible" on public.collaboration_workspace_messages;
create policy "room messages visible" on public.collaboration_workspace_messages for select to authenticated using(private.can_access_workspace(workspace_id,auth.uid()));
drop policy if exists "room members message" on public.collaboration_workspace_messages;
create policy "room members message" on public.collaboration_workspace_messages for insert to authenticated with check(author_id=auth.uid() and private.can_access_workspace(workspace_id,auth.uid()));
drop policy if exists "authors update room messages" on public.collaboration_workspace_messages;
create policy "authors update room messages" on public.collaboration_workspace_messages for update to authenticated using(author_id=auth.uid() or private.can_manage_workspace(workspace_id,auth.uid())) with check(author_id=auth.uid() or private.can_manage_workspace(workspace_id,auth.uid()));
drop policy if exists "authors delete room messages" on public.collaboration_workspace_messages;
create policy "authors delete room messages" on public.collaboration_workspace_messages for delete to authenticated using(author_id=auth.uid() or private.can_manage_workspace(workspace_id,auth.uid()));

drop policy if exists "room tasks visible" on public.collaboration_workspace_tasks;
create policy "room tasks visible" on public.collaboration_workspace_tasks for select to authenticated using(private.can_access_workspace(workspace_id,auth.uid()));
drop policy if exists "room members create tasks" on public.collaboration_workspace_tasks;
create policy "room members create tasks" on public.collaboration_workspace_tasks for insert to authenticated with check(created_by=auth.uid() and private.can_access_workspace(workspace_id,auth.uid()));
drop policy if exists "room members update tasks" on public.collaboration_workspace_tasks;
create policy "room members update tasks" on public.collaboration_workspace_tasks for update to authenticated using(private.can_access_workspace(workspace_id,auth.uid())) with check(private.can_access_workspace(workspace_id,auth.uid()));
drop policy if exists "room managers delete tasks" on public.collaboration_workspace_tasks;
create policy "room managers delete tasks" on public.collaboration_workspace_tasks for delete to authenticated using(created_by=auth.uid() or private.can_manage_workspace(workspace_id,auth.uid()));

drop policy if exists "room files visible" on public.collaboration_workspace_files;
create policy "room files visible" on public.collaboration_workspace_files for select to authenticated using(private.can_access_workspace(workspace_id,auth.uid()));
drop policy if exists "room members register files" on public.collaboration_workspace_files;
create policy "room members register files" on public.collaboration_workspace_files for insert to authenticated with check(uploaded_by=auth.uid() and private.can_access_workspace(workspace_id,auth.uid()));
drop policy if exists "room members update files" on public.collaboration_workspace_files;
create policy "room members update files" on public.collaboration_workspace_files for update to authenticated using(uploaded_by=auth.uid() or private.can_manage_workspace(workspace_id,auth.uid())) with check(uploaded_by=auth.uid() or private.can_manage_workspace(workspace_id,auth.uid()));
drop policy if exists "room members delete files" on public.collaboration_workspace_files;
create policy "room members delete files" on public.collaboration_workspace_files for delete to authenticated using(uploaded_by=auth.uid() or private.can_manage_workspace(workspace_id,auth.uid()));

drop policy if exists "room decisions visible" on public.collaboration_workspace_decisions;
create policy "room decisions visible" on public.collaboration_workspace_decisions for select to authenticated using(private.can_access_workspace(workspace_id,auth.uid()));
drop policy if exists "room members propose decisions" on public.collaboration_workspace_decisions;
create policy "room members propose decisions" on public.collaboration_workspace_decisions for insert to authenticated with check(proposed_by=auth.uid() and private.can_access_workspace(workspace_id,auth.uid()));
drop policy if exists "room managers decide" on public.collaboration_workspace_decisions;
create policy "room managers decide" on public.collaboration_workspace_decisions for update to authenticated using(private.can_manage_workspace(workspace_id,auth.uid())) with check(private.can_manage_workspace(workspace_id,auth.uid()));
drop policy if exists "room managers delete decisions" on public.collaboration_workspace_decisions;
create policy "room managers delete decisions" on public.collaboration_workspace_decisions for delete to authenticated using(private.can_manage_workspace(workspace_id,auth.uid()));

drop policy if exists "room updates visible" on public.collaboration_workspace_updates;
create policy "room updates visible" on public.collaboration_workspace_updates for select to authenticated using(private.can_access_workspace(workspace_id,auth.uid()));
drop policy if exists "room members post updates" on public.collaboration_workspace_updates;
create policy "room members post updates" on public.collaboration_workspace_updates for insert to authenticated with check(author_id=auth.uid() and private.can_access_workspace(workspace_id,auth.uid()));
drop policy if exists "authors update room updates" on public.collaboration_workspace_updates;
create policy "authors update room updates" on public.collaboration_workspace_updates for update to authenticated using(author_id=auth.uid() or private.can_manage_workspace(workspace_id,auth.uid())) with check(author_id=auth.uid() or private.can_manage_workspace(workspace_id,auth.uid()));
drop policy if exists "authors delete room updates" on public.collaboration_workspace_updates;
create policy "authors delete room updates" on public.collaboration_workspace_updates for delete to authenticated using(author_id=auth.uid() or private.can_manage_workspace(workspace_id,auth.uid()));

drop policy if exists "workspace file read" on storage.objects;
create policy "workspace file read" on storage.objects for select to authenticated using(bucket_id='collaboration-files' and array_length(storage.foldername(name),1)>=1 and (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$' and private.can_access_workspace(((storage.foldername(name))[1])::uuid,auth.uid()));
drop policy if exists "workspace file upload" on storage.objects;
create policy "workspace file upload" on storage.objects for insert to authenticated with check(bucket_id='collaboration-files' and array_length(storage.foldername(name),1)>=2 and (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$' and (storage.foldername(name))[2]=auth.uid()::text and private.can_access_workspace(((storage.foldername(name))[1])::uuid,auth.uid()));
drop policy if exists "workspace file delete" on storage.objects;
create policy "workspace file delete" on storage.objects for delete to authenticated using(bucket_id='collaboration-files' and (owner_id=auth.uid()::text or ((storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$' and private.can_manage_workspace(((storage.foldername(name))[1])::uuid,auth.uid()))));

drop function if exists public.can_access_workspace(uuid,uuid);
drop function if exists public.can_manage_workspace(uuid,uuid);
drop function if exists public.is_workspace_member(uuid,uuid);

revoke execute on function public.publish_build_reel(uuid,text,text,text,text,text,integer,text[],text[]) from anon;
revoke execute on function public.record_media_signal(uuid,text,uuid,jsonb) from anon;
revoke execute on function public.request_workspace_access(uuid,text) from anon;
grant execute on function public.publish_build_reel(uuid,text,text,text,text,text,integer,text[],text[]) to authenticated,service_role;
grant execute on function public.record_media_signal(uuid,text,uuid,jsonb) to authenticated,service_role;
grant execute on function public.request_workspace_access(uuid,text) to authenticated,service_role;

notify pgrst,'reload schema';
