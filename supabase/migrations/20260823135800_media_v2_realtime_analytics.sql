create or replace function public.creator_media_analytics()
returns jsonb language sql stable security definer set search_path=''
as $$
with uid as(select auth.uid() id), mine as(select m.id from public.network_media_items m,uid where m.creator_id=uid.id), signals as(
  select count(*) filter(where e.event_type='impression') impressions,count(*) filter(where e.event_type='play') plays,
  count(*) filter(where e.event_type='complete') completions,count(*) filter(where e.event_type='rewatch') rewatches,
  count(*) filter(where e.event_type='save') saves,count(*) filter(where e.event_type='share') shares,
  count(*) filter(where e.event_type='collaboration_enter') collaboration_entries,
  count(distinct e.user_id) filter(where e.user_id is not null) unique_viewers,
  avg(case when e.event_type='watch' and (e.context->>'progress')~'^[0-9]+([.][0-9]+)?$' then (e.context->>'progress')::numeric end) avg_progress
  from public.recommendation_events e join mine on mine.id=e.entity_id where e.entity_type='network_media' and e.created_at>=now()-interval '90 days'
)
select jsonb_build_object(
  'impressions',coalesce(s.impressions,0),'plays',coalesce(s.plays,0),'completions',coalesce(s.completions,0),'rewatches',coalesce(s.rewatches,0),
  'saves',coalesce(s.saves,0),'shares',coalesce(s.shares,0),'collaboration_entries',coalesce(s.collaboration_entries,0),
  'unique_viewers',coalesce(s.unique_viewers,0),'avg_progress',coalesce(round(s.avg_progress*100,1),0),
  'followers',(select count(*) from public.follows f,uid where f.followee_id=uid.id and f.project_id is null),
  'comments',(select count(*) from public.media_comments c join mine on mine.id=c.media_id where c.status='active'),
  'published_media',(select count(*) from public.network_media_items m,uid where m.creator_id=uid.id and m.status='published')
) from signals s;$$;
revoke all on function public.creator_media_analytics() from public;
grant execute on function public.creator_media_analytics() to authenticated,service_role;

create or replace function private.queue_media_v2_notifications()
returns trigger language plpgsql security definer set search_path=''
as $$
declare follower record; watcher record;
begin
  if new.status<>'published' or new.published_at is null then return new; end if;
  if tg_op='UPDATE' and old.status='published' and old.published_at is not distinct from new.published_at then return new; end if;
  if new.creator_id is not null then
    for follower in select f.follower_id user_id from public.follows f where f.followee_id=new.creator_id and f.project_id is null loop
      insert into public.media_notification_queue(user_id,media_id,reason,priority) values(follower.user_id,new.id,'creator_you_follow_published',.90) on conflict(user_id,media_id) do nothing;
      insert into public.notifications(user_id,kind,title,body,link_path) values(follower.user_id,'media_recommendation','New media from a creator you follow',new.title,'/app/media');
    end loop;
  end if;
  if new.project_id is not null then
    for watcher in select w.user_id from public.investor_watchlist w where w.project_id=new.project_id and w.status in('watching','diligence','contacted') loop
      insert into public.media_notification_queue(user_id,media_id,reason,priority) values(watcher.user_id,new.id,'watchlist_project_update',.95)
      on conflict(user_id,media_id) do update set priority=greatest(media_notification_queue.priority,excluded.priority),reason=excluded.reason;
      insert into public.notifications(user_id,kind,title,body,link_path) values(watcher.user_id,'watchlist_update','A venture on your watchlist published an update',new.title,'/app/media');
    end loop;
  end if;
  return new;
end;$$;

drop trigger if exists queue_media_v2_notifications_trigger on public.network_media_items;
create trigger queue_media_v2_notifications_trigger after insert or update of status,published_at on public.network_media_items for each row execute function private.queue_media_v2_notifications();

do $$begin
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='media_comments') then alter publication supabase_realtime add table public.media_comments; end if;
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='live_chat_messages') then alter publication supabase_realtime add table public.live_chat_messages; end if;
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='live_room_participants') then alter publication supabase_realtime add table public.live_room_participants; end if;
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='live_room_signals') then alter publication supabase_realtime add table public.live_room_signals; end if;
end$$;
notify pgrst,'reload schema';