-- Invisible guest sessions may perform only low-risk Phase 2 submissions.

create or replace function private.is_permanent_user()
returns boolean language sql stable security invoker set search_path = '' as $$
  select coalesce(((select auth.jwt())->>'is_anonymous')::boolean, false) is false;
$$;
revoke all on function private.is_permanent_user() from public, anon;
grant execute on function private.is_permanent_user() to authenticated, service_role;

-- Anonymous users do not enter the public member directory. The later auth
-- upgrade flow will create their permanent profile when an identity is linked.
create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare base_username text;
begin
  if coalesce(new.is_anonymous, false) then return new; end if;
  base_username := lower(regexp_replace(split_part(new.email,'@',1),'[^a-z0-9_]','','g'));
  if base_username = '' or base_username is null then base_username := 'member'; end if;
  insert into public.profiles (id, username, display_name)
  values (new.id, base_username || '_' || substr(new.id::text,1,6), coalesce(new.raw_user_meta_data->>'display_name',''))
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'user')
  on conflict (user_id, role) do nothing;
  return new;
end;
$$;
revoke all on function private.handle_new_user() from public, anon, authenticated;
grant execute on function private.handle_new_user() to service_role;

-- Sensitive creation and management always requires a permanent account.
create policy "permanent users create projects" on public.projects as restrictive for insert to authenticated with check (private.is_permanent_user());
create policy "permanent users create posts" on public.posts as restrictive for insert to authenticated with check (private.is_permanent_user());
create policy "permanent users create comments" on public.comments as restrictive for insert to authenticated with check (private.is_permanent_user());
create policy "permanent users react" on public.reactions as restrictive for insert to authenticated with check (private.is_permanent_user());
create policy "permanent users save" on public.saves as restrictive for insert to authenticated with check (private.is_permanent_user());
create policy "permanent users follow" on public.follows as restrictive for insert to authenticated with check (private.is_permanent_user());
create policy "permanent users create collaborations" on public.collaboration_requests as restrictive for insert to authenticated with check (private.is_permanent_user());
create policy "permanent users start conversations" on public.conversations as restrictive for insert to authenticated with check (private.is_permanent_user());
create policy "permanent users join conversations" on public.conversation_participants as restrictive for insert to authenticated with check (private.is_permanent_user());
create policy "permanent users send messages" on public.messages as restrictive for insert to authenticated with check (private.is_permanent_user());
create policy "permanent users request protected access" on public.protected_access_requests as restrictive for insert to authenticated with check (private.is_permanent_user());
create policy "permanent users file ip claims" on public.ip_misuse_reports as restrictive for insert to authenticated with check (private.is_permanent_user());
create policy "permanent users create organizations" on public.organizations as restrictive for insert to authenticated with check (private.is_permanent_user());
create policy "permanent users manage organization members" on public.organization_members as restrictive for insert to authenticated with check (private.is_permanent_user());
create policy "permanent users request verification" on public.verification_requests as restrictive for insert to authenticated with check (private.is_permanent_user());
create policy "permanent users host sessions" on public.expert_sessions as restrictive for insert to authenticated with check (private.is_permanent_user());

-- Guests can submit collaboration applications, expert registrations and
-- content-safety reports through the existing owner-bound RLS policies.

notify pgrst, 'reload schema';
