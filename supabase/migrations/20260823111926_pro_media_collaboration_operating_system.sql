-- Start To Up: professional media discovery + collaboration operating system.

alter table public.network_media_items
  add column if not exists creator_id uuid references public.profiles(id) on delete set null,
  add column if not exists project_id uuid references public.projects(id) on delete set null,
  add column if not exists live_event_id uuid references public.live_events(id) on delete set null,
  add column if not exists source_media_id uuid references public.media_publications(id) on delete set null,
  add column if not exists credibility_score numeric(4,3) not null default 0.500 check (credibility_score between 0 and 1),
  add column if not exists safety_score numeric(4,3) not null default 1.000 check (safety_score between 0 and 1),
  add column if not exists stream_state text not null default 'vod' check (stream_state in ('vod','scheduled','live','ended')),
  add column if not exists captions_url text,
  add column if not exists allow_collaboration boolean not null default true,
  add column if not exists aspect_ratio text not null default '9:16' check (aspect_ratio in ('9:16','16:9','1:1','4:5'));

alter table public.network_media_items drop constraint if exists network_media_items_media_kind_check;
alter table public.network_media_items
  add constraint network_media_items_media_kind_check
  check (media_kind in (
    'build_reel','product_walkthrough','research_demo','founder_story','collaboration_call',
    'webinar_replay','project_update','screen_demo','technical_session','live_stream','pitch_live','event_replay'
  ));

create index if not exists network_media_project_idx on public.network_media_items(project_id, published_at desc);
create index if not exists network_media_creator_idx on public.network_media_items(creator_id, published_at desc);
create index if not exists network_media_live_idx on public.network_media_items(stream_state, published_at desc) where status = 'published';
create index if not exists recommendation_user_entity_idx on public.recommendation_events(user_id, entity_type, entity_id, created_at desc);
create index if not exists recommendation_entity_signal_idx on public.recommendation_events(entity_type, entity_id, event_type, created_at desc);

create or replace function public.record_media_signal(
  media_id uuid,
  event_kind text,
  session_key uuid default null,
  event_context jsonb default '{}'::jsonb
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  viewer_id uuid := auth.uid();
  allowed boolean;
begin
  if viewer_id is null then return false; end if;
  allowed := event_kind = any(array[
    'impression','play','watch','complete','rewatch','support','save','share','comment',
    'collaboration_enter','follow','skip','hide','report'
  ]);
  if not allowed then raise exception 'Unsupported media signal'; end if;
  if not exists (select 1 from public.network_media_items m where m.id = media_id and m.status = 'published') then return false; end if;
  insert into public.recommendation_events(user_id, session_key, entity_type, entity_id, event_type, context)
  values (viewer_id, session_key, 'network_media', media_id, event_kind, coalesce(event_context, '{}'::jsonb));
  return true;
end;
$$;
revoke all on function public.record_media_signal(uuid,text,uuid,jsonb) from public;
grant execute on function public.record_media_signal(uuid,text,uuid,jsonb) to authenticated, service_role;

drop function if exists public.ranked_media_feed(text[], integer);
create function public.ranked_media_feed(
  audience_tags text[] default '{}',
  result_limit integer default 24
)
returns setof public.network_media_items
language sql
stable
security definer
set search_path = ''
as $$
  with
  viewer as (select auth.uid() as id),
  global_signal as (
    select e.entity_id,
      count(*) filter (where e.event_type in ('complete','rewatch','save','share','comment','collaboration_enter','follow'))::numeric as positive_events,
      count(*) filter (where e.event_type in ('skip','hide','report'))::numeric as negative_events,
      avg(case
        when e.event_type='watch' and (e.context->>'progress') ~ '^[0-9]+([.][0-9]+)?$'
          then least(1::numeric,greatest(0::numeric,(e.context->>'progress')::numeric))
        when e.event_type='complete' then 1::numeric
        else null end) as avg_progress
    from public.recommendation_events e
    where e.entity_type='network_media' and e.created_at >= now()-interval '14 days'
    group by e.entity_id
  ),
  viewer_item as (
    select e.entity_id,
      max(e.created_at) filter (where e.event_type='impression') as last_impression,
      max(e.created_at) filter (where e.event_type='complete') as last_complete,
      count(*) filter (where e.event_type='rewatch')::numeric as rewatches,
      count(*) filter (where e.event_type='skip')::numeric as skips,
      count(*) filter (where e.event_type='hide')::numeric as hides,
      count(*) filter (where e.event_type='report')::numeric as reports
    from public.recommendation_events e cross join viewer v
    where v.id is not null and e.user_id=v.id and e.entity_type='network_media'
      and e.created_at >= now()-interval '90 days'
    group by e.entity_id
  ),
  viewer_topics as (
    select tag, sum(case e.event_type
      when 'collaboration_enter' then 6 when 'save' then 5 when 'rewatch' then 5 when 'share' then 4
      when 'complete' then 3 when 'follow' then 4 when 'support' then 2 else 1 end)::numeric as affinity
    from public.recommendation_events e
    join public.network_media_items seen on seen.id=e.entity_id
    cross join lateral unnest(seen.topic_tags) tag
    cross join viewer v
    where v.id is not null and e.user_id=v.id and e.entity_type='network_media'
      and e.event_type in ('play','watch','complete','rewatch','support','save','share','comment','collaboration_enter','follow')
      and e.created_at >= now()-interval '90 days'
    group by tag
  ),
  recent_creator_exposure as (
    select seen.author_handle,count(*)::numeric as impressions
    from public.recommendation_events e
    join public.network_media_items seen on seen.id=e.entity_id
    cross join viewer v
    where v.id is not null and e.user_id=v.id and e.entity_type='network_media'
      and e.event_type='impression' and e.created_at >= now()-interval '6 hours'
    group by seen.author_handle
  ),
  scored as (
    select item.*,
      (
        item.quality_score*0.22 + item.collaboration_score*0.18 + item.credibility_score*0.10 + item.safety_score*0.10
        + case when cardinality(audience_tags)>0 and item.audience_tags && audience_tags then 0.10 else 0 end
        + exp(-greatest(extract(epoch from (now()-coalesce(item.published_at,item.created_at)))/3600.0,0)/96.0)*0.08
        + least(0.16,coalesce((select sum(vt.affinity)*0.008 from unnest(item.topic_tags) candidate_tag join viewer_topics vt on vt.tag=candidate_tag),0))
        + least(0.08,ln(1+coalesce(gs.positive_events,0))/ln(51)*0.08)
        + coalesce(gs.avg_progress,0)*0.05
        + case when item.stream_state='live' then 0.08 when item.stream_state='scheduled' then 0.03 else 0 end
        + ((('x'||substr(md5(item.id::text||date_trunc('hour',now())::text),1,8))::bit(32)::bigint % 1000)::numeric/1000.0)*0.03
        - least(0.12,coalesce(rce.impressions,0)*0.03)
        - case when vi.last_impression >= now()-interval '6 hours' then 0.08 else 0 end
        - case when vi.last_complete >= now()-interval '7 days' and coalesce(vi.rewatches,0)=0 then 0.08 else 0 end
        - least(0.30,coalesce(vi.skips,0)*0.10)
        - least(1.00,coalesce(vi.hides,0)*0.70)
        - least(2.00,coalesce(vi.reports,0)*1.50)
        - least(0.18,coalesce(gs.negative_events,0)/greatest(coalesce(gs.positive_events,0)+coalesce(gs.negative_events,0),8)*0.18)
      ) as rank_score
    from public.network_media_items item
    left join global_signal gs on gs.entity_id=item.id
    left join viewer_item vi on vi.entity_id=item.id
    left join recent_creator_exposure rce on rce.author_handle=item.author_handle
    where item.status='published' and item.safety_score>=0.35
  )
  select s.id,s.showcase_id,s.author_name,s.author_handle,s.author_role,s.title,s.caption,s.media_kind,s.poster_url,
         s.playback_url,s.duration_seconds,s.audience_tags,s.topic_tags,s.call_to_action,s.destination_url,
         s.quality_score,s.collaboration_score,s.freshness_boost,s.status,s.featured,s.published_at,s.created_at,s.updated_at,
         s.creator_id,s.project_id,s.live_event_id,s.source_media_id,s.credibility_score,s.safety_score,s.stream_state,
         s.captions_url,s.allow_collaboration,s.aspect_ratio
  from scored s
  order by s.rank_score desc,s.featured desc,s.published_at desc nulls last
  limit least(greatest(result_limit,1),50);
$$;
revoke all on function public.ranked_media_feed(text[],integer) from public;
grant execute on function public.ranked_media_feed(text[],integer) to anon, authenticated, service_role;

alter table public.collaboration_workspaces
  add column if not exists project_id uuid references public.projects(id) on delete cascade,
  add column if not exists created_by uuid references auth.users(id) on delete set null;
create index if not exists collaboration_workspace_project_idx on public.collaboration_workspaces(project_id,status);
create index if not exists collaboration_workspace_creator_idx on public.collaboration_workspaces(created_by,created_at desc);

create table if not exists public.collaboration_workspace_members (
  workspace_id uuid not null references public.collaboration_workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role_title text not null default 'Contributor',
  status text not null default 'requested' check (status in ('requested','invited','active','removed')),
  application_note text,
  can_manage boolean not null default false,
  can_edit boolean not null default true,
  requested_at timestamptz not null default now(),
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(workspace_id,user_id)
);
create table if not exists public.collaboration_workspace_messages (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.collaboration_workspaces(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  parent_id uuid references public.collaboration_workspace_messages(id) on delete cascade,
  body text not null check(char_length(body) between 1 and 6000), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.collaboration_workspace_tasks (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.collaboration_workspaces(id) on delete cascade,
  title text not null, description text, status text not null default 'open' check(status in ('open','in_progress','review','done','blocked')),
  priority text not null default 'normal' check(priority in ('low','normal','high','critical')),
  assignee_id uuid references auth.users(id) on delete set null, created_by uuid not null references auth.users(id) on delete cascade,
  due_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.collaboration_workspace_files (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.collaboration_workspaces(id) on delete cascade,
  title text not null, storage_path text not null, mime_type text, file_size bigint check(file_size is null or file_size>=0),
  version integer not null default 1 check(version>0), uploaded_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table if not exists public.collaboration_workspace_decisions (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.collaboration_workspaces(id) on delete cascade,
  title text not null, proposal text not null, outcome text, status text not null default 'proposed' check(status in ('proposed','approved','rejected','superseded')),
  proposed_by uuid not null references auth.users(id) on delete cascade, decided_by uuid references auth.users(id) on delete set null,
  decided_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.collaboration_workspace_updates (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.collaboration_workspaces(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null check(char_length(body) between 1 and 6000), progress_percent integer check(progress_percent is null or progress_percent between 0 and 100),
  milestone_label text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create index if not exists workspace_member_user_idx on public.collaboration_workspace_members(user_id,status,updated_at desc);
create index if not exists workspace_messages_idx on public.collaboration_workspace_messages(workspace_id,created_at desc);
create index if not exists workspace_tasks_idx on public.collaboration_workspace_tasks(workspace_id,status,priority,due_at);
create index if not exists workspace_files_idx on public.collaboration_workspace_files(workspace_id,created_at desc);
create index if not exists workspace_decisions_idx on public.collaboration_workspace_decisions(workspace_id,created_at desc);
create index if not exists workspace_updates_idx on public.collaboration_workspace_updates(workspace_id,created_at desc);

create or replace function public.is_workspace_member(_workspace_id uuid,_user_id uuid)
returns boolean language sql stable security definer set search_path=''
as $$ select _user_id is not null and exists(select 1 from public.collaboration_workspace_members m where m.workspace_id=_workspace_id and m.user_id=_user_id and m.status='active'); $$;
create or replace function public.can_manage_workspace(_workspace_id uuid,_user_id uuid)
returns boolean language sql stable security definer set search_path=''
as $$ select _user_id is not null and (
  exists(select 1 from public.collaboration_workspaces w where w.id=_workspace_id and w.created_by=_user_id)
  or exists(select 1 from public.collaboration_workspace_members m where m.workspace_id=_workspace_id and m.user_id=_user_id and m.status='active' and m.can_manage)
  or private.is_staff(_user_id)
); $$;
create or replace function public.can_access_workspace(_workspace_id uuid,_user_id uuid)
returns boolean language sql stable security definer set search_path=''
as $$ select public.can_manage_workspace(_workspace_id,_user_id) or public.is_workspace_member(_workspace_id,_user_id); $$;
revoke all on function public.is_workspace_member(uuid,uuid),public.can_manage_workspace(uuid,uuid),public.can_access_workspace(uuid,uuid) from public;
grant execute on function public.is_workspace_member(uuid,uuid),public.can_manage_workspace(uuid,uuid),public.can_access_workspace(uuid,uuid) to anon,authenticated,service_role;

create or replace function public.request_workspace_access(_workspace_id uuid,_application_note text default null)
returns boolean language plpgsql security invoker set search_path=''
as $$ declare viewer_id uuid:=auth.uid(); begin
  if viewer_id is null then raise exception 'Authentication required'; end if;
  if not exists(select 1 from public.collaboration_workspaces w where w.id=_workspace_id and w.status in ('open','active') and w.is_public) then raise exception 'Workspace is not accepting requests'; end if;
  insert into public.collaboration_workspace_members(workspace_id,user_id,status,application_note,requested_at)
  values(_workspace_id,viewer_id,'requested',nullif(trim(_application_note),''),now())
  on conflict(workspace_id,user_id) do update set
    status=case when public.collaboration_workspace_members.status='active' then 'active' else 'requested' end,
    application_note=excluded.application_note,
    requested_at=case when public.collaboration_workspace_members.status='active' then public.collaboration_workspace_members.requested_at else now() end,
    updated_at=now();
  return true;
end; $$;
revoke all on function public.request_workspace_access(uuid,text) from public;
grant execute on function public.request_workspace_access(uuid,text) to authenticated,service_role;

do $$ begin
  if not exists(select 1 from pg_trigger where tgname='tg_collaboration_workspaces_upd') then create trigger tg_collaboration_workspaces_upd before update on public.collaboration_workspaces for each row execute function public.tg_set_updated_at(); end if;
  if not exists(select 1 from pg_trigger where tgname='tg_collaboration_workspace_members_upd') then create trigger tg_collaboration_workspace_members_upd before update on public.collaboration_workspace_members for each row execute function public.tg_set_updated_at(); end if;
  if not exists(select 1 from pg_trigger where tgname='tg_collaboration_workspace_messages_upd') then create trigger tg_collaboration_workspace_messages_upd before update on public.collaboration_workspace_messages for each row execute function public.tg_set_updated_at(); end if;
  if not exists(select 1 from pg_trigger where tgname='tg_collaboration_workspace_tasks_upd') then create trigger tg_collaboration_workspace_tasks_upd before update on public.collaboration_workspace_tasks for each row execute function public.tg_set_updated_at(); end if;
  if not exists(select 1 from pg_trigger where tgname='tg_collaboration_workspace_decisions_upd') then create trigger tg_collaboration_workspace_decisions_upd before update on public.collaboration_workspace_decisions for each row execute function public.tg_set_updated_at(); end if;
  if not exists(select 1 from pg_trigger where tgname='tg_collaboration_workspace_updates_upd') then create trigger tg_collaboration_workspace_updates_upd before update on public.collaboration_workspace_updates for each row execute function public.tg_set_updated_at(); end if;
end $$;

alter table public.collaboration_workspace_members enable row level security;
alter table public.collaboration_workspace_messages enable row level security;
alter table public.collaboration_workspace_tasks enable row level security;
alter table public.collaboration_workspace_files enable row level security;
alter table public.collaboration_workspace_decisions enable row level security;
alter table public.collaboration_workspace_updates enable row level security;
grant select,insert,update,delete on public.collaboration_workspaces to authenticated;
grant select,insert,update,delete on public.collaboration_workspace_members,public.collaboration_workspace_messages,public.collaboration_workspace_tasks,public.collaboration_workspace_files,public.collaboration_workspace_decisions,public.collaboration_workspace_updates to authenticated;
grant all on public.collaboration_workspace_members,public.collaboration_workspace_messages,public.collaboration_workspace_tasks,public.collaboration_workspace_files,public.collaboration_workspace_decisions,public.collaboration_workspace_updates to service_role;

drop policy if exists "public collaboration workspaces are visible" on public.collaboration_workspaces;
create policy "workspace summaries visible" on public.collaboration_workspaces for select to anon,authenticated using(
 (is_public and status in ('open','active','completed')) or created_by=auth.uid() or public.is_workspace_member(id,auth.uid()) or private.is_staff(auth.uid())
);
create policy "members create workspaces" on public.collaboration_workspaces for insert to authenticated with check(created_by=auth.uid() and (project_id is null or private.can_edit_project(project_id,auth.uid())));
create policy "workspace managers update" on public.collaboration_workspaces for update to authenticated using(public.can_manage_workspace(id,auth.uid())) with check(public.can_manage_workspace(id,auth.uid()));
create policy "workspace managers delete" on public.collaboration_workspaces for delete to authenticated using(public.can_manage_workspace(id,auth.uid()));

create policy "workspace members visible" on public.collaboration_workspace_members for select to authenticated using(user_id=auth.uid() or public.can_access_workspace(workspace_id,auth.uid()) or public.can_manage_workspace(workspace_id,auth.uid()));
create policy "request or add workspace member" on public.collaboration_workspace_members for insert to authenticated with check(
 public.can_manage_workspace(workspace_id,auth.uid()) or (user_id=auth.uid() and status='requested' and exists(select 1 from public.collaboration_workspaces w where w.id=workspace_id and w.is_public and w.status in ('open','active')))
);
create policy "workspace managers update members" on public.collaboration_workspace_members for update to authenticated using(public.can_manage_workspace(workspace_id,auth.uid())) with check(public.can_manage_workspace(workspace_id,auth.uid()));
create policy "cancel own workspace request" on public.collaboration_workspace_members for delete to authenticated using(user_id=auth.uid() or public.can_manage_workspace(workspace_id,auth.uid()));

create policy "room messages visible" on public.collaboration_workspace_messages for select to authenticated using(public.can_access_workspace(workspace_id,auth.uid()));
create policy "room members message" on public.collaboration_workspace_messages for insert to authenticated with check(author_id=auth.uid() and public.can_access_workspace(workspace_id,auth.uid()));
create policy "authors update room messages" on public.collaboration_workspace_messages for update to authenticated using(author_id=auth.uid() or public.can_manage_workspace(workspace_id,auth.uid())) with check(author_id=auth.uid() or public.can_manage_workspace(workspace_id,auth.uid()));
create policy "authors delete room messages" on public.collaboration_workspace_messages for delete to authenticated using(author_id=auth.uid() or public.can_manage_workspace(workspace_id,auth.uid()));

create policy "room tasks visible" on public.collaboration_workspace_tasks for select to authenticated using(public.can_access_workspace(workspace_id,auth.uid()));
create policy "room members create tasks" on public.collaboration_workspace_tasks for insert to authenticated with check(created_by=auth.uid() and public.can_access_workspace(workspace_id,auth.uid()));
create policy "room members update tasks" on public.collaboration_workspace_tasks for update to authenticated using(public.can_access_workspace(workspace_id,auth.uid())) with check(public.can_access_workspace(workspace_id,auth.uid()));
create policy "room managers delete tasks" on public.collaboration_workspace_tasks for delete to authenticated using(created_by=auth.uid() or public.can_manage_workspace(workspace_id,auth.uid()));

create policy "room files visible" on public.collaboration_workspace_files for select to authenticated using(public.can_access_workspace(workspace_id,auth.uid()));
create policy "room members register files" on public.collaboration_workspace_files for insert to authenticated with check(uploaded_by=auth.uid() and public.can_access_workspace(workspace_id,auth.uid()));
create policy "room members update files" on public.collaboration_workspace_files for update to authenticated using(uploaded_by=auth.uid() or public.can_manage_workspace(workspace_id,auth.uid())) with check(uploaded_by=auth.uid() or public.can_manage_workspace(workspace_id,auth.uid()));
create policy "room members delete files" on public.collaboration_workspace_files for delete to authenticated using(uploaded_by=auth.uid() or public.can_manage_workspace(workspace_id,auth.uid()));

create policy "room decisions visible" on public.collaboration_workspace_decisions for select to authenticated using(public.can_access_workspace(workspace_id,auth.uid()));
create policy "room members propose decisions" on public.collaboration_workspace_decisions for insert to authenticated with check(proposed_by=auth.uid() and public.can_access_workspace(workspace_id,auth.uid()));
create policy "room managers decide" on public.collaboration_workspace_decisions for update to authenticated using(public.can_manage_workspace(workspace_id,auth.uid())) with check(public.can_manage_workspace(workspace_id,auth.uid()));
create policy "room managers delete decisions" on public.collaboration_workspace_decisions for delete to authenticated using(public.can_manage_workspace(workspace_id,auth.uid()));

create policy "room updates visible" on public.collaboration_workspace_updates for select to authenticated using(public.can_access_workspace(workspace_id,auth.uid()));
create policy "room members post updates" on public.collaboration_workspace_updates for insert to authenticated with check(author_id=auth.uid() and public.can_access_workspace(workspace_id,auth.uid()));
create policy "authors update room updates" on public.collaboration_workspace_updates for update to authenticated using(author_id=auth.uid() or public.can_manage_workspace(workspace_id,auth.uid())) with check(author_id=auth.uid() or public.can_manage_workspace(workspace_id,auth.uid()));
create policy "authors delete room updates" on public.collaboration_workspace_updates for delete to authenticated using(author_id=auth.uid() or public.can_manage_workspace(workspace_id,auth.uid()));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values(
 'collaboration-files','collaboration-files',false,262144000,
 array['application/pdf','text/plain','text/csv','application/zip','application/json','image/jpeg','image/png','image/webp','video/mp4','video/webm','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.openxmlformats-officedocument.presentationml.presentation']
) on conflict(id) do update set file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy "workspace file read" on storage.objects for select to authenticated using(bucket_id='collaboration-files' and array_length(storage.foldername(name),1)>=1 and (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$' and public.can_access_workspace(((storage.foldername(name))[1])::uuid,auth.uid()));
create policy "workspace file upload" on storage.objects for insert to authenticated with check(bucket_id='collaboration-files' and array_length(storage.foldername(name),1)>=2 and (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$' and (storage.foldername(name))[2]=auth.uid()::text and public.can_access_workspace(((storage.foldername(name))[1])::uuid,auth.uid()));
create policy "workspace file update" on storage.objects for update to authenticated using(bucket_id='collaboration-files' and owner_id=auth.uid()::text) with check(bucket_id='collaboration-files' and owner_id=auth.uid()::text);
create policy "workspace file delete" on storage.objects for delete to authenticated using(bucket_id='collaboration-files' and (owner_id=auth.uid()::text or ((storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$' and public.can_manage_workspace(((storage.foldername(name))[1])::uuid,auth.uid()))));

notify pgrst,'reload schema';
