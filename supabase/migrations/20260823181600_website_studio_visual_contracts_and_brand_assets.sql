alter table public.website_studio_templates
  add column if not exists visual_contract_version text,
  add column if not exists reference_image_filename text,
  add column if not exists visual_contract jsonb not null default '{}'::jsonb;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'website-studio-assets',
  'website-studio-assets',
  true,
  15728640,
  array['image/jpeg','image/png','image/webp','image/svg+xml','application/pdf']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public rendering is intentional: these assets are selected for public websites.
drop policy if exists website_studio_assets_public_read on storage.objects;
create policy website_studio_assets_public_read
on storage.objects for select
using (bucket_id = 'website-studio-assets');

drop policy if exists website_studio_assets_owner_insert on storage.objects;
create policy website_studio_assets_owner_insert
on storage.objects for insert to authenticated
with check (
  bucket_id = 'website-studio-assets'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists website_studio_assets_owner_update on storage.objects;
create policy website_studio_assets_owner_update
on storage.objects for update to authenticated
using (
  bucket_id = 'website-studio-assets'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'website-studio-assets'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists website_studio_assets_owner_delete on storage.objects;
create policy website_studio_assets_owner_delete
on storage.objects for delete to authenticated
using (
  bucket_id = 'website-studio-assets'
  and (storage.foldername(name))[1] = auth.uid()::text
);

update public.website_studio_templates
set visual_contract_version = '2026-08-23-v1',
    reference_image_filename = case key
      when 'newsroom-pro' then 'Codex Image Aug 23, 2026, 05_29_30 PM.png'
      when 'edulaunch' then 'Codex Image Aug 23, 2026, 05_29_19 PM.png'
      when 'medica-clinic' then 'Codex Image Aug 23, 2026, 05_29_15 PM.png'
      when 'atelier-mode' then 'Codex Image Aug 23, 2026, 05_29_08 PM.png'
      when 'table-flame' then 'Codex Image Aug 23, 2026, 05_29_02 PM.png'
      when 'habitat-property' then 'Codex Image Aug 23, 2026, 05_28_43 PM.png'
      when 'studio-north' then 'Codex Image Aug 23, 2026, 05_28_38 PM.png'
      when 'neon-foundry' then 'Codex Image Aug 23, 2026, 05_28_32 PM.png'
      when 'pulse-saas' then 'Codex Image Aug 23, 2026, 05_28_22 PM.png'
      when 'campus-living' then 'Codex Image Aug 23, 2026, 05_27_19 PM.png'
      else reference_image_filename
    end,
    visual_contract = jsonb_build_object(
      'source', 'user-supplied-reference-image',
      'strictMatch', true,
      'noInventedPreview', true,
      'replaceableMedia', true,
      'brandingUploadRequired', true,
      'contractDate', '2026-08-23'
    ),
    updated_at = now()
where key in (
  'newsroom-pro','edulaunch','medica-clinic','atelier-mode','table-flame',
  'habitat-property','studio-north','neon-foundry','pulse-saas','campus-living'
);