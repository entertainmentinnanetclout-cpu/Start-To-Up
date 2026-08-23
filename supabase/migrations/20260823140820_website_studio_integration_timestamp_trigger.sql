create or replace function public.touch_website_studio_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_website_studio_integrations_updated_at on public.website_studio_integrations;
create trigger trg_website_studio_integrations_updated_at
before update on public.website_studio_integrations
for each row execute function public.touch_website_studio_updated_at();

drop trigger if exists trg_website_studio_deployments_updated_at on public.website_studio_deployments;
create trigger trg_website_studio_deployments_updated_at
before update on public.website_studio_deployments
for each row execute function public.touch_website_studio_updated_at();
