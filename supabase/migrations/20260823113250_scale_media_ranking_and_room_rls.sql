-- Scale the professional media ranker and collaboration room query paths.

create index if not exists collaboration_requests_project_idx on public.collaboration_requests(project_id,status,created_at desc);
create index if not exists collaboration_requests_creator_idx on public.collaboration_requests(created_by,created_at desc);
create index if not exists workspace_messages_author_idx on public.collaboration_workspace_messages(author_id,created_at desc);
create index if not exists workspace_messages_parent_idx on public.collaboration_workspace_messages(parent_id) where parent_id is not null;
create index if not exists workspace_tasks_assignee_idx on public.collaboration_workspace_tasks(assignee_id,status,due_at) where assignee_id is not null;
create index if not exists workspace_tasks_creator_idx on public.collaboration_workspace_tasks(created_by,created_at desc);
create index if not exists workspace_files_uploader_idx on public.collaboration_workspace_files(uploaded_by,created_at desc);
create index if not exists workspace_decisions_proposer_idx on public.collaboration_workspace_decisions(proposed_by,created_at desc);
create index if not exists workspace_decisions_decider_idx on public.collaboration_workspace_decisions(decided_by,decided_at desc) where decided_by is not null;
create index if not exists workspace_updates_author_idx on public.collaboration_workspace_updates(author_id,created_at desc);
create index if not exists network_media_live_event_idx on public.network_media_items(live_event_id) where live_event_id is not null;
create index if not exists network_media_source_media_idx on public.network_media_items(source_media_id) where source_media_id is not null;
create index if not exists network_media_topic_tags_gin on public.network_media_items using gin(topic_tags);
create index if not exists network_media_audience_tags_gin on public.network_media_items using gin(audience_tags);
create index if not exists recommendation_recent_media_idx on public.recommendation_events(created_at desc,entity_id,event_type) where entity_type='network_media';
create index if not exists projects_owner_created_idx on public.projects(owner_id,created_at desc);
create index if not exists posts_author_created_idx on public.posts(author_id,created_at desc);
create index if not exists posts_project_created_idx on public.posts(project_id,created_at desc) where project_id is not null;
create index if not exists project_milestones_project_created_idx on public.project_milestones(project_id,created_at desc);

-- Use init-plan auth lookup for room policies so auth.uid() is not re-evaluated per row.
drop policy if exists "workspace summaries visible" on public.collaboration_workspaces;
create policy "workspace summaries visible" on public.collaboration_workspaces for select to anon,authenticated using((is_public and status in ('open','active','completed')) or created_by=(select auth.uid()) or private.is_workspace_member(id,(select auth.uid())) or private.is_staff((select auth.uid())));
drop policy if exists "members create workspaces" on public.collaboration_workspaces;
create policy "members create workspaces" on public.collaboration_workspaces for insert to authenticated with check(created_by=(select auth.uid()) and (project_id is null or private.can_edit_project(project_id,(select auth.uid()))));
drop policy if exists "workspace managers update" on public.collaboration_workspaces;
create policy "workspace managers update" on public.collaboration_workspaces for update to authenticated using(private.can_manage_workspace(id,(select auth.uid()))) with check(private.can_manage_workspace(id,(select auth.uid())));
drop policy if exists "workspace managers delete" on public.collaboration_workspaces;
create policy "workspace managers delete" on public.collaboration_workspaces for delete to authenticated using(private.can_manage_workspace(id,(select auth.uid())));

drop policy if exists "workspace members visible" on public.collaboration_workspace_members;
create policy "workspace members visible" on public.collaboration_workspace_members for select to authenticated using(user_id=(select auth.uid()) or private.can_access_workspace(workspace_id,(select auth.uid())) or private.can_manage_workspace(workspace_id,(select auth.uid())));
drop policy if exists "request or add workspace member" on public.collaboration_workspace_members;
create policy "request or add workspace member" on public.collaboration_workspace_members for insert to authenticated with check(private.can_manage_workspace(workspace_id,(select auth.uid())) or (user_id=(select auth.uid()) and status='requested' and exists(select 1 from public.collaboration_workspaces w where w.id=workspace_id and w.is_public and w.status in ('open','active'))));
drop policy if exists "workspace managers update members" on public.collaboration_workspace_members;
create policy "workspace managers update members" on public.collaboration_workspace_members for update to authenticated using(private.can_manage_workspace(workspace_id,(select auth.uid()))) with check(private.can_manage_workspace(workspace_id,(select auth.uid())));
drop policy if exists "cancel own workspace request" on public.collaboration_workspace_members;
create policy "cancel own workspace request" on public.collaboration_workspace_members for delete to authenticated using(user_id=(select auth.uid()) or private.can_manage_workspace(workspace_id,(select auth.uid())));

drop policy if exists "room messages visible" on public.collaboration_workspace_messages;
create policy "room messages visible" on public.collaboration_workspace_messages for select to authenticated using(private.can_access_workspace(workspace_id,(select auth.uid())));
drop policy if exists "room members message" on public.collaboration_workspace_messages;
create policy "room members message" on public.collaboration_workspace_messages for insert to authenticated with check(author_id=(select auth.uid()) and private.can_access_workspace(workspace_id,(select auth.uid())));
drop policy if exists "authors update room messages" on public.collaboration_workspace_messages;
create policy "authors update room messages" on public.collaboration_workspace_messages for update to authenticated using(author_id=(select auth.uid()) or private.can_manage_workspace(workspace_id,(select auth.uid()))) with check(author_id=(select auth.uid()) or private.can_manage_workspace(workspace_id,(select auth.uid())));
drop policy if exists "authors delete room messages" on public.collaboration_workspace_messages;
create policy "authors delete room messages" on public.collaboration_workspace_messages for delete to authenticated using(author_id=(select auth.uid()) or private.can_manage_workspace(workspace_id,(select auth.uid())));

drop policy if exists "room tasks visible" on public.collaboration_workspace_tasks;
create policy "room tasks visible" on public.collaboration_workspace_tasks for select to authenticated using(private.can_access_workspace(workspace_id,(select auth.uid())));
drop policy if exists "room members create tasks" on public.collaboration_workspace_tasks;
create policy "room members create tasks" on public.collaboration_workspace_tasks for insert to authenticated with check(created_by=(select auth.uid()) and private.can_access_workspace(workspace_id,(select auth.uid())));
drop policy if exists "room members update tasks" on public.collaboration_workspace_tasks;
create policy "room members update tasks" on public.collaboration_workspace_tasks for update to authenticated using(private.can_access_workspace(workspace_id,(select auth.uid()))) with check(private.can_access_workspace(workspace_id,(select auth.uid())));
drop policy if exists "room managers delete tasks" on public.collaboration_workspace_tasks;
create policy "room managers delete tasks" on public.collaboration_workspace_tasks for delete to authenticated using(created_by=(select auth.uid()) or private.can_manage_workspace(workspace_id,(select auth.uid())));

drop policy if exists "room files visible" on public.collaboration_workspace_files;
create policy "room files visible" on public.collaboration_workspace_files for select to authenticated using(private.can_access_workspace(workspace_id,(select auth.uid())));
drop policy if exists "room members register files" on public.collaboration_workspace_files;
create policy "room members register files" on public.collaboration_workspace_files for insert to authenticated with check(uploaded_by=(select auth.uid()) and private.can_access_workspace(workspace_id,(select auth.uid())));
drop policy if exists "room members update files" on public.collaboration_workspace_files;
create policy "room members update files" on public.collaboration_workspace_files for update to authenticated using(uploaded_by=(select auth.uid()) or private.can_manage_workspace(workspace_id,(select auth.uid()))) with check(uploaded_by=(select auth.uid()) or private.can_manage_workspace(workspace_id,(select auth.uid())));
drop policy if exists "room members delete files" on public.collaboration_workspace_files;
create policy "room members delete files" on public.collaboration_workspace_files for delete to authenticated using(uploaded_by=(select auth.uid()) or private.can_manage_workspace(workspace_id,(select auth.uid())));

drop policy if exists "room decisions visible" on public.collaboration_workspace_decisions;
create policy "room decisions visible" on public.collaboration_workspace_decisions for select to authenticated using(private.can_access_workspace(workspace_id,(select auth.uid())));
drop policy if exists "room members propose decisions" on public.collaboration_workspace_decisions;
create policy "room members propose decisions" on public.collaboration_workspace_decisions for insert to authenticated with check(proposed_by=(select auth.uid()) and private.can_access_workspace(workspace_id,(select auth.uid())));
drop policy if exists "room managers decide" on public.collaboration_workspace_decisions;
create policy "room managers decide" on public.collaboration_workspace_decisions for update to authenticated using(private.can_manage_workspace(workspace_id,(select auth.uid()))) with check(private.can_manage_workspace(workspace_id,(select auth.uid())));
drop policy if exists "room managers delete decisions" on public.collaboration_workspace_decisions;
create policy "room managers delete decisions" on public.collaboration_workspace_decisions for delete to authenticated using(private.can_manage_workspace(workspace_id,(select auth.uid())));

drop policy if exists "room updates visible" on public.collaboration_workspace_updates;
create policy "room updates visible" on public.collaboration_workspace_updates for select to authenticated using(private.can_access_workspace(workspace_id,(select auth.uid())));
drop policy if exists "room members post updates" on public.collaboration_workspace_updates;
create policy "room members post updates" on public.collaboration_workspace_updates for insert to authenticated with check(author_id=(select auth.uid()) and private.can_access_workspace(workspace_id,(select auth.uid())));
drop policy if exists "authors update room updates" on public.collaboration_workspace_updates;
create policy "authors update room updates" on public.collaboration_workspace_updates for update to authenticated using(author_id=(select auth.uid()) or private.can_manage_workspace(workspace_id,(select auth.uid()))) with check(author_id=(select auth.uid()) or private.can_manage_workspace(workspace_id,(select auth.uid())));
drop policy if exists "authors delete room updates" on public.collaboration_workspace_updates;
create policy "authors delete room updates" on public.collaboration_workspace_updates for delete to authenticated using(author_id=(select auth.uid()) or private.can_manage_workspace(workspace_id,(select auth.uid())));

-- Rank a bounded candidate pool instead of scoring the entire catalog on each request.
drop function if exists public.ranked_media_feed(text[],integer);
create function public.ranked_media_feed(audience_tags text[] default '{}',result_limit integer default 24)
returns setof public.network_media_items language sql stable security definer set search_path=''
as $$
  with viewer as (select auth.uid() as id),
  candidate_items as materialized (
    select item.*
    from public.network_media_items item
    where item.status='published' and item.safety_score>=0.35
      and (item.featured or item.published_at>=now()-interval '365 days' or item.quality_score>=0.80 or item.collaboration_score>=0.80 or (cardinality(audience_tags)>0 and item.audience_tags && audience_tags))
    order by case when cardinality(audience_tags)>0 and item.audience_tags && audience_tags then 1 else 0 end desc,item.featured desc,greatest(item.quality_score,item.collaboration_score) desc,item.published_at desc nulls last
    limit 800
  ),
  global_signal as (
    select e.entity_id,
      count(*) filter(where e.event_type in ('complete','rewatch','save','share','comment','collaboration_enter','follow'))::numeric as positive_events,
      count(*) filter(where e.event_type in ('skip','hide','report'))::numeric as negative_events,
      avg(case when e.event_type='watch' and (e.context->>'progress') ~ '^[0-9]+([.][0-9]+)?$' then least(1::numeric,greatest(0::numeric,(e.context->>'progress')::numeric)) when e.event_type='complete' then 1::numeric else null end) as avg_progress
    from public.recommendation_events e join candidate_items ci on ci.id=e.entity_id
    where e.entity_type='network_media' and e.created_at>=now()-interval '14 days'
    group by e.entity_id
  ),
  viewer_item as (
    select e.entity_id,
      max(e.created_at) filter(where e.event_type='impression') as last_impression,
      max(e.created_at) filter(where e.event_type='complete') as last_complete,
      count(*) filter(where e.event_type='rewatch')::numeric as rewatches,
      count(*) filter(where e.event_type='skip')::numeric as skips,
      count(*) filter(where e.event_type='hide')::numeric as hides,
      count(*) filter(where e.event_type='report')::numeric as reports
    from public.recommendation_events e join candidate_items ci on ci.id=e.entity_id cross join viewer v
    where v.id is not null and e.user_id=v.id and e.entity_type='network_media' and e.created_at>=now()-interval '90 days'
    group by e.entity_id
  ),
  viewer_topics as (
    select tag,sum(case e.event_type when 'collaboration_enter' then 6 when 'save' then 5 when 'rewatch' then 5 when 'share' then 4 when 'complete' then 3 when 'follow' then 4 when 'support' then 2 else 1 end)::numeric as affinity
    from public.recommendation_events e
    join public.network_media_items seen on seen.id=e.entity_id
    cross join lateral unnest(seen.topic_tags) tag
    cross join viewer v
    where v.id is not null and e.user_id=v.id and e.entity_type='network_media' and e.event_type in ('play','watch','complete','rewatch','support','save','share','comment','collaboration_enter','follow') and e.created_at>=now()-interval '90 days'
    group by tag
  ),
  recent_creator_exposure as (
    select seen.author_handle,count(*)::numeric as impressions
    from public.recommendation_events e join public.network_media_items seen on seen.id=e.entity_id cross join viewer v
    where v.id is not null and e.user_id=v.id and e.entity_type='network_media' and e.event_type='impression' and e.created_at>=now()-interval '6 hours'
    group by seen.author_handle
  ),
  scored as (
    select item.*,
      (item.quality_score*0.22+item.collaboration_score*0.18+item.credibility_score*0.10+item.safety_score*0.10
       +case when cardinality(audience_tags)>0 and item.audience_tags && audience_tags then 0.10 else 0 end
       +exp(-greatest(extract(epoch from(now()-coalesce(item.published_at,item.created_at)))/3600.0,0)/96.0)*0.08
       +least(0.16,coalesce((select sum(vt.affinity)*0.008 from unnest(item.topic_tags) candidate_tag join viewer_topics vt on vt.tag=candidate_tag),0))
       +least(0.08,ln(1+coalesce(gs.positive_events,0))/ln(51)*0.08)+coalesce(gs.avg_progress,0)*0.05
       +case when item.stream_state='live' then 0.08 when item.stream_state='scheduled' then 0.03 else 0 end
       +((('x'||substr(md5(item.id::text||date_trunc('hour',now())::text),1,8))::bit(32)::bigint%1000)::numeric/1000.0)*0.03
       -least(0.12,coalesce(rce.impressions,0)*0.03)
       -case when vi.last_impression>=now()-interval '6 hours' then 0.08 else 0 end
       -case when vi.last_complete>=now()-interval '7 days' and coalesce(vi.rewatches,0)=0 then 0.08 else 0 end
       -least(0.30,coalesce(vi.skips,0)*0.10)-least(1.00,coalesce(vi.hides,0)*0.70)-least(2.00,coalesce(vi.reports,0)*1.50)
       -least(0.18,coalesce(gs.negative_events,0)/greatest(coalesce(gs.positive_events,0)+coalesce(gs.negative_events,0),8)*0.18)) as rank_score
    from candidate_items item
    left join global_signal gs on gs.entity_id=item.id
    left join viewer_item vi on vi.entity_id=item.id
    left join recent_creator_exposure rce on rce.author_handle=item.author_handle
  )
  select s.id,s.showcase_id,s.author_name,s.author_handle,s.author_role,s.title,s.caption,s.media_kind,s.poster_url,s.playback_url,s.duration_seconds,s.audience_tags,s.topic_tags,s.call_to_action,s.destination_url,s.quality_score,s.collaboration_score,s.freshness_boost,s.status,s.featured,s.published_at,s.created_at,s.updated_at,s.creator_id,s.project_id,s.live_event_id,s.source_media_id,s.credibility_score,s.safety_score,s.stream_state,s.captions_url,s.allow_collaboration,s.aspect_ratio
  from scored s
  order by s.rank_score desc,s.featured desc,s.published_at desc nulls last
  limit least(greatest(result_limit,1),50);
$$;
revoke execute on function public.ranked_media_feed(text[],integer) from public;
grant execute on function public.ranked_media_feed(text[],integer) to anon,authenticated,service_role;

notify pgrst,'reload schema';
