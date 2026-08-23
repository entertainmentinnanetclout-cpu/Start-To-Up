-- Media V2 + Recommendation V2
-- Adds threaded media conversation, live-room coordination, pitch rooms,
-- investor watchlists, normalized recommendation affinities, notification queues,
-- creator analytics, and a V2 ranking RPC while preserving the existing media API.

create table if not exists public.media_comments (
  id uuid primary key default gen_random_uuid(),
  media_id uuid not null references public.network_media_items(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  parent_id uuid references public.media_comments(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  status text not null default 'active' check (status in ('active','hidden','deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists media_comments_media_created_idx on public.media_comments(media_id, created_at desc);
create index if not exists media_comments_parent_idx on public.media_comments(parent_id) where parent_id is not null;
create index if not exists media_comments_author_idx on public.media_comments(author_id, created_at desc);

create table if not exists public.live_room_participants (
  live_event_id uuid not null references public.live_events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'viewer' check (role in ('host','cohost','speaker','viewer')),
  state text not null default 'joined' check (state in ('invited','joined','left','blocked')),
  can_share_screen boolean not null default false,
  joined_at timestamptz,
  left_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (live_event_id, user_id)
);

create index if not exists live_room_participants_user_idx on public.live_room_participants(user_id, updated_at desc);

create table if not exists public.live_chat_messages (
  id uuid primary key default gen_random_uuid(),
  live_event_id uuid not null references public.live_events(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  reply_to uuid references public.live_chat_messages(id) on delete set null,
  message_kind text not null default 'message' check (message_kind in ('message','question','reaction','system')),
  body text not null check (char_length(body) between 1 and 1200),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists live_chat_event_created_idx on public.live_chat_messages(live_event_id, created_at desc);
create index if not exists live_chat_reply_idx on public.live_chat_messages(reply_to) where reply_to is not null;

create table if not exists public.live_room_signals (
  id uuid primary key default gen_random_uuid(),
  live_event_id uuid not null references public.live_events(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  target_id uuid references public.profiles(id) on delete cascade,
  signal_type text not null check (signal_type in ('offer','answer','ice','screen_start','screen_stop','cohost_request','cohost_accept')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '10 minutes')
);

create index if not exists live_room_signals_event_target_idx on public.live_room_signals(live_event_id, target_id, created_at desc);
create index if not exists live_room_signals_expiry_idx on public.live_room_signals(expires_at);

create table if not exists public.project_pitch_rooms (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  host_id uuid not null references public.profiles(id) on delete cascade,
  live_event_id uuid references public.live_events(id) on delete set null,
  title text not null,
  summary text not null default '',
  scheduled_at timestamptz not null,
  duration_minutes integer not null default 30 check (duration_minutes between 10 and 180),
  status text not null default 'scheduled' check (status in ('draft','scheduled','live','ended','cancelled')),
  access_type text not null default 'request' check (access_type in ('public','request','invite_only')),
  max_investors integer not null default 25 check (max_investors between 1 and 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pitch_rooms_project_idx on public.project_pitch_rooms(project_id, scheduled_at desc);
create index if not exists pitch_rooms_schedule_idx on public.project_pitch_rooms(status, scheduled_at);

create table if not exists public.project_pitch_room_attendees (
  room_id uuid not null references public.project_pitch_rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'investor' check (role in ('founder','investor','advisor','institution','observer')),
  status text not null default 'requested' check (status in ('requested','invited','approved','joined','interested','follow_up','passed')),
  joined_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create index if not exists pitch_room_attendees_user_idx on public.project_pitch_room_attendees(user_id, updated_at desc);

create table if not exists public.investor_watchlist (
  user_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  source_media_id uuid references public.network_media_items(id) on delete set null,
  status text not null default 'watching' check (status in ('watching','diligence','contacted','passed','invested')),
  private_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, project_id)
);

create index if not exists investor_watchlist_project_idx on public.investor_watchlist(project_id, status, updated_at desc);

create table if not exists public.recommendation_topic_affinity (
  user_id uuid not null references public.profiles(id) on delete cascade,
  topic text not null,
  score numeric not null default 0,
  event_count integer not null default 0,
  last_event_at timestamptz not null default now(),
  primary key (user_id, topic)
);

create index if not exists recommendation_topic_user_score_idx on public.recommendation_topic_affinity(user_id, score desc, last_event_at desc);

create table if not exists public.recommendation_creator_affinity (
  user_id uuid not null references public.profiles(id) on delete cascade,
  creator_id uuid not null references public.profiles(id) on delete cascade,
  score numeric not null default 0,
  event_count integer not null default 0,
  last_event_at timestamptz not null default now(),
  primary key (user_id, creator_id)
);

create index if not exists recommendation_creator_user_score_idx on public.recommendation_creator_affinity(user_id, score desc, last_event_at desc);

create table if not exists public.recommendation_user_state (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  cohort text not null default 'explorer' check (cohort in ('explorer','builder','founder','investor','institution','deep_learner','connector')),
  exploration_rate numeric not null default 0.18 check (exploration_rate between 0 and 1),
  notification_weight numeric not null default 0.10 check (notification_weight between 0 and 1),
  last_refreshed_at timestamptz not null default now()
);

create table if not exists public.media_notification_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  media_id uuid not null references public.network_media_items(id) on delete cascade,
  reason text not null,
  priority numeric not null default 0.5,
  delivered_at timestamptz,
  opened_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, media_id)
);

create index if not exists media_notification_user_idx on public.media_notification_queue(user_id, opened_at, priority desc, created_at desc);

create unique index if not exists creator_follow_unique_idx
  on public.follows(follower_id, followee_id)
  where followee_id is not null and project_id is null;

alter table public.media_comments enable row level security;
alter table public.live_room_participants enable row level security;
alter table public.live_chat_messages enable row level security;
alter table public.live_room_signals enable row level security;
alter table public.project_pitch_rooms enable row level security;
alter table public.project_pitch_room_attendees enable row level security;
alter table public.investor_watchlist enable row level security;
alter table public.recommendation_topic_affinity enable row level security;
alter table public.recommendation_creator_affinity enable row level security;
alter table public.recommendation_user_state enable row level security;
alter table public.media_notification_queue enable row level security;

drop policy if exists "published media comments visible" on public.media_comments;
create policy "published media comments visible" on public.media_comments for select to anon,authenticated
using(status='active' and exists(select 1 from public.network_media_items m where m.id=media_id and m.status='published'));

drop policy if exists "members create media comments" on public.media_comments;
create policy "members create media comments" on public.media_comments for insert to authenticated
with check(author_id=(select auth.uid()) and status='active');

drop policy if exists "authors manage media comments" on public.media_comments;
create policy "authors manage media comments" on public.media_comments for update to authenticated
using(author_id=(select auth.uid()) or private.is_staff((select auth.uid())))
with check(author_id=(select auth.uid()) or private.is_staff((select auth.uid())));

drop policy if exists "authors delete media comments" on public.media_comments;
create policy "authors delete media comments" on public.media_comments for delete to authenticated
using(author_id=(select auth.uid()) or private.is_staff((select auth.uid())));

drop policy if exists "live participants visible" on public.live_room_participants;
create policy "live participants visible" on public.live_room_participants for select to authenticated
using(user_id=(select auth.uid()) or exists(select 1 from public.live_events e where e.id=live_event_id and e.host_id=(select auth.uid())) or exists(select 1 from public.live_room_participants mine where mine.live_event_id=live_room_participants.live_event_id and mine.user_id=(select auth.uid()) and mine.state='joined'));

drop policy if exists "join live room" on public.live_room_participants;
create policy "join live room" on public.live_room_participants for insert to authenticated
with check(user_id=(select auth.uid()) or exists(select 1 from public.live_events e where e.id=live_event_id and e.host_id=(select auth.uid())));

drop policy if exists "manage own live presence" on public.live_room_participants;
create policy "manage own live presence" on public.live_room_participants for update to authenticated
using(user_id=(select auth.uid()) or exists(select 1 from public.live_events e where e.id=live_event_id and e.host_id=(select auth.uid())))
with check(user_id=(select auth.uid()) or exists(select 1 from public.live_events e where e.id=live_event_id and e.host_id=(select auth.uid())));

drop policy if exists "live chat visible to members" on public.live_chat_messages;
create policy "live chat visible to members" on public.live_chat_messages for select to authenticated
using(exists(select 1 from public.live_events e where e.id=live_event_id and e.status in ('scheduled','live','ended')));

drop policy if exists "members send live chat" on public.live_chat_messages;
create policy "members send live chat" on public.live_chat_messages for insert to authenticated
with check(author_id=(select auth.uid()) and exists(select 1 from public.live_events e where e.id=live_event_id and e.status in ('scheduled','live')));

drop policy if exists "authors delete live chat" on public.live_chat_messages;
create policy "authors delete live chat" on public.live_chat_messages for update to authenticated
using(author_id=(select auth.uid()) or exists(select 1 from public.live_events e where e.id=live_event_id and e.host_id=(select auth.uid())))
with check(author_id=(select auth.uid()) or exists(select 1 from public.live_events e where e.id=live_event_id and e.host_id=(select auth.uid())));

drop policy if exists "live signals visible to participants" on public.live_room_signals;
create policy "live signals visible to participants" on public.live_room_signals for select to authenticated
using((target_id is null or target_id=(select auth.uid()) or sender_id=(select auth.uid())) and exists(select 1 from public.live_room_participants p where p.live_event_id=live_room_signals.live_event_id and p.user_id=(select auth.uid()) and p.state='joined'));

drop policy if exists "participants send live signals" on public.live_room_signals;
create policy "participants send live signals" on public.live_room_signals for insert to authenticated
with check(sender_id=(select auth.uid()) and exists(select 1 from public.live_room_participants p where p.live_event_id=live_room_signals.live_event_id and p.user_id=(select auth.uid()) and p.state='joined'));

drop policy if exists "pitch rooms discoverable" on public.project_pitch_rooms;
create policy "pitch rooms discoverable" on public.project_pitch_rooms for select to authenticated
using(access_type='public' or host_id=(select auth.uid()) or exists(select 1 from public.project_pitch_room_attendees a where a.room_id=id and a.user_id=(select auth.uid())));

drop policy if exists "project owners create pitch rooms" on public.project_pitch_rooms;
create policy "project owners create pitch rooms" on public.project_pitch_rooms for insert to authenticated
with check(host_id=(select auth.uid()) and exists(select 1 from public.projects p where p.id=project_id and p.owner_id=(select auth.uid())));

drop policy if exists "pitch hosts manage rooms" on public.project_pitch_rooms;
create policy "pitch hosts manage rooms" on public.project_pitch_rooms for update to authenticated
using(host_id=(select auth.uid())) with check(host_id=(select auth.uid()));

drop policy if exists "pitch attendees visible" on public.project_pitch_room_attendees;
create policy "pitch attendees visible" on public.project_pitch_room_attendees for select to authenticated
using(user_id=(select auth.uid()) or exists(select 1 from public.project_pitch_rooms r where r.id=room_id and r.host_id=(select auth.uid())));

drop policy if exists "request pitch access" on public.project_pitch_room_attendees;
create policy "request pitch access" on public.project_pitch_room_attendees for insert to authenticated
with check(user_id=(select auth.uid()) or exists(select 1 from public.project_pitch_rooms r where r.id=room_id and r.host_id=(select auth.uid())));

drop policy if exists "manage pitch attendance" on public.project_pitch_room_attendees;
create policy "manage pitch attendance" on public.project_pitch_room_attendees for update to authenticated
using(user_id=(select auth.uid()) or exists(select 1 from public.project_pitch_rooms r where r.id=room_id and r.host_id=(select auth.uid())))
with check(user_id=(select auth.uid()) or exists(select 1 from public.project_pitch_rooms r where r.id=room_id and r.host_id=(select auth.uid())));

drop policy if exists "private investor watchlist" on public.investor_watchlist;
create policy "private investor watchlist" on public.investor_watchlist for all to authenticated
using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));

drop policy if exists "private topic affinity" on public.recommendation_topic_affinity;
create policy "private topic affinity" on public.recommendation_topic_affinity for select to authenticated
using(user_id=(select auth.uid()));

drop policy if exists "private creator affinity" on public.recommendation_creator_affinity;
create policy "private creator affinity" on public.recommendation_creator_affinity for select to authenticated
using(user_id=(select auth.uid()));

drop policy if exists "private recommendation state" on public.recommendation_user_state;
create policy "private recommendation state" on public.recommendation_user_state for select to authenticated
using(user_id=(select auth.uid()));

drop policy if exists "private media notifications" on public.media_notification_queue;
create policy "private media notifications" on public.media_notification_queue for select to authenticated
using(user_id=(select auth.uid()));

drop policy if exists "update own media notifications" on public.media_notification_queue;
create policy "update own media notifications" on public.media_notification_queue for update to authenticated
using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));

create or replace function private.media_event_weight(_event_type text)
returns numeric language sql immutable set search_path=''
as $$
  select case _event_type
    when 'collaboration_enter' then 7
    when 'follow' then 6
    when 'save' then 5
    when 'rewatch' then 5
    when 'share' then 4
    when 'complete' then 4
    when 'comment' then 3
    when 'support' then 2
    when 'watch' then 1.5
    when 'play' then 1
    when 'impression' then 0.2
    when 'skip' then -3
    when 'hide' then -8
    when 'report' then -15
    else 0
  end;
$$;

create or replace function private.update_media_affinity()
returns trigger language plpgsql security definer set search_path=''
as $$
declare
  item public.network_media_items%rowtype;
  weight numeric;
  tag text;
begin
  if new.user_id is null or new.entity_type <> 'network_media' then return new; end if;
  select * into item from public.network_media_items where id=new.entity_id;
  if item.id is null then return new; end if;
  weight := private.media_event_weight(new.event_type);

  foreach tag in array item.topic_tags loop
    insert into public.recommendation_topic_affinity(user_id,topic,score,event_count,last_event_at)
    values(new.user_id,tag,weight,1,new.created_at)
    on conflict(user_id,topic) do update set
      score=greatest(-100,least(100,public.recommendation_topic_affinity.score*0.985 + excluded.score)),
      event_count=public.recommendation_topic_affinity.event_count+1,
      last_event_at=excluded.last_event_at;
  end loop;

  if item.creator_id is not null then
    insert into public.recommendation_creator_affinity(user_id,creator_id,score,event_count,last_event_at)
    values(new.user_id,item.creator_id,weight,1,new.created_at)
    on conflict(user_id,creator_id) do update set
      score=greatest(-100,least(100,public.recommendation_creator_affinity.score*0.985 + excluded.score)),
      event_count=public.recommendation_creator_affinity.event_count+1,
      last_event_at=excluded.last_event_at;
  end if;

  insert into public.recommendation_user_state(user_id,cohort,exploration_rate,notification_weight,last_refreshed_at)
  values(
    new.user_id,
    case
      when new.event_type='collaboration_enter' then 'builder'
      when new.event_type in ('save','share') and coalesce((new.context->>'source'),'') ilike '%invest%' then 'investor'
      when new.event_type in ('complete','rewatch') then 'deep_learner'
      when new.event_type='follow' then 'connector'
      else 'explorer'
    end,
    case when new.event_type in ('hide','skip') then 0.25 else 0.18 end,
    case when coalesce(new.context->>'source','')='notification' then 0.18 else 0.10 end,
    now()
  )
  on conflict(user_id) do update set
    cohort=case
      when new.event_type='collaboration_enter' then 'builder'
      when new.event_type in ('save','share') and coalesce((new.context->>'source'),'') ilike '%invest%' then 'investor'
      when new.event_type='follow' then 'connector'
      else public.recommendation_user_state.cohort
    end,
    exploration_rate=case when new.event_type in ('hide','skip') then least(0.35,public.recommendation_user_state.exploration_rate+0.01) else greatest(0.08,public.recommendation_user_state.exploration_rate*0.995) end,
    notification_weight=case when coalesce(new.context->>'source','')='notification' then least(0.25,public.recommendation_user_state.notification_weight+0.01) else public.recommendation_user_state.notification_weight end,
    last_refreshed_at=now();
  return new;
end;
$$;

drop trigger if exists recommendation_event_affinity_trigger on public.recommendation_events;
create trigger recommendation_event_affinity_trigger
after insert on public.recommendation_events
for each row execute function private.update_media_affinity();

create or replace function public.toggle_creator_follow(_creator_id uuid)
returns boolean language plpgsql security definer set search_path=''
as $$
declare
  uid uuid := auth.uid();
  exists_follow boolean;
begin
  if uid is null or uid=_creator_id then return false; end if;
  select exists(select 1 from public.follows where follower_id=uid and followee_id=_creator_id and project_id is null) into exists_follow;
  if exists_follow then
    delete from public.follows where follower_id=uid and followee_id=_creator_id and project_id is null;
    return false;
  end if;
  insert into public.follows(follower_id,followee_id) values(uid,_creator_id) on conflict do nothing;
  return true;
end;
$$;

revoke all on function public.toggle_creator_follow(uuid) from public;
grant execute on function public.toggle_creator_follow(uuid) to authenticated,service_role;

create or replace function public.toggle_investor_watchlist(_project_id uuid, _source_media_id uuid default null)
returns boolean language plpgsql security definer set search_path=''
as $$
declare uid uuid := auth.uid(); exists_row boolean;
begin
  if uid is null then return false; end if;
  select exists(select 1 from public.investor_watchlist where user_id=uid and project_id=_project_id) into exists_row;
  if exists_row then
    delete from public.investor_watchlist where user_id=uid and project_id=_project_id;
    return false;
  end if;
  insert into public.investor_watchlist(user_id,project_id,source_media_id) values(uid,_project_id,_source_media_id);
  return true;
end;
$$;

revoke all on function public.toggle_investor_watchlist(uuid,uuid) from public;
grant execute on function public.toggle_investor_watchlist(uuid,uuid) to authenticated,service_role;

create or replace function public.creator_media_analytics()
returns jsonb language sql stable security definer set search_path=''
as $$
  with uid as (select auth.uid() as id),
  mine as (select m.id from public.network_media_items m,uid where m.creator_id=uid.id),
  signals as (
    select
      count(*) filter(where e.event_type='impression') as impressions,
      count(*) filter(where e.event_type='play') as plays,
      count(*) filter(where e.event_type='complete') as completions,
      count(*) filter(where e.event_type='rewatch') as rewatches,
      count(*) filter(where e.event_type='save') as saves,
      count(*) filter(where e.event_type='share') as shares,
      count(*) filter(where e.event_type='comment') as comments_signal,
      count(*) filter(where e.event_type='collaboration_enter') as collaboration_entries,
      count(distinct e.user_id) filter(where e.user_id is not null) as unique_viewers,
      avg(case when e.event_type='watch' and (e.context->>'progress') ~ '^[0-9]+([.][0-9]+)?$' then (e.context->>'progress')::numeric end) as avg_progress
    from public.recommendation_events e join mine on mine.id=e.entity_id
    where e.entity_type='network_media' and e.created_at>=now()-interval '90 days'
  )
  select jsonb_build_object(
    'impressions',coalesce(s.impressions,0),'plays',coalesce(s.plays,0),'completions',coalesce(s.completions,0),
    'rewatches',coalesce(s.rewatches,0),'saves',coalesce(s.saves,0),'shares',coalesce(s.shares,0),
    'collaboration_entries',coalesce(s.collaboration_entries,0),'unique_viewers',coalesce(s.unique_viewers,0),
    'avg_progress',coalesce(round(s.avg_progress*100,1),0),
    'followers',(select count(*) from public.follows f,uid where f.followee_id=uid.id and f.project_id is null),
    'comments',(select count(*) from public.media_comments c join mine on mine.id=c.media_id where c.status='active'),
    'published_media',(select count(*) from public.network_media_items m,uid where m.creator_id=uid.id and m.status='published')
  ) from signals s;
$$;

revoke all on function public.creator_media_analytics() from public;
grant execute on function public.creator_media_analytics() to authenticated,service_role;

create or replace function private.queue_media_v2_notifications()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
  if new.status <> 'published' or new.published_at is null then return new; end if;
  if tg_op='UPDATE' and old.status='published' and old.published_at is not distinct from new.published_at then return new; end if;

  if new.creator_id is not null then
    insert into public.media_notification_queue(user_id,media_id,reason,priority)
    select f.follower_id,new.id,'creator_you_follow_published',0.90
    from public.follows f
    where f.followee_id=new.creator_id and f.project_id is null
    on conflict(user_id,media_id) do nothing;
  end if;

  if new.project_id is not null then
    insert into public.media_notification_queue(user_id,media_id,reason,priority)
    select w.user_id,new.id,'watchlist_project_update',0.95
    from public.investor_watchlist w
    where w.project_id=new.project_id and w.status in ('watching','diligence','contacted')
    on conflict(user_id,media_id) do update set priority=greatest(public.media_notification_queue.priority,excluded.priority), reason=excluded.reason;
  end if;
  return new;
end;
$$;

drop trigger if exists queue_media_v2_notifications_trigger on public.network_media_items;
create trigger queue_media_v2_notifications_trigger
after insert or update of status,published_at on public.network_media_items
for each row execute function private.queue_media_v2_notifications();

create or replace function public.ranked_media_feed_v2(audience_tags text[] default '{}'::text[], result_limit integer default 24)
returns setof public.network_media_items
language sql stable security definer set search_path=''
as $$
  with viewer as (select auth.uid() as id),
  state as (
    select coalesce(s.exploration_rate,0.18) exploration_rate, coalesce(s.notification_weight,0.10) notification_weight, coalesce(s.cohort,'explorer') cohort
    from viewer v left join public.recommendation_user_state s on s.user_id=v.id
  ),
  candidate_items as materialized (
    select item.*
    from public.network_media_items item
    where item.status='published' and item.safety_score>=0.35
      and (item.featured or item.published_at>=now()-interval '365 days' or item.quality_score>=0.75 or item.collaboration_score>=0.75 or (cardinality(audience_tags)>0 and item.audience_tags && audience_tags))
    order by item.featured desc,greatest(item.quality_score,item.collaboration_score) desc,item.published_at desc nulls last
    limit 1000
  ),
  global_signal as (
    select e.entity_id,
      count(*) filter(where e.event_type in ('complete','rewatch','save','share','comment','collaboration_enter','follow'))::numeric positive_events,
      count(*) filter(where e.event_type in ('skip','hide','report'))::numeric negative_events,
      avg(case when e.event_type='watch' and (e.context->>'progress') ~ '^[0-9]+([.][0-9]+)?$' then least(1::numeric,greatest(0::numeric,(e.context->>'progress')::numeric)) when e.event_type='complete' then 1::numeric end) avg_progress
    from public.recommendation_events e join candidate_items c on c.id=e.entity_id
    where e.entity_type='network_media' and e.created_at>=now()-interval '14 days'
    group by e.entity_id
  ),
  viewer_item as (
    select e.entity_id,
      max(e.created_at) filter(where e.event_type='impression') last_impression,
      max(e.created_at) filter(where e.event_type='complete') last_complete,
      count(*) filter(where e.event_type='rewatch')::numeric rewatches,
      count(*) filter(where e.event_type='skip')::numeric skips,
      count(*) filter(where e.event_type='hide')::numeric hides,
      count(*) filter(where e.event_type='report')::numeric reports
    from public.recommendation_events e join candidate_items c on c.id=e.entity_id cross join viewer v
    where v.id is not null and e.user_id=v.id and e.entity_type='network_media' and e.created_at>=now()-interval '90 days'
    group by e.entity_id
  ),
  scored as (
    select item.*,
      (
        item.quality_score*0.19 + item.collaboration_score*0.17 + item.credibility_score*0.10 + item.safety_score*0.10
        + case when cardinality(audience_tags)>0 and item.audience_tags && audience_tags then 0.09 else 0 end
        + exp(-greatest(extract(epoch from (now()-coalesce(item.published_at,item.created_at)))/3600.0,0)/96.0)*0.07
        + least(0.20,coalesce((select sum(greatest(-5,least(20,a.score)))*0.01 from unnest(item.topic_tags) t join public.recommendation_topic_affinity a on a.topic=t cross join viewer v where a.user_id=v.id),0))
        + least(0.14,coalesce((select a.score*0.012 from public.recommendation_creator_affinity a cross join viewer v where a.user_id=v.id and a.creator_id=item.creator_id),0))
        + case when exists(select 1 from public.follows f cross join viewer v where f.follower_id=v.id and f.followee_id=item.creator_id and f.project_id is null) then 0.12 else 0 end
        + case when exists(select 1 from public.investor_watchlist w cross join viewer v where w.user_id=v.id and w.project_id=item.project_id and w.status in ('watching','diligence','contacted')) then 0.15 else 0 end
        + case when exists(select 1 from public.media_notification_queue q cross join viewer v cross join state st where q.user_id=v.id and q.media_id=item.id and q.opened_at is null) then (select notification_weight from state) else 0 end
        + least(0.08,ln(1+coalesce(gs.positive_events,0))/ln(51)*0.08)
        + coalesce(gs.avg_progress,0)*0.05
        + case when item.stream_state='live' then 0.10 when item.stream_state='scheduled' then 0.04 else 0 end
        + ((('x'||substr(md5(item.id::text||date_trunc('hour',now())::text),1,8))::bit(32)::bigint % 1000)::numeric/1000.0)*(select exploration_rate*0.16 from state)
        - case when vi.last_impression>=now()-interval '4 hours' then 0.10 else 0 end
        - case when vi.last_complete>=now()-interval '7 days' and coalesce(vi.rewatches,0)=0 then 0.09 else 0 end
        - least(0.30,coalesce(vi.skips,0)*0.10)
        - least(1.00,coalesce(vi.hides,0)*0.70)
        - least(2.00,coalesce(vi.reports,0)*1.50)
        - least(0.18,coalesce(gs.negative_events,0)/greatest(coalesce(gs.positive_events,0)+coalesce(gs.negative_events,0),8)*0.18)
      ) rank_score
    from candidate_items item
    left join global_signal gs on gs.entity_id=item.id
    left join viewer_item vi on vi.entity_id=item.id
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

revoke all on function public.ranked_media_feed_v2(text[],integer) from public;
grant execute on function public.ranked_media_feed_v2(text[],integer) to anon,authenticated,service_role;

-- Realtime is required for chat, presence coordination and WebRTC signaling.
do $$
begin
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='live_chat_messages') then
    alter publication supabase_realtime add table public.live_chat_messages;
  end if;
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='live_room_participants') then
    alter publication supabase_realtime add table public.live_room_participants;
  end if;
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='live_room_signals') then
    alter publication supabase_realtime add table public.live_room_signals;
  end if;
end $$;

notify pgrst,'reload schema';
