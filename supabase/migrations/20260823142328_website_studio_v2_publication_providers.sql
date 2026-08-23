alter table public.website_studio_publication_jobs
  drop constraint if exists website_studio_publication_jobs_provider_check;

alter table public.website_studio_publication_jobs
  add constraint website_studio_publication_jobs_provider_check
  check (provider = any (array['github'::text, 'vercel'::text, 'lovable'::text, 'managed_export'::text]));
