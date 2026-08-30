-- Website Studio access, template commercial controls and admin operations.
-- Preview remains available, but managed uploads/extraction/publishing are approval gated.

alter table public.profiles
  add column if not exists builder_access_status text not null default 'pending'
    check (builder_access_status in ('pending','approved','paused','rejected')),
  add column if not exists builder_access_reason text,
  add column if not exists builder_approved_by uuid references auth.users(id) on delete set null,
  add column if not exists builder_approved_at timestamptz,
  add column if not exists builder_paused_at timestamptz;

update public.profiles p
set builder_access_status = 'approved', builder_approved_at = coalesce(builder_approved_at,now())
where exists (
  select 1 from public.user_roles r
  where r.user_id=p.id and r.role in ('admin','super_admin')
);

create table if not exists public.website_studio_template_catalog (
  template_key text primary key,
  name text not null,
  family text not null,
  is_visible boolean not null default true,
  access_type text not null default 'paid' check (access_type in ('free','paid','private')),
  price_cents integer check (price_cents is null or price_cents >= 0),
  currency text not null default 'ZAR',
  approval_required boolean not null default true,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.website_studio_user_entitlements (
  user_id uuid not null references auth.users(id) on delete cascade,
  template_key text not null references public.website_studio_template_catalog(template_key) on delete cascade,
  status text not null default 'active' check (status in ('active','paused','revoked')),
  can_export boolean not null default true,
  can_publish boolean not null default true,
  granted_by uuid references auth.users(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id,template_key)
);

create table if not exists public.website_studio_access_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  request_type text not null default 'builder' check (request_type in ('builder','template','export','publish')),
  template_key text references public.website_studio_template_catalog(template_key) on delete set null,
  project_id uuid references public.website_studio_projects(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','approved','rejected','cancelled')),
  reason text,
  decision_notes text,
  decided_by uuid references auth.users(id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists website_studio_access_requests_user_idx on public.website_studio_access_requests(user_id,status,created_at desc);
create index if not exists website_studio_access_requests_status_idx on public.website_studio_access_requests(status,created_at desc);
create index if not exists website_studio_entitlements_user_idx on public.website_studio_user_entitlements(user_id,status);

insert into public.website_studio_template_catalog(template_key,name,family,is_visible,access_type,price_cents,currency,approval_required,description)
values
('newsroom-pro','Newsroom Pro','Institution',true,'paid',null,'ZAR',true,'Curated editorial/newsroom visual contract.'),
('edulaunch','EduLaunch','Education',true,'paid',null,'ZAR',true,'Curated education visual contract.'),
('medica-clinic','Medica Clinic','Healthcare',true,'paid',null,'ZAR',true,'Curated clinic visual contract.'),
('atelier-mode','Atelier Mode','Commerce',true,'paid',null,'ZAR',true,'Curated fashion visual contract.'),
('table-flame','Table & Flame','Restaurant',true,'paid',null,'ZAR',true,'Curated restaurant visual contract.'),
('habitat-property','Habitat Property','Property',true,'paid',null,'ZAR',true,'Curated property visual contract.'),
('studio-north','Studio North','Portfolio',true,'paid',null,'ZAR',true,'Curated agency visual contract.'),
('neon-foundry','Neon Foundry','Developer',true,'paid',null,'ZAR',true,'Curated developer visual contract.'),
('pulse-saas','Pulse SaaS','SaaS',true,'paid',null,'ZAR',true,'Curated SaaS visual contract.'),
('campus-living','Campus Living','Accommodation',true,'paid',null,'ZAR',true,'Curated student-living visual contract.'),
('rap-cut-producer','Rap Cut — Producer','Music Producer',true,'paid',null,'ZAR',true,'Producer website system for beats, videos, services, merch, events and bookings.'),
('rap-cut-artist','Rap Cut — Artist','Music Artist',true,'paid',null,'ZAR',true,'Artist website system for music, videos, performances, merch, fan capture and bookings.')
on conflict(template_key) do update set
  name=excluded.name,family=excluded.family,description=excluded.description,updated_at=now();

alter table public.website_studio_template_catalog enable row level security;
alter table public.website_studio_user_entitlements enable row level security;
alter table public.website_studio_access_requests enable row level security;

drop policy if exists template_catalog_visible_read on public.website_studio_template_catalog;
create policy template_catalog_visible_read on public.website_studio_template_catalog for select to authenticated using (is_visible or public.is_admin((select auth.uid())));

drop policy if exists template_catalog_admin_manage on public.website_studio_template_catalog;
create policy template_catalog_admin_manage on public.website_studio_template_catalog for all to authenticated
using (public.is_admin((select auth.uid()))) with check (public.is_admin((select auth.uid())));

drop policy if exists studio_entitlement_self_read on public.website_studio_user_entitlements;
create policy studio_entitlement_self_read on public.website_studio_user_entitlements for select to authenticated
using (user_id=(select auth.uid()) or public.is_admin((select auth.uid())));

drop policy if exists studio_entitlement_admin_manage on public.website_studio_user_entitlements;
create policy studio_entitlement_admin_manage on public.website_studio_user_entitlements for all to authenticated
using (public.is_admin((select auth.uid()))) with check (public.is_admin((select auth.uid())));

drop policy if exists studio_access_request_self_read on public.website_studio_access_requests;
create policy studio_access_request_self_read on public.website_studio_access_requests for select to authenticated
using (user_id=(select auth.uid()) or public.is_admin((select auth.uid())));

drop policy if exists studio_access_request_self_create on public.website_studio_access_requests;
create policy studio_access_request_self_create on public.website_studio_access_requests for insert to authenticated
with check (user_id=(select auth.uid()));

drop policy if exists studio_access_request_admin_manage on public.website_studio_access_requests;
create policy studio_access_request_admin_manage on public.website_studio_access_requests for update to authenticated
using (public.is_admin((select auth.uid()))) with check (public.is_admin((select auth.uid())));

grant select on public.website_studio_template_catalog to authenticated;
grant select on public.website_studio_user_entitlements to authenticated;
grant select,insert on public.website_studio_access_requests to authenticated;

create or replace function public.can_access_website_studio()
returns boolean language sql stable security definer set search_path='' as $$
  select auth.uid() is not null and (
    public.is_staff(auth.uid())
    or exists(select 1 from public.profiles p where p.id=auth.uid() and p.builder_access_status='approved')
  );
$$;
revoke all on function public.can_access_website_studio() from public,anon;
grant execute on function public.can_access_website_studio() to authenticated,service_role;

create or replace function public.can_extract_website_studio(target_template_key text, action_name text default 'export')
returns boolean language sql stable security definer set search_path='' as $$
  select auth.uid() is not null and (
    public.is_admin(auth.uid())
    or (
      exists(select 1 from public.profiles p where p.id=auth.uid() and p.builder_access_status='approved')
      and exists(
        select 1 from public.website_studio_template_catalog c
        where c.template_key=target_template_key and c.is_visible
          and (
            c.approval_required=false
            or exists(
              select 1 from public.website_studio_user_entitlements e
              where e.user_id=auth.uid() and e.template_key=c.template_key and e.status='active'
                and case when action_name='publish' then e.can_publish else e.can_export end
            )
          )
      )
    )
  );
$$;
revoke all on function public.can_extract_website_studio(text,text) from public,anon;
grant execute on function public.can_extract_website_studio(text,text) to authenticated,service_role;

create or replace function public.admin_set_studio_user_access(target_user uuid,new_status text,reason_text text default null)
returns void language plpgsql security definer set search_path='' as $$
begin
  if not public.is_admin(auth.uid()) then raise exception 'admin required'; end if;
  if new_status not in ('pending','approved','paused','rejected') then raise exception 'invalid status'; end if;
  update public.profiles set builder_access_status=new_status,builder_access_reason=reason_text,
    builder_approved_by=case when new_status='approved' then auth.uid() else builder_approved_by end,
    builder_approved_at=case when new_status='approved' then now() else builder_approved_at end,
    builder_paused_at=case when new_status='paused' then now() else null end,
    updated_at=now()
  where id=target_user;
end;$$;
revoke all on function public.admin_set_studio_user_access(uuid,text,text) from public,anon;
grant execute on function public.admin_set_studio_user_access(uuid,text,text) to authenticated;

create or replace function public.admin_set_studio_template(target_key text,visible_value boolean,access_value text,price_value integer,currency_value text,approval_value boolean)
returns void language plpgsql security definer set search_path='' as $$
begin
  if not public.is_admin(auth.uid()) then raise exception 'admin required'; end if;
  if access_value not in ('free','paid','private') then raise exception 'invalid access type'; end if;
  update public.website_studio_template_catalog set is_visible=visible_value,access_type=access_value,price_cents=price_value,
    currency=coalesce(nullif(currency_value,''),'ZAR'),approval_required=approval_value,updated_by=auth.uid(),updated_at=now()
  where template_key=target_key;
end;$$;
revoke all on function public.admin_set_studio_template(text,boolean,text,integer,text,boolean) from public,anon;
grant execute on function public.admin_set_studio_template(text,boolean,text,integer,text,boolean) to authenticated;

create or replace function public.admin_grant_studio_entitlement(target_user uuid,target_template text,export_value boolean default true,publish_value boolean default true,notes_value text default null)
returns void language plpgsql security definer set search_path='' as $$
begin
  if not public.is_admin(auth.uid()) then raise exception 'admin required'; end if;
  insert into public.website_studio_user_entitlements(user_id,template_key,status,can_export,can_publish,granted_by,notes)
  values(target_user,target_template,'active',export_value,publish_value,auth.uid(),notes_value)
  on conflict(user_id,template_key) do update set status='active',can_export=excluded.can_export,can_publish=excluded.can_publish,
    granted_by=auth.uid(),notes=excluded.notes,updated_at=now();
end;$$;
revoke all on function public.admin_grant_studio_entitlement(uuid,text,boolean,boolean,text) from public,anon;
grant execute on function public.admin_grant_studio_entitlement(uuid,text,boolean,boolean,text) to authenticated;

create or replace function public.admin_revoke_studio_entitlement(target_user uuid,target_template text)
returns void language plpgsql security definer set search_path='' as $$
begin
  if not public.is_admin(auth.uid()) then raise exception 'admin required'; end if;
  update public.website_studio_user_entitlements set status='revoked',updated_at=now() where user_id=target_user and template_key=target_template;
end;$$;
revoke all on function public.admin_revoke_studio_entitlement(uuid,text) from public,anon;
grant execute on function public.admin_revoke_studio_entitlement(uuid,text) to authenticated;

notify pgrst,'reload schema';
