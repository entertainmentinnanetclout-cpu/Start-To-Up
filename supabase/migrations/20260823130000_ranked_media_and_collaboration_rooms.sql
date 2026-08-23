create table public.network_media_items (
  id uuid primary key default gen_random_uuid(),
  showcase_id uuid references public.editorial_product_showcases(id) on delete cascade,
  author_name text not null,
  author_handle text not null,
  author_role text not null,
  title text not null,
  caption text not null,
  media_kind text not null check (media_kind in ('build_reel','product_walkthrough','research_demo','founder_story','collaboration_call','webinar_replay')),
  poster_url text not null,
  playback_url text,
  duration_seconds integer check (duration_seconds is null or duration_seconds between 1 and 14400),
  audience_tags text[] not null default '{}',
  topic_tags text[] not null default '{}',
  call_to_action text,
  destination_url text,
  quality_score numeric(4,3) not null default 0.5 check (quality_score between 0 and 1),
  collaboration_score numeric(4,3) not null default 0.5 check (collaboration_score between 0 and 1),
  freshness_boost numeric(4,3) not null default 0.5 check (freshness_boost between 0 and 1),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  featured boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.collaboration_workspaces (
  id uuid primary key default gen_random_uuid(),
  showcase_id uuid not null references public.editorial_product_showcases(id) on delete cascade,
  slug text not null unique,
  name text not null,
  summary text not null,
  status text not null default 'open' check (status in ('open','active','paused','completed','archived')),
  owner_name text not null,
  collaboration_modes text[] not null default '{}',
  workstreams jsonb not null default '[]'::jsonb,
  operating_principles text[] not null default '{}',
  current_focus text,
  next_review_at timestamptz,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint collaboration_workspaces_workstreams_array check (jsonb_typeof(workstreams) = 'array')
);

create index network_media_rank_idx
  on public.network_media_items (featured desc, quality_score desc, collaboration_score desc, published_at desc)
  where status = 'published';
create index network_media_showcase_idx on public.network_media_items (showcase_id, published_at desc);
create index collaboration_workspaces_showcase_idx on public.collaboration_workspaces (showcase_id, status);

alter table public.network_media_items enable row level security;
alter table public.collaboration_workspaces enable row level security;

revoke all on public.network_media_items, public.collaboration_workspaces from public, anon, authenticated;
grant select on public.network_media_items, public.collaboration_workspaces to anon, authenticated;
grant select, insert, update, delete on public.network_media_items, public.collaboration_workspaces to service_role;

create policy "published network media is public"
  on public.network_media_items for select to anon, authenticated
  using (status = 'published');
create policy "public collaboration workspaces are visible"
  on public.collaboration_workspaces for select to anon, authenticated
  using (is_public and status in ('open','active','completed'));

create or replace function public.ranked_media_feed(
  audience_tags text[] default '{}',
  result_limit integer default 24
)
returns setof public.network_media_items
language sql
stable
security invoker
set search_path = ''
as $$
  select item.*
  from public.network_media_items item
  where item.status = 'published'
  order by (
    item.quality_score * 0.40
    + item.collaboration_score * 0.25
    + item.freshness_boost * 0.15
    + case when cardinality(audience_tags) > 0 and item.audience_tags && audience_tags then 0.20 else 0 end
  ) desc,
  item.featured desc,
  item.published_at desc
  limit least(greatest(result_limit, 1), 50);
$$;

revoke all on function public.ranked_media_feed(text[], integer) from public;
grant execute on function public.ranked_media_feed(text[], integer) to anon, authenticated, service_role;

insert into public.network_media_items (
  id, showcase_id, author_name, author_handle, author_role, title, caption, media_kind,
  poster_url, audience_tags, topic_tags, call_to_action, destination_url,
  quality_score, collaboration_score, freshness_boost, status, featured, published_at
) values
(
  '6d2d9554-c04e-43ef-a393-100000000001',
  '5d2d9554-c04e-43ef-a393-100000000001',
  'ResKonnect', '@reskonnect', 'Start To Up venture',
  'From student living to opportunity: the ResKonnect product journey',
  'A visual walkthrough of how ResKonnect connects accommodation discovery, application readiness and pathways to youth opportunity.',
  'product_walkthrough', '/brand/reskonnect-network-cover.png',
  array['developers','entrepreneurs','innovators','investors','institutions'],
  array['proptech','student living','product design','youth opportunity'],
  'Preview the product', 'https://www.reskonnect.org/',
  0.96, 0.91, 0.95, 'published', true, now()
),
(
  '6d2d9554-c04e-43ef-a393-100000000002',
  '5d2d9554-c04e-43ef-a393-100000000001',
  'ResKonnect', '@reskonnect', 'Open collaboration',
  'The services and partners ResKonnect wants to build with',
  'ResKonnect is opening focused workstreams for property operations, application support, WIL pathways, data, safety, wellness and student-facing financial services.',
  'collaboration_call', '/brand/reskonnect-network-cover.png',
  array['developers','entrepreneurs','innovators','investors','institutions'],
  array['collaboration','integrations','partnerships','open innovation'],
  'Enter the collaboration room', '/app/collaboration',
  0.93, 1.00, 0.96, 'published', true, now() - interval '5 minutes'
),
(
  '6d2d9554-c04e-43ef-a393-100000000003',
  '5d2d9554-c04e-43ef-a393-100000000001',
  'Start To Up', '@starttoup', 'Venture studio',
  'How to showcase a technical product on Start To Up Network',
  'Show the problem, demonstrate the product, publish the current build stage, name the skills you need and move the working relationship into a structured collaboration room.',
  'build_reel', '/brand/reskonnect-network-cover.png',
  array['developers','entrepreneurs','innovators'],
  array['developer workflow','build in public','product showcase'],
  'Share a project', '/app/create',
  0.94, 0.97, 0.94, 'published', false, now() - interval '10 minutes'
);

insert into public.collaboration_workspaces (
  id, showcase_id, slug, name, summary, status, owner_name, collaboration_modes,
  workstreams, operating_principles, current_focus, is_public
) values (
  '7d2d9554-c04e-43ef-a393-100000000001',
  '5d2d9554-c04e-43ef-a393-100000000001',
  'reskonnect-open-collaboration',
  'ResKonnect Product & Partnership Room',
  'A structured room for companies and specialists who can improve the ResKonnect living, digital tools and opportunity ecosystem.',
  'open', 'ResKonnect',
  array['Product integration','Service partnership','Technical contribution','Institutional programme','Investment conversation'],
  '[
    {"name":"Living & property network","lead":"ResKonnect","status":"Open","needs":["Accommodation providers","Property operations","Verification and safety"]},
    {"name":"Applications & digital tools","lead":"Product team","status":"Open","needs":["Education data","Application support","AI and platform integrations"]},
    {"name":"Opportunity pathways","lead":"Partnerships","status":"Open","needs":["WIL hosts","Youth programmes","Career and financial services"]}
  ]'::jsonb,
  array['Keep project work inside the room','Record decisions and contributions','Protect confidential details','Use clear scopes and ownership terms','Move external only when execution requires it'],
  'Identify delivery-ready partners for the three open workstreams.',
  true
);

notify pgrst, 'reload schema';
