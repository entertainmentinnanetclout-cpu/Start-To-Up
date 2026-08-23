create table if not exists public.media_comments (
  id uuid primary key default gen_random_uuid(),
  media_id uuid not null references public.network_media_items(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  parent_id uuid references public.media_comments(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  status text not null default 'active' check (status in ('active','hidden','deleted')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists media_comments_media_created_idx on public.media_comments(media_id,created_at desc);
create index if not exists media_comments_parent_idx on public.media_comments(parent_id) where parent_id is not null;

create table if not exists public.live_room_participants (
  live_event_id uuid not null references public.live_events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'viewer' check(role in ('host','cohost','speaker','viewer')),
  state text not null default 'joined' check(state in ('invited','joined','left','blocked')),
  can_share_screen boolean not null default false,
  joined_at timestamptz, left_at timestamptz, updated_at timestamptz not null default now(),
  primary key(live_event_id,user_id)
);
create index if not exists live_room_participants_user_idx on public.live_room_participants(user_id,updated_at desc);

create table if not exists public.live_chat_messages (
  id uuid primary key default gen_random_uuid(),
  live_event_id uuid not null references public.live_events(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  reply_to uuid references public.live_chat_messages(id) on delete set null,
  message_kind text not null default 'message' check(message_kind in ('message','question','reaction','system')),
  body text not null check(char_length(body) between 1 and 1200),
  created_at timestamptz not null default now(), deleted_at timestamptz
);
create index if not exists live_chat_event_created_idx on public.live_chat_messages(live_event_id,created_at desc);

create table if not exists public.live_room_signals (
  id uuid primary key default gen_random_uuid(),
  live_event_id uuid not null references public.live_events(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  target_id uuid references public.profiles(id) on delete cascade,
  signal_type text not null check(signal_type in ('offer','answer','ice','screen_start','screen_stop','cohost_request','cohost_accept')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), expires_at timestamptz not null default(now()+interval '10 minutes')
);
create index if not exists live_room_signals_event_target_idx on public.live_room_signals(live_event_id,target_id,created_at desc);

create table if not exists public.project_pitch_rooms (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  host_id uuid not null references public.profiles(id) on delete cascade,
  live_event_id uuid references public.live_events(id) on delete set null,
  title text not null, summary text not null default '', scheduled_at timestamptz not null,
  duration_minutes integer not null default 30 check(duration_minutes between 10 and 180),
  status text not null default 'scheduled' check(status in ('draft','scheduled','live','ended','cancelled')),
  access_type text not null default 'request' check(access_type in ('public','request','invite_only')),
  max_investors integer not null default 25 check(max_investors between 1 and 500),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists pitch_rooms_project_idx on public.project_pitch_rooms(project_id,scheduled_at desc);

create table if not exists public.project_pitch_room_attendees (
  room_id uuid not null references public.project_pitch_rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'investor' check(role in ('founder','investor','advisor','institution','observer')),
  status text not null default 'requested' check(status in ('requested','invited','approved','joined','interested','follow_up','passed')),
  joined_at timestamptz, updated_at timestamptz not null default now(),
  primary key(room_id,user_id)
);

create table if not exists public.investor_watchlist (
  user_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  source_media_id uuid references public.network_media_items(id) on delete set null,
  status text not null default 'watching' check(status in ('watching','diligence','contacted','passed','invested')),
  private_notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  primary key(user_id,project_id)
);
create index if not exists investor_watchlist_project_idx on public.investor_watchlist(project_id,status,updated_at desc);
create unique index if not exists creator_follow_unique_idx on public.follows(follower_id,followee_id) where followee_id is not null and project_id is null;

create or replace function private.is_live_room_member(_event uuid,_user uuid)
returns boolean language sql stable security definer set search_path=''
as $$select _user is not null and exists(select 1 from public.live_room_participants p where p.live_event_id=_event and p.user_id=_user and p.state='joined')$$;
create or replace function private.is_live_room_host(_event uuid,_user uuid)
returns boolean language sql stable security definer set search_path=''
as $$select _user is not null and exists(select 1 from public.live_events e where e.id=_event and e.host_id=_user)$$;
revoke all on function private.is_live_room_member(uuid,uuid) from public;
revoke all on function private.is_live_room_host(uuid,uuid) from public;
grant execute on function private.is_live_room_member(uuid,uuid) to authenticated,service_role;
grant execute on function private.is_live_room_host(uuid,uuid) to authenticated,service_role;

alter table public.media_comments enable row level security;
alter table public.live_room_participants enable row level security;
alter table public.live_chat_messages enable row level security;
alter table public.live_room_signals enable row level security;
alter table public.project_pitch_rooms enable row level security;
alter table public.project_pitch_room_attendees enable row level security;
alter table public.investor_watchlist enable row level security;

create policy "media comments public read" on public.media_comments for select to anon,authenticated using(status='active' and exists(select 1 from public.network_media_items m where m.id=media_id and m.status='published'));
create policy "media comments create" on public.media_comments for insert to authenticated with check(author_id=(select auth.uid()) and status='active');
create policy "media comments author update" on public.media_comments for update to authenticated using(author_id=(select auth.uid()) or private.is_staff((select auth.uid()))) with check(author_id=(select auth.uid()) or private.is_staff((select auth.uid())));
create policy "media comments author delete" on public.media_comments for delete to authenticated using(author_id=(select auth.uid()) or private.is_staff((select auth.uid())));

create policy "live room members read" on public.live_room_participants for select to authenticated using(user_id=(select auth.uid()) or private.is_live_room_member(live_event_id,(select auth.uid())) or private.is_live_room_host(live_event_id,(select auth.uid())));
create policy "live room join" on public.live_room_participants for insert to authenticated with check(user_id=(select auth.uid()) or private.is_live_room_host(live_event_id,(select auth.uid())));
create policy "live room presence update" on public.live_room_participants for update to authenticated using(user_id=(select auth.uid()) or private.is_live_room_host(live_event_id,(select auth.uid()))) with check(user_id=(select auth.uid()) or private.is_live_room_host(live_event_id,(select auth.uid())));

create policy "live chat read" on public.live_chat_messages for select to authenticated using(private.is_live_room_member(live_event_id,(select auth.uid())) or private.is_live_room_host(live_event_id,(select auth.uid())));
create policy "live chat send" on public.live_chat_messages for insert to authenticated with check(author_id=(select auth.uid()) and (private.is_live_room_member(live_event_id,(select auth.uid())) or private.is_live_room_host(live_event_id,(select auth.uid()))));
create policy "live chat moderate" on public.live_chat_messages for update to authenticated using(author_id=(select auth.uid()) or private.is_live_room_host(live_event_id,(select auth.uid()))) with check(author_id=(select auth.uid()) or private.is_live_room_host(live_event_id,(select auth.uid())));

create policy "live signals read" on public.live_room_signals for select to authenticated using((target_id is null or target_id=(select auth.uid()) or sender_id=(select auth.uid())) and (private.is_live_room_member(live_event_id,(select auth.uid())) or private.is_live_room_host(live_event_id,(select auth.uid()))));
create policy "live signals send" on public.live_room_signals for insert to authenticated with check(sender_id=(select auth.uid()) and (private.is_live_room_member(live_event_id,(select auth.uid())) or private.is_live_room_host(live_event_id,(select auth.uid()))));

create policy "pitch room discover" on public.project_pitch_rooms for select to authenticated using(access_type='public' or host_id=(select auth.uid()) or exists(select 1 from public.project_pitch_room_attendees a where a.room_id=project_pitch_rooms.id and a.user_id=(select auth.uid())));
create policy "pitch room create" on public.project_pitch_rooms for insert to authenticated with check(host_id=(select auth.uid()) and exists(select 1 from public.projects p where p.id=project_id and p.owner_id=(select auth.uid())));
create policy "pitch room manage" on public.project_pitch_rooms for update to authenticated using(host_id=(select auth.uid())) with check(host_id=(select auth.uid()));
create policy "pitch attendees read" on public.project_pitch_room_attendees for select to authenticated using(user_id=(select auth.uid()) or exists(select 1 from public.project_pitch_rooms r where r.id=room_id and r.host_id=(select auth.uid())));
create policy "pitch attendees create" on public.project_pitch_room_attendees for insert to authenticated with check(user_id=(select auth.uid()) or exists(select 1 from public.project_pitch_rooms r where r.id=room_id and r.host_id=(select auth.uid())));
create policy "pitch attendees update" on public.project_pitch_room_attendees for update to authenticated using(user_id=(select auth.uid()) or exists(select 1 from public.project_pitch_rooms r where r.id=room_id and r.host_id=(select auth.uid()))) with check(user_id=(select auth.uid()) or exists(select 1 from public.project_pitch_rooms r where r.id=room_id and r.host_id=(select auth.uid())));
create policy "investor watchlist private" on public.investor_watchlist for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));

notify pgrst,'reload schema';