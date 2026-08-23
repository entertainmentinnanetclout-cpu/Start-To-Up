create table public.editorial_product_showcases (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  product_name text not null,
  author_name text not null,
  author_handle text not null,
  published_by text not null,
  logo_url text,
  cover_url text,
  headline text not null,
  post_caption text not null,
  collaboration_brief text,
  collaboration_services text[] not null default '{}',
  product_tags text[] not null default '{}',
  preview_pages jsonb not null default '[]'::jsonb,
  website_url text,
  case_study_url text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  featured boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint editorial_product_showcases_preview_pages_array
    check (jsonb_typeof(preview_pages) = 'array')
);

create index editorial_product_showcases_public_feed_idx
  on public.editorial_product_showcases (featured desc, published_at desc)
  where status = 'published';

alter table public.editorial_product_showcases enable row level security;

revoke all on table public.editorial_product_showcases from public, anon, authenticated;
grant select on table public.editorial_product_showcases to anon, authenticated;
grant select, insert, update, delete on table public.editorial_product_showcases to service_role;

create policy "published editorial showcases are public"
  on public.editorial_product_showcases
  for select
  to anon, authenticated
  using (status = 'published');

insert into public.editorial_product_showcases (
  id,
  slug,
  product_name,
  author_name,
  author_handle,
  published_by,
  logo_url,
  cover_url,
  headline,
  post_caption,
  collaboration_brief,
  collaboration_services,
  product_tags,
  preview_pages,
  website_url,
  case_study_url,
  status,
  featured,
  published_at
) values (
  '5d2d9554-c04e-43ef-a393-100000000001',
  'reskonnect',
  'ResKonnect',
  'ResKonnect',
  '@reskonnect',
  'Start To Up Innovation Group',
  '/brand/reskonnect-product-icon.png',
  '/brand/reskonnect-network-cover.png',
  'Building the connected layer between where young people live and where their futures begin.',
  'We are building ResKonnect as a living, digital tools and youth-opportunity ecosystem. The product connects verified accommodation discovery, application readiness, property partnerships and pathways to WIL and opportunity. This public build update demonstrates how ventures can use Start To Up Network: show the product, explain the problem, preview the experience and invite the right collaborators.',
  'ResKonnect is open to credible companies and specialists whose services strengthen student living, digital access, applications, property operations, youth development or work-integrated learning. Collaboration is evaluated for relevance, trust, user value and delivery readiness.',
  array['Student accommodation providers', 'Property technology and operations', 'Application and education support', 'WIL and youth-opportunity partners', 'AI, data and digital-service providers', 'Student safety, wellness and financial services'],
  array['Living', 'AI & digital tools', 'Opportunity', 'PropTech', 'Youth development'],
  '[
    {"label":"Living","title":"Find a trusted place to stay","description":"Explore verified student accommodation, private rentals and partner properties.","accent":"blue"},
    {"label":"Applications","title":"Know what you qualify for","description":"Use application-readiness tools, APS guidance and connected support journeys.","accent":"gold"},
    {"label":"Opportunity","title":"Move from study to experience","description":"Discover WIL support, youth programmes and pathways into meaningful work.","accent":"mint"}
  ]'::jsonb,
  'https://www.reskonnect.org/',
  'https://www.reskonnect.org/about',
  'published',
  true,
  now()
);

