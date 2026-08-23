-- Direct project rooms + explicit public Build Reel delivery.
alter table public.collaboration_workspaces alter column showcase_id drop not null;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('network-media','network-media',true,524288000,array['video/mp4','video/webm','image/jpeg','image/png','image/webp','text/vtt'])
on conflict(id) do update set public=true,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create policy "network media public read" on storage.objects for select to anon,authenticated
using(bucket_id='network-media');
create policy "network media member upload" on storage.objects for insert to authenticated
with check(bucket_id='network-media' and (storage.foldername(name))[1]=auth.uid()::text and private.is_permanent_user());
create policy "network media owner update" on storage.objects for update to authenticated
using(bucket_id='network-media' and owner_id=auth.uid()::text)
with check(bucket_id='network-media' and owner_id=auth.uid()::text);
create policy "network media owner delete" on storage.objects for delete to authenticated
using(bucket_id='network-media' and owner_id=auth.uid()::text);

create or replace function public.publish_build_reel(
  _project_id uuid,
  _title text,
  _caption text,
  _storage_path text,
  _playback_url text,
  _poster_url text default null,
  _duration_seconds integer default null,
  _topic_tags text[] default '{}',
  _audience_tags text[] default array['developers','entrepreneurs','innovators','investors','institutions']
)
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  viewer_id uuid:=auth.uid();
  publication_id uuid;
  feed_id uuid;
  profile_row public.profiles%rowtype;
begin
  if viewer_id is null or not private.is_permanent_user() then raise exception 'Authentication required'; end if;
  if char_length(trim(coalesce(_title,''))) < 3 then raise exception 'A title is required'; end if;
  if char_length(trim(coalesce(_caption,''))) < 10 then raise exception 'A useful caption is required'; end if;
  if _project_id is not null and not private.can_edit_project(_project_id,viewer_id) then raise exception 'Project access denied'; end if;
  if coalesce(_storage_path,'')='' or coalesce(_playback_url,'')='' then raise exception 'Media path is required'; end if;

  select * into profile_row from public.profiles p where p.id=viewer_id;

  insert into public.media_publications(creator_id,project_id,title,caption,kind,status,visibility,storage_path,duration_seconds,published_at)
  values(viewer_id,_project_id,trim(_title),trim(_caption),'build_reel','published','public',_storage_path,_duration_seconds,now())
  returning id into publication_id;

  insert into public.network_media_items(
    creator_id,project_id,source_media_id,author_name,author_handle,author_role,title,caption,media_kind,
    poster_url,playback_url,duration_seconds,audience_tags,topic_tags,call_to_action,destination_url,
    quality_score,collaboration_score,freshness_boost,credibility_score,safety_score,status,featured,published_at,allow_collaboration,aspect_ratio
  ) values(
    viewer_id,_project_id,publication_id,
    coalesce(nullif(profile_row.display_name,''),profile_row.username,'Start To Up member'),
    '@'||coalesce(profile_row.username,substr(viewer_id::text,1,8)),'Builder',trim(_title),trim(_caption),'build_reel',
    coalesce(nullif(_poster_url,''),'/brand/start-to-up-og-image.png'),_playback_url,_duration_seconds,
    coalesce(_audience_tags,array['developers','entrepreneurs','innovators','investors','institutions']),
    coalesce(_topic_tags,'{}'::text[]),'Open collaboration','/app/collaboration',
    0.650,0.800,1.000,case when profile_row.is_verified then 0.750 else 0.550 end,1.000,'published',false,now(),true,'9:16'
  ) returning id into feed_id;

  return feed_id;
end;
$$;
revoke all on function public.publish_build_reel(uuid,text,text,text,text,text,integer,text[],text[]) from public;
grant execute on function public.publish_build_reel(uuid,text,text,text,text,text,integer,text[],text[]) to authenticated,service_role;

notify pgrst,'reload schema';
