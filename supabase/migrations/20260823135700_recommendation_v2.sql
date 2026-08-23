create table if not exists public.recommendation_topic_affinity (
  user_id uuid not null references public.profiles(id) on delete cascade,
  topic text not null, score numeric not null default 0, event_count integer not null default 0,
  last_event_at timestamptz not null default now(), primary key(user_id,topic)
);
create index if not exists recommendation_topic_user_score_idx on public.recommendation_topic_affinity(user_id,score desc,last_event_at desc);

create table if not exists public.recommendation_creator_affinity (
  user_id uuid not null references public.profiles(id) on delete cascade,
  creator_id uuid not null references public.profiles(id) on delete cascade,
  score numeric not null default 0, event_count integer not null default 0,
  last_event_at timestamptz not null default now(), primary key(user_id,creator_id)
);
create index if not exists recommendation_creator_user_score_idx on public.recommendation_creator_affinity(user_id,score desc,last_event_at desc);

create table if not exists public.recommendation_user_state (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  cohort text not null default 'explorer' check(cohort in ('explorer','builder','founder','investor','institution','deep_learner','connector')),
  exploration_rate numeric not null default .18 check(exploration_rate between 0 and 1),
  notification_weight numeric not null default .10 check(notification_weight between 0 and 1),
  last_refreshed_at timestamptz not null default now()
);

create table if not exists public.media_notification_queue (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  media_id uuid not null references public.network_media_items(id) on delete cascade,
  reason text not null, priority numeric not null default .5, delivered_at timestamptz, opened_at timestamptz,
  created_at timestamptz not null default now(), unique(user_id,media_id)
);
create index if not exists media_notification_user_idx on public.media_notification_queue(user_id,opened_at,priority desc,created_at desc);

alter table public.recommendation_topic_affinity enable row level security;
alter table public.recommendation_creator_affinity enable row level security;
alter table public.recommendation_user_state enable row level security;
alter table public.media_notification_queue enable row level security;
create policy "topic affinity private" on public.recommendation_topic_affinity for select to authenticated using(user_id=(select auth.uid()));
create policy "creator affinity private" on public.recommendation_creator_affinity for select to authenticated using(user_id=(select auth.uid()));
create policy "recommendation state private" on public.recommendation_user_state for select to authenticated using(user_id=(select auth.uid()));
create policy "media notifications private" on public.media_notification_queue for select to authenticated using(user_id=(select auth.uid()));
create policy "media notifications update" on public.media_notification_queue for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));

create or replace function private.media_event_weight(_event_type text)
returns numeric language sql immutable set search_path=''
as $$select case _event_type when 'collaboration_enter' then 7 when 'follow' then 6 when 'save' then 5 when 'rewatch' then 5 when 'share' then 4 when 'complete' then 4 when 'comment' then 3 when 'support' then 2 when 'watch' then 1.5 when 'play' then 1 when 'impression' then .2 when 'skip' then -3 when 'hide' then -8 when 'report' then -15 else 0 end$$;

create or replace function private.update_media_affinity()
returns trigger language plpgsql security definer set search_path=''
as $$
declare item public.network_media_items%rowtype; weight numeric; tag text;
begin
  if new.user_id is null or new.entity_type<>'network_media' then return new; end if;
  select * into item from public.network_media_items where id=new.entity_id;
  if item.id is null then return new; end if;
  weight:=private.media_event_weight(new.event_type);
  foreach tag in array item.topic_tags loop
    insert into public.recommendation_topic_affinity(user_id,topic,score,event_count,last_event_at)
    values(new.user_id,tag,weight,1,new.created_at)
    on conflict(user_id,topic) do update set score=greatest(-100,least(100,recommendation_topic_affinity.score*.985+excluded.score)),event_count=recommendation_topic_affinity.event_count+1,last_event_at=excluded.last_event_at;
  end loop;
  if item.creator_id is not null then
    insert into public.recommendation_creator_affinity(user_id,creator_id,score,event_count,last_event_at)
    values(new.user_id,item.creator_id,weight,1,new.created_at)
    on conflict(user_id,creator_id) do update set score=greatest(-100,least(100,recommendation_creator_affinity.score*.985+excluded.score)),event_count=recommendation_creator_affinity.event_count+1,last_event_at=excluded.last_event_at;
  end if;
  insert into public.recommendation_user_state(user_id,cohort,exploration_rate,notification_weight,last_refreshed_at)
  values(new.user_id,
    case when new.event_type='collaboration_enter' then 'builder' when new.event_type in ('complete','rewatch') then 'deep_learner' when new.event_type='follow' then 'connector' else 'explorer' end,
    case when new.event_type in ('hide','skip') then .25 else .18 end,
    case when coalesce(new.context->>'source','')='notification' then .18 else .10 end,now())
  on conflict(user_id) do update set
    cohort=case when new.event_type='collaboration_enter' then 'builder' when new.event_type='follow' then 'connector' else recommendation_user_state.cohort end,
    exploration_rate=case when new.event_type in ('hide','skip') then least(.35,recommendation_user_state.exploration_rate+.01) else greatest(.08,recommendation_user_state.exploration_rate*.995) end,
    notification_weight=case when coalesce(new.context->>'source','')='notification' then least(.25,recommendation_user_state.notification_weight+.01) else recommendation_user_state.notification_weight end,
    last_refreshed_at=now();
  return new;
end;$$;
drop trigger if exists recommendation_event_affinity_trigger on public.recommendation_events;
create trigger recommendation_event_affinity_trigger after insert on public.recommendation_events for each row execute function private.update_media_affinity();

create or replace function public.toggle_creator_follow(_creator_id uuid)
returns boolean language plpgsql security definer set search_path=''
as $$declare uid uuid:=auth.uid(); exists_follow boolean; begin
  if uid is null or uid=_creator_id then return false; end if;
  select exists(select 1 from public.follows where follower_id=uid and followee_id=_creator_id and project_id is null) into exists_follow;
  if exists_follow then delete from public.follows where follower_id=uid and followee_id=_creator_id and project_id is null; return false; end if;
  insert into public.follows(follower_id,followee_id) values(uid,_creator_id) on conflict do nothing; return true;
end;$$;
revoke all on function public.toggle_creator_follow(uuid) from public; grant execute on function public.toggle_creator_follow(uuid) to authenticated,service_role;

create or replace function public.toggle_investor_watchlist(_project_id uuid,_source_media_id uuid default null)
returns boolean language plpgsql security definer set search_path=''
as $$declare uid uuid:=auth.uid(); exists_row boolean; begin
  if uid is null then return false; end if;
  select exists(select 1 from public.investor_watchlist where user_id=uid and project_id=_project_id) into exists_row;
  if exists_row then delete from public.investor_watchlist where user_id=uid and project_id=_project_id; return false; end if;
  insert into public.investor_watchlist(user_id,project_id,source_media_id) values(uid,_project_id,_source_media_id); return true;
end;$$;
revoke all on function public.toggle_investor_watchlist(uuid,uuid) from public; grant execute on function public.toggle_investor_watchlist(uuid,uuid) to authenticated,service_role;

create or replace function private.queue_media_v2_notifications()
returns trigger language plpgsql security definer set search_path=''
as $$begin
  if new.status<>'published' or new.published_at is null then return new; end if;
  if tg_op='UPDATE' and old.status='published' and old.published_at is not distinct from new.published_at then return new; end if;
  if new.creator_id is not null then
    insert into public.media_notification_queue(user_id,media_id,reason,priority)
    select f.follower_id,new.id,'creator_you_follow_published',.90 from public.follows f where f.followee_id=new.creator_id and f.project_id is null on conflict(user_id,media_id) do nothing;
  end if;
  if new.project_id is not null then
    insert into public.media_notification_queue(user_id,media_id,reason,priority)
    select w.user_id,new.id,'watchlist_project_update',.95 from public.investor_watchlist w where w.project_id=new.project_id and w.status in ('watching','diligence','contacted')
    on conflict(user_id,media_id) do update set priority=greatest(media_notification_queue.priority,excluded.priority),reason=excluded.reason;
  end if;
  return new;
end;$$;
drop trigger if exists queue_media_v2_notifications_trigger on public.network_media_items;
create trigger queue_media_v2_notifications_trigger after insert or update of status,published_at on public.network_media_items for each row execute function private.queue_media_v2_notifications();

create or replace function public.ranked_media_feed_v2(audience_tags text[] default '{}'::text[],result_limit integer default 24)
returns setof public.network_media_items language sql stable security definer set search_path=''
as $$
with viewer as(select auth.uid() id), state as(
  select coalesce(s.exploration_rate,.18) exploration_rate,coalesce(s.notification_weight,.10) notification_weight from viewer v left join public.recommendation_user_state s on s.user_id=v.id
), candidates as materialized(
  select m.* from public.network_media_items m where m.status='published' and m.safety_score>=.35 and (m.featured or m.published_at>=now()-interval '365 days' or m.quality_score>=.75 or m.collaboration_score>=.75 or (cardinality(audience_tags)>0 and m.audience_tags&&audience_tags))
  order by m.featured desc,greatest(m.quality_score,m.collaboration_score) desc,m.published_at desc nulls last limit 1000
), viewer_item as(
  select e.entity_id,max(e.created_at) filter(where e.event_type='impression') last_impression,max(e.created_at) filter(where e.event_type='complete') last_complete,
  count(*) filter(where e.event_type='rewatch') rewatches,count(*) filter(where e.event_type='skip') skips,count(*) filter(where e.event_type='hide') hides,count(*) filter(where e.event_type='report') reports
  from public.recommendation_events e join candidates c on c.id=e.entity_id cross join viewer v where v.id is not null and e.user_id=v.id and e.entity_type='network_media' and e.created_at>=now()-interval '90 days' group by e.entity_id
), scored as(
  select c.*,(c.quality_score*.21+c.collaboration_score*.18+c.credibility_score*.10+c.safety_score*.10
    +case when cardinality(audience_tags)>0 and c.audience_tags&&audience_tags then .09 else 0 end
    +exp(-greatest(extract(epoch from(now()-coalesce(c.published_at,c.created_at)))/3600,0)/96)*.07
    +least(.20,coalesce((select sum(greatest(-5,least(20,a.score)))*.01 from unnest(c.topic_tags)t join public.recommendation_topic_affinity a on a.topic=t cross join viewer v where a.user_id=v.id),0))
    +least(.14,coalesce((select a.score*.012 from public.recommendation_creator_affinity a cross join viewer v where a.user_id=v.id and a.creator_id=c.creator_id),0))
    +case when exists(select 1 from public.follows f cross join viewer v where f.follower_id=v.id and f.followee_id=c.creator_id and f.project_id is null) then .12 else 0 end
    +case when exists(select 1 from public.investor_watchlist w cross join viewer v where w.user_id=v.id and w.project_id=c.project_id and w.status in('watching','diligence','contacted')) then .15 else 0 end
    +case when exists(select 1 from public.media_notification_queue q cross join viewer v where q.user_id=v.id and q.media_id=c.id and q.opened_at is null) then (select notification_weight from state) else 0 end
    +case when c.stream_state='live' then .10 when c.stream_state='scheduled' then .04 else 0 end
    +((('x'||substr(md5(c.id::text||date_trunc('hour',now())::text),1,8))::bit(32)::bigint%1000)::numeric/1000)*(select exploration_rate*.16 from state)
    -case when vi.last_impression>=now()-interval '4 hours' then .10 else 0 end
    -case when vi.last_complete>=now()-interval '7 days' and coalesce(vi.rewatches,0)=0 then .09 else 0 end
    -least(.30,coalesce(vi.skips,0)*.10)-least(1,coalesce(vi.hides,0)*.70)-least(2,coalesce(vi.reports,0)*1.5)
  ) rank_score from candidates c left join viewer_item vi on vi.entity_id=c.id
)
select s.id,s.showcase_id,s.author_name,s.author_handle,s.author_role,s.title,s.caption,s.media_kind,s.poster_url,s.playback_url,s.duration_seconds,s.audience_tags,s.topic_tags,s.call_to_action,s.destination_url,s.quality_score,s.collaboration_score,s.freshness_boost,s.status,s.featured,s.published_at,s.created_at,s.updated_at,s.creator_id,s.project_id,s.live_event_id,s.source_media_id,s.credibility_score,s.safety_score,s.stream_state,s.captions_url,s.allow_collaboration,s.aspect_ratio
from scored s order by s.rank_score desc,s.featured desc,s.published_at desc nulls last limit least(greatest(result_limit,1),50);
$$;
revoke all on function public.ranked_media_feed_v2(text[],integer) from public; grant execute on function public.ranked_media_feed_v2(text[],integer) to anon,authenticated,service_role;
notify pgrst,'reload schema';