-- Start To Up — Startup OS Phase 4: Sales, CRM & Revenue Operations.
-- Single-source rule: accounts/contacts are linked across leads, opportunities,
-- proposals, quotes, invoices, referrals, affiliates, reputation and support.

alter table public.website_studio_projects
  add column if not exists organization_id uuid references public.organizations(id) on delete set null;
create index if not exists website_studio_projects_org_idx on public.website_studio_projects(organization_id, updated_at desc);

create table if not exists public.revenue_accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 220),
  legal_name text,
  industry text,
  email text,
  phone text,
  website text,
  address text,
  city text,
  province text,
  country text not null default 'South Africa',
  lifecycle text not null default 'prospect' check (lifecycle in ('prospect','lead','customer','partner','inactive')),
  source_type text not null default 'manual' check (source_type in ('manual','company_intelligence','website_form','lead_magnet','referral','affiliate','import')),
  source_intelligence_id uuid references public.company_intelligence_records(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  owner_id uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists revenue_accounts_intelligence_unique
  on public.revenue_accounts(organization_id, source_intelligence_id)
  where source_intelligence_id is not null;
create index if not exists revenue_accounts_org_idx on public.revenue_accounts(organization_id,lifecycle,updated_at desc);

create table if not exists public.revenue_contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  account_id uuid references public.revenue_accounts(id) on delete set null,
  full_name text not null check (char_length(full_name) between 2 and 220),
  job_title text,
  email text,
  phone text,
  preferred_channel text not null default 'email' check (preferred_channel in ('email','phone','whatsapp','other')),
  consent_status text not null default 'unknown' check (consent_status in ('unknown','consented','legitimate_interest','opted_out')),
  source_type text not null default 'manual',
  source_ref_id uuid,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists revenue_contacts_org_idx on public.revenue_contacts(organization_id,updated_at desc);
create index if not exists revenue_contacts_email_idx on public.revenue_contacts(organization_id,lower(email)) where email is not null;

create table if not exists public.revenue_pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  stage_key text not null,
  position integer not null default 0,
  probability integer not null default 10 check (probability between 0 and 100),
  is_closed boolean not null default false,
  closed_outcome text check (closed_outcome is null or closed_outcome in ('won','lost')),
  created_at timestamptz not null default now(),
  unique (organization_id,stage_key)
);

create table if not exists public.revenue_leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  account_id uuid references public.revenue_accounts(id) on delete set null,
  contact_id uuid references public.revenue_contacts(id) on delete set null,
  title text not null,
  status text not null default 'new' check (status in ('new','working','qualified','unqualified','converted','archived')),
  source_type text not null default 'manual' check (source_type in ('manual','company_intelligence','website_form','lead_magnet','referral','affiliate','import')),
  source_ref_id uuid,
  lead_score integer not null default 0 check (lead_score between 0 and 100),
  estimated_value numeric not null default 0 check (estimated_value >= 0),
  currency text not null default 'ZAR',
  assigned_to uuid references auth.users(id) on delete set null,
  next_action text,
  next_action_at timestamptz,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  converted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists revenue_leads_source_unique on public.revenue_leads(organization_id,source_type,source_ref_id) where source_ref_id is not null;
create index if not exists revenue_leads_org_status_idx on public.revenue_leads(organization_id,status,updated_at desc);

create table if not exists public.revenue_opportunities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  account_id uuid references public.revenue_accounts(id) on delete set null,
  contact_id uuid references public.revenue_contacts(id) on delete set null,
  lead_id uuid references public.revenue_leads(id) on delete set null,
  stage_id uuid references public.revenue_pipeline_stages(id) on delete set null,
  name text not null,
  amount numeric not null default 0 check (amount >= 0),
  currency text not null default 'ZAR',
  probability integer not null default 10 check (probability between 0 and 100),
  expected_close_date date,
  status text not null default 'open' check (status in ('open','won','lost','paused')),
  loss_reason text,
  owner_id uuid references auth.users(id) on delete set null,
  source text not null default 'manual',
  metadata jsonb not null default '{}'::jsonb,
  won_at timestamptz,
  lost_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists revenue_opportunities_pipeline_idx on public.revenue_opportunities(organization_id,status,expected_close_date);

create table if not exists public.revenue_activities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  account_id uuid references public.revenue_accounts(id) on delete cascade,
  contact_id uuid references public.revenue_contacts(id) on delete cascade,
  lead_id uuid references public.revenue_leads(id) on delete cascade,
  opportunity_id uuid references public.revenue_opportunities(id) on delete cascade,
  activity_type text not null check (activity_type in ('note','call','email','whatsapp','meeting','task','status_change','proposal','quote','invoice','support')),
  subject text not null,
  body text,
  occurred_at timestamptz not null default now(),
  due_at timestamptz,
  completed_at timestamptz,
  actor_id uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists revenue_activities_org_idx on public.revenue_activities(organization_id,occurred_at desc);

create table if not exists public.revenue_proposals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  opportunity_id uuid references public.revenue_opportunities(id) on delete set null,
  account_id uuid references public.revenue_accounts(id) on delete set null,
  contact_id uuid references public.revenue_contacts(id) on delete set null,
  title text not null,
  status text not null default 'draft' check (status in ('draft','sent','viewed','accepted','declined','expired')),
  summary text,
  scope jsonb not null default '[]'::jsonb,
  pricing jsonb not null default '[]'::jsonb,
  terms text,
  total numeric not null default 0 check (total >= 0),
  currency text not null default 'ZAR',
  valid_until date,
  accepted_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenue_quotes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  opportunity_id uuid references public.revenue_opportunities(id) on delete set null,
  proposal_id uuid references public.revenue_proposals(id) on delete set null,
  account_id uuid references public.revenue_accounts(id) on delete set null,
  contact_id uuid references public.revenue_contacts(id) on delete set null,
  quote_number text not null,
  status text not null default 'draft' check (status in ('draft','sent','accepted','declined','expired','invoiced')),
  currency text not null default 'ZAR',
  subtotal numeric not null default 0,
  tax_total numeric not null default 0,
  discount_total numeric not null default 0,
  total numeric not null default 0,
  notes text,
  terms text,
  valid_until date,
  accepted_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(organization_id,quote_number)
);

create table if not exists public.revenue_quote_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  quote_id uuid not null references public.revenue_quotes(id) on delete cascade,
  position integer not null default 0,
  description text not null,
  quantity numeric not null default 1 check (quantity > 0),
  unit_price numeric not null default 0 check (unit_price >= 0),
  tax_rate numeric not null default 0 check (tax_rate between 0 and 100),
  discount numeric not null default 0 check (discount >= 0),
  line_total numeric not null default 0,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.revenue_invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  source_quote_id uuid references public.revenue_quotes(id) on delete set null,
  opportunity_id uuid references public.revenue_opportunities(id) on delete set null,
  account_id uuid references public.revenue_accounts(id) on delete set null,
  contact_id uuid references public.revenue_contacts(id) on delete set null,
  invoice_number text not null,
  status text not null default 'draft' check (status in ('draft','issued','part_paid','paid','overdue','void')),
  currency text not null default 'ZAR',
  subtotal numeric not null default 0,
  tax_total numeric not null default 0,
  discount_total numeric not null default 0,
  total numeric not null default 0,
  amount_paid numeric not null default 0,
  amount_due numeric not null default 0,
  issue_date date not null default current_date,
  due_date date,
  notes text,
  terms text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(organization_id,invoice_number)
);
create unique index if not exists revenue_invoice_source_quote_unique on public.revenue_invoices(organization_id,source_quote_id) where source_quote_id is not null;

create table if not exists public.revenue_invoice_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  invoice_id uuid not null references public.revenue_invoices(id) on delete cascade,
  source_quote_item_id uuid references public.revenue_quote_items(id) on delete set null,
  position integer not null default 0,
  description text not null,
  quantity numeric not null default 1 check (quantity > 0),
  unit_price numeric not null default 0 check (unit_price >= 0),
  tax_rate numeric not null default 0 check (tax_rate between 0 and 100),
  discount numeric not null default 0 check (discount >= 0),
  line_total numeric not null default 0,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.revenue_payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  invoice_id uuid not null references public.revenue_invoices(id) on delete cascade,
  amount numeric not null check (amount > 0),
  currency text not null default 'ZAR',
  payment_method text not null default 'manual',
  provider text,
  provider_reference text,
  status text not null default 'pending' check (status in ('pending','confirmed','failed','refunded','cancelled')),
  paid_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  recorded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.revenue_lead_magnets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  slug text not null,
  status text not null default 'draft' check (status in ('draft','active','paused','archived')),
  public_token uuid not null default gen_random_uuid() unique,
  headline text not null,
  description text,
  asset_url text,
  form_config jsonb not null default '{}'::jsonb,
  thank_you_message text not null default 'Thank you. Check your inbox for the next step.',
  submissions_count integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(organization_id,slug)
);

create table if not exists public.revenue_referral_programs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  status text not null default 'draft' check (status in ('draft','active','paused','archived')),
  reward_type text not null default 'fixed' check (reward_type in ('fixed','percent','credit','custom')),
  reward_value numeric not null default 0 check (reward_value >= 0),
  currency text not null default 'ZAR',
  qualification_event text not null default 'won_deal',
  terms text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenue_referrals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  program_id uuid not null references public.revenue_referral_programs(id) on delete cascade,
  referrer_contact_id uuid references public.revenue_contacts(id) on delete set null,
  referred_lead_id uuid references public.revenue_leads(id) on delete set null,
  referral_code text not null,
  status text not null default 'referred' check (status in ('referred','qualified','converted','reward_pending','rewarded','rejected')),
  reward_amount numeric not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(organization_id,referral_code)
);

create table if not exists public.revenue_affiliate_programs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  status text not null default 'draft' check (status in ('draft','active','paused','archived')),
  commission_type text not null default 'percent' check (commission_type in ('fixed','percent')),
  commission_value numeric not null default 0 check (commission_value >= 0),
  currency text not null default 'ZAR',
  cookie_days integer not null default 30 check (cookie_days between 1 and 365),
  terms text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenue_affiliates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  program_id uuid not null references public.revenue_affiliate_programs(id) on delete cascade,
  contact_id uuid references public.revenue_contacts(id) on delete set null,
  code text not null,
  status text not null default 'active' check (status in ('pending','active','paused','terminated')),
  clicks integer not null default 0,
  conversions integer not null default 0,
  commission_earned numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(organization_id,code)
);

create table if not exists public.revenue_affiliate_conversions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  affiliate_id uuid not null references public.revenue_affiliates(id) on delete cascade,
  opportunity_id uuid references public.revenue_opportunities(id) on delete set null,
  invoice_id uuid references public.revenue_invoices(id) on delete set null,
  conversion_value numeric not null default 0,
  commission_amount numeric not null default 0,
  status text not null default 'pending' check (status in ('pending','approved','paid','reversed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenue_reputation_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  account_id uuid references public.revenue_accounts(id) on delete set null,
  provider text not null,
  external_review_id text,
  reviewer_label text,
  rating numeric check (rating is null or (rating >= 0 and rating <= 5)),
  review_text text,
  sentiment text check (sentiment is null or sentiment in ('positive','neutral','negative','unclassified')),
  response_text text,
  response_status text not null default 'unanswered' check (response_status in ('unanswered','drafted','responded','not_required')),
  observed_at timestamptz,
  evidence_url text,
  confidence text not null default 'observed' check (confidence in ('owner_entered','observed','estimated','verified')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenue_support_tickets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  account_id uuid references public.revenue_accounts(id) on delete set null,
  contact_id uuid references public.revenue_contacts(id) on delete set null,
  ticket_number text not null,
  subject text not null,
  status text not null default 'open' check (status in ('open','pending','in_progress','resolved','closed')),
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  channel text not null default 'manual' check (channel in ('manual','email','website','whatsapp','phone','other')),
  assigned_to uuid references auth.users(id) on delete set null,
  first_response_at timestamptz,
  resolved_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(organization_id,ticket_number)
);

create table if not exists public.revenue_support_messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  ticket_id uuid not null references public.revenue_support_tickets(id) on delete cascade,
  sender_type text not null check (sender_type in ('customer','team','system')),
  sender_id uuid references auth.users(id) on delete set null,
  body text not null,
  is_private_note boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists revenue_quotes_org_idx on public.revenue_quotes(organization_id,status,updated_at desc);
create index if not exists revenue_invoices_org_idx on public.revenue_invoices(organization_id,status,due_date);
create index if not exists revenue_support_org_idx on public.revenue_support_tickets(organization_id,status,priority,updated_at desc);
create index if not exists revenue_reputation_org_idx on public.revenue_reputation_records(organization_id,updated_at desc);

-- Seed standard pipeline stages for a workspace without duplicating them.
create or replace function public.ensure_revenue_pipeline(org_id uuid)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not private.workspace_has_permission(org_id,auth.uid(),'company.manage') then raise exception 'permission denied'; end if;
  insert into public.revenue_pipeline_stages(organization_id,name,stage_key,position,probability,is_closed,closed_outcome) values
    (org_id,'New lead','new',0,10,false,null),
    (org_id,'Qualified','qualified',1,25,false,null),
    (org_id,'Meeting / Discovery','discovery',2,40,false,null),
    (org_id,'Proposal','proposal',3,60,false,null),
    (org_id,'Negotiation','negotiation',4,80,false,null),
    (org_id,'Won','won',5,100,true,'won'),
    (org_id,'Lost','lost',6,0,true,'lost')
  on conflict (organization_id,stage_key) do nothing;
end; $$;
revoke all on function public.ensure_revenue_pipeline(uuid) from public,anon;
grant execute on function public.ensure_revenue_pipeline(uuid) to authenticated;

-- Company Intelligence -> CRM without duplicate account/lead records.
create or replace function public.revenue_import_company_intelligence(org_id uuid, intelligence_id uuid)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare r record; account_uuid uuid; lead_uuid uuid; actor uuid := auth.uid();
begin
  if not private.workspace_has_permission(org_id,actor,'company.manage') then raise exception 'permission denied'; end if;
  select * into r from public.company_intelligence_records where id=intelligence_id and organization_id=org_id;
  if r.id is null then raise exception 'company intelligence record not found'; end if;

  select id into account_uuid from public.revenue_accounts where organization_id=org_id and source_intelligence_id=intelligence_id limit 1;
  if account_uuid is null then
    insert into public.revenue_accounts(organization_id,name,industry,phone,website,address,lifecycle,source_type,source_intelligence_id,metadata,owner_id,created_by)
    values(org_id,r.company_name,r.category,r.phone,r.website,r.address,'lead','company_intelligence',r.id,jsonb_build_object('opportunityScore',r.opportunity_score,'websiteStatus',r.website_status,'evidenceConfidence',r.evidence_confidence),actor,actor)
    returning id into account_uuid;
  end if;

  select id into lead_uuid from public.revenue_leads where organization_id=org_id and source_type='company_intelligence' and source_ref_id=intelligence_id limit 1;
  if lead_uuid is null then
    insert into public.revenue_leads(organization_id,account_id,title,status,source_type,source_ref_id,lead_score,estimated_value,currency,assigned_to,notes,metadata,created_by)
    values(org_id,account_uuid,r.company_name || ' digital growth opportunity','new','company_intelligence',r.id,coalesce(r.opportunity_score,0),0,'ZAR',actor,'Imported from Company Intelligence.',jsonb_build_object('websiteStatus',r.website_status,'seoScore',r.seo_score,'demandScore',r.demand_score),actor)
    returning id into lead_uuid;
  end if;
  insert into public.revenue_activities(organization_id,account_id,lead_id,activity_type,subject,body,actor_id)
  values(org_id,account_uuid,lead_uuid,'status_change','Added to CRM','Imported from Company Intelligence without duplicating the source company.',actor);
  return lead_uuid;
end; $$;
revoke all on function public.revenue_import_company_intelligence(uuid,uuid) from public,anon;
grant execute on function public.revenue_import_company_intelligence(uuid,uuid) to authenticated;

-- Website Studio form -> CRM. A Studio project must explicitly belong to the workspace.
create or replace function public.revenue_import_website_submission(org_id uuid, submission_id uuid)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare s record; contact_uuid uuid; lead_uuid uuid; actor uuid := auth.uid();
begin
  if not private.workspace_has_permission(org_id,actor,'company.manage') then raise exception 'permission denied'; end if;
  select f.*,p.organization_id as project_org into s
  from public.website_studio_form_submissions f join public.website_studio_projects p on p.id=f.project_id
  where f.id=submission_id and p.organization_id=org_id;
  if s.id is null then raise exception 'website submission not found for workspace'; end if;

  if s.email is not null then
    select id into contact_uuid from public.revenue_contacts where organization_id=org_id and lower(email)=lower(s.email) limit 1;
  end if;
  if contact_uuid is null then
    insert into public.revenue_contacts(organization_id,full_name,email,phone,source_type,source_ref_id,created_by)
    values(org_id,coalesce(nullif(s.full_name,''),'Website enquiry'),s.email,s.phone,'website_form',s.id,actor)
    returning id into contact_uuid;
  end if;

  select id into lead_uuid from public.revenue_leads where organization_id=org_id and source_type='website_form' and source_ref_id=s.id limit 1;
  if lead_uuid is null then
    insert into public.revenue_leads(organization_id,contact_id,title,status,source_type,source_ref_id,lead_score,estimated_value,currency,assigned_to,notes,metadata,created_by)
    values(org_id,contact_uuid,'Website enquiry from ' || coalesce(nullif(s.full_name,''),coalesce(s.email,'visitor')),'new','website_form',s.id,25,0,'ZAR',actor,s.message,jsonb_build_object('sourceUrl',s.source_url,'projectId',s.project_id),actor)
    returning id into lead_uuid;
  end if;
  return lead_uuid;
end; $$;
revoke all on function public.revenue_import_website_submission(uuid,uuid) from public,anon;
grant execute on function public.revenue_import_website_submission(uuid,uuid) to authenticated;

create or replace function public.revenue_convert_lead_to_opportunity(lead_uuid uuid, opportunity_amount numeric default 0, close_date date default null)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare l record; stage_uuid uuid; opp_uuid uuid; actor uuid := auth.uid();
begin
  select * into l from public.revenue_leads where id=lead_uuid;
  if l.id is null or not private.workspace_has_permission(l.organization_id,actor,'company.manage') then raise exception 'permission denied'; end if;
  perform public.ensure_revenue_pipeline(l.organization_id);
  select id into stage_uuid from public.revenue_pipeline_stages where organization_id=l.organization_id and stage_key='qualified' limit 1;
  select id into opp_uuid from public.revenue_opportunities where organization_id=l.organization_id and lead_id=l.id and status='open' limit 1;
  if opp_uuid is null then
    insert into public.revenue_opportunities(organization_id,account_id,contact_id,lead_id,stage_id,name,amount,currency,probability,expected_close_date,status,owner_id,source,created_by)
    values(l.organization_id,l.account_id,l.contact_id,l.id,stage_uuid,l.title,greatest(coalesce(opportunity_amount,l.estimated_value,0),0),l.currency,25,close_date,'open',coalesce(l.assigned_to,actor),l.source_type,actor)
    returning id into opp_uuid;
  end if;
  update public.revenue_leads set status='converted',converted_at=now(),updated_at=now() where id=l.id;
  return opp_uuid;
end; $$;
revoke all on function public.revenue_convert_lead_to_opportunity(uuid,numeric,date) from public,anon;
grant execute on function public.revenue_convert_lead_to_opportunity(uuid,numeric,date) to authenticated;

-- Quote -> invoice copies a linked immutable commercial snapshot rather than duplicating customer records.
create or replace function public.revenue_quote_to_invoice(quote_uuid uuid, invoice_due_date date default null)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare q record; invoice_uuid uuid; actor uuid := auth.uid(); invoice_no text;
begin
  select * into q from public.revenue_quotes where id=quote_uuid;
  if q.id is null or not private.workspace_has_permission(q.organization_id,actor,'company.manage') then raise exception 'permission denied'; end if;
  select id into invoice_uuid from public.revenue_invoices where organization_id=q.organization_id and source_quote_id=q.id limit 1;
  if invoice_uuid is not null then return invoice_uuid; end if;
  invoice_no := 'INV-' || to_char(clock_timestamp(),'YYYYMMDD-HH24MISS') || '-' || upper(substr(replace(q.id::text,'-',''),1,5));
  insert into public.revenue_invoices(organization_id,source_quote_id,opportunity_id,account_id,contact_id,invoice_number,status,currency,subtotal,tax_total,discount_total,total,amount_paid,amount_due,issue_date,due_date,notes,terms,created_by)
  values(q.organization_id,q.id,q.opportunity_id,q.account_id,q.contact_id,invoice_no,'issued',q.currency,q.subtotal,q.tax_total,q.discount_total,q.total,0,q.total,current_date,invoice_due_date,q.notes,q.terms,actor)
  returning id into invoice_uuid;
  insert into public.revenue_invoice_items(organization_id,invoice_id,source_quote_item_id,position,description,quantity,unit_price,tax_rate,discount,line_total,metadata)
  select organization_id,invoice_uuid,id,position,description,quantity,unit_price,tax_rate,discount,line_total,metadata
  from public.revenue_quote_items where quote_id=q.id order by position;
  update public.revenue_quotes set status='invoiced',updated_at=now() where id=q.id;
  return invoice_uuid;
end; $$;
revoke all on function public.revenue_quote_to_invoice(uuid,date) from public,anon;
grant execute on function public.revenue_quote_to_invoice(uuid,date) to authenticated;

create or replace function public.revenue_forecast(org_id uuid)
returns table(open_pipeline numeric, weighted_forecast numeric, won_value numeric, overdue_value numeric)
language sql stable security definer set search_path = '' as $$
  select
    coalesce((select sum(amount) from public.revenue_opportunities where organization_id=org_id and status='open'),0),
    coalesce((select sum(amount * probability / 100.0) from public.revenue_opportunities where organization_id=org_id and status='open'),0),
    coalesce((select sum(amount) from public.revenue_opportunities where organization_id=org_id and status='won'),0),
    coalesce((select sum(amount_due) from public.revenue_invoices where organization_id=org_id and status in ('issued','part_paid','overdue') and due_date < current_date),0)
  where private.startup_workspace_member(org_id,auth.uid());
$$;
revoke all on function public.revenue_forecast(uuid) from public,anon;
grant execute on function public.revenue_forecast(uuid) to authenticated;

-- RLS. Every revenue object is workspace scoped and uses Phase 0 permissions.
do $$
declare t text;
begin
  foreach t in array array[
    'revenue_accounts','revenue_contacts','revenue_pipeline_stages','revenue_leads','revenue_opportunities','revenue_activities',
    'revenue_proposals','revenue_quotes','revenue_quote_items','revenue_invoices','revenue_invoice_items','revenue_payments',
    'revenue_lead_magnets','revenue_referral_programs','revenue_referrals','revenue_affiliate_programs','revenue_affiliates',
    'revenue_affiliate_conversions','revenue_reputation_records','revenue_support_tickets','revenue_support_messages'
  ] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('drop policy if exists revenue_member_read on public.%I',t);
    execute format('create policy revenue_member_read on public.%I for select to authenticated using (private.startup_workspace_member(organization_id,(select auth.uid())))',t);
    execute format('drop policy if exists revenue_member_insert on public.%I',t);
    execute format('create policy revenue_member_insert on public.%I for insert to authenticated with check (private.workspace_has_permission(organization_id,(select auth.uid()),''company.manage''))',t);
    execute format('drop policy if exists revenue_member_update on public.%I',t);
    execute format('create policy revenue_member_update on public.%I for update to authenticated using (private.workspace_has_permission(organization_id,(select auth.uid()),''company.manage'')) with check (private.workspace_has_permission(organization_id,(select auth.uid()),''company.manage''))',t);
    execute format('drop policy if exists revenue_member_delete on public.%I',t);
    execute format('create policy revenue_member_delete on public.%I for delete to authenticated using (private.workspace_has_permission(organization_id,(select auth.uid()),''company.manage''))',t);
  end loop;
end $$;

-- Touch updated_at on mutable Phase 4 records using the existing shared trigger function.
do $$
declare t text;
begin
  foreach t in array array['revenue_accounts','revenue_contacts','revenue_leads','revenue_opportunities','revenue_proposals','revenue_quotes','revenue_invoices','revenue_lead_magnets','revenue_referral_programs','revenue_referrals','revenue_affiliate_programs','revenue_affiliates','revenue_affiliate_conversions','revenue_reputation_records','revenue_support_tickets'] loop
    execute format('drop trigger if exists %I_touch_updated_at on public.%I',t,t);
    execute format('create trigger %I_touch_updated_at before update on public.%I for each row execute function public.tg_set_updated_at()',t,t);
  end loop;
end $$;
