-- Start To Up — Startup OS Phase 8: Funding & Investor Readiness.
-- Investor readiness is derived from actual workspace evidence, not a self-declared questionnaire.

create table if not exists public.funding_opportunities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  source_scope text not null default 'workspace' check (source_scope in ('workspace','platform')),
  title text not null,
  provider text not null,
  funder_type text not null default 'grant' check (funder_type in ('grant','accelerator','angel','vc','corporate','government','bank','competition','crowdfunding','other')),
  instrument text not null default 'grant' check (instrument in ('grant','equity','safe','convertible','debt','revenue_share','prize','support','other')),
  stages text[] not null default '{}',
  industries text[] not null default '{}',
  locations text[] not null default '{}',
  min_amount numeric check (min_amount is null or min_amount >= 0),
  max_amount numeric check (max_amount is null or max_amount >= 0),
  currency text not null default 'ZAR',
  deadline timestamptz,
  rolling boolean not null default false,
  description text,
  eligibility text,
  source_url text not null,
  evidence_confidence text not null default 'owner_entered' check (evidence_confidence in ('owner_entered','observed','verified')),
  status text not null default 'active' check (status in ('draft','active','closed','archived')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((source_scope='workspace' and organization_id is not null) or (source_scope='platform' and organization_id is null))
);

create table if not exists public.funding_saved_opportunities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  opportunity_id uuid not null references public.funding_opportunities(id) on delete cascade,
  status text not null default 'saved' check (status in ('saved','reviewing','applying','submitted','interview','awarded','unsuccessful','withdrawn')),
  match_score integer not null default 0 check (match_score between 0 and 100),
  notes text,
  owner_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(organization_id,opportunity_id)
);

create table if not exists public.funding_investors (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  investor_type text not null default 'angel' check (investor_type in ('angel','vc','corporate','family_office','accelerator','government','bank','other')),
  website text,
  location text,
  thesis text,
  stages text[] not null default '{}',
  industries text[] not null default '{}',
  typical_min numeric check (typical_min is null or typical_min >= 0),
  typical_max numeric check (typical_max is null or typical_max >= 0),
  currency text not null default 'ZAR',
  status text not null default 'research' check (status in ('research','target','contacted','meeting','diligence','term_sheet','committed','passed','not_fit')),
  source_url text,
  notes text,
  owner_id uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.funding_investor_contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  investor_id uuid not null references public.funding_investors(id) on delete cascade,
  full_name text not null,
  role_title text,
  email text,
  phone text,
  linkedin_url text,
  preferred_channel text not null default 'email' check (preferred_channel in ('email','phone','linkedin','other')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.funding_investor_interactions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  investor_id uuid not null references public.funding_investors(id) on delete cascade,
  contact_id uuid references public.funding_investor_contacts(id) on delete set null,
  interaction_type text not null check (interaction_type in ('note','email','call','meeting','intro','pitch','diligence','term_sheet','follow_up')),
  subject text not null,
  notes text,
  occurred_at timestamptz not null default now(),
  next_action text,
  next_action_at timestamptz,
  outcome text,
  actor_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.funding_pitch_decks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  audience text not null default 'investor',
  status text not null default 'draft' check (status in ('draft','review','ready','archived')),
  version integer not null default 1,
  theme jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.funding_pitch_slides (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  deck_id uuid not null references public.funding_pitch_decks(id) on delete cascade,
  position integer not null default 0,
  slide_type text not null default 'custom' check (slide_type in ('cover','problem','solution','market','product','business_model','go_to_market','traction','competition','financials','team','ask','closing','custom')),
  title text not null,
  body text,
  metrics jsonb not null default '{}'::jsonb,
  media jsonb not null default '{}'::jsonb,
  notes text,
  updated_at timestamptz not null default now()
);

create table if not exists public.funding_readiness_snapshots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  overall_score integer not null check (overall_score between 0 and 100),
  governance_score integer not null check (governance_score between 0 and 100),
  financial_score integer not null check (financial_score between 0 and 100),
  traction_score integer not null check (traction_score between 0 and 100),
  materials_score integer not null check (materials_score between 0 and 100),
  data_room_score integer not null check (data_room_score between 0 and 100),
  risk_penalty integer not null default 0 check (risk_penalty between 0 and 100),
  evidence jsonb not null default '{}'::jsonb,
  gaps jsonb not null default '[]'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.funding_data_rooms (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  status text not null default 'draft' check (status in ('draft','ready','open','closed','archived')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.funding_data_room_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  room_id uuid not null references public.funding_data_rooms(id) on delete cascade,
  legal_document_id uuid references public.legal_documents(id) on delete set null,
  category text not null default 'other' check (category in ('corporate','financial','tax','legal','commercial','product','market','team','ip','funding','other')),
  title text not null,
  position integer not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.funding_data_room_shares (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  room_id uuid not null references public.funding_data_rooms(id) on delete cascade,
  investor_id uuid references public.funding_investors(id) on delete set null,
  name text not null,
  public_token uuid not null default gen_random_uuid() unique,
  expires_at timestamptz not null,
  max_views integer check (max_views is null or max_views > 0),
  view_count integer not null default 0,
  allow_download boolean not null default false,
  revoked_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.funding_data_room_access_log (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  share_id uuid not null references public.funding_data_room_shares(id) on delete cascade,
  item_id uuid references public.funding_data_room_items(id) on delete set null,
  event_type text not null check (event_type in ('opened','item_viewed','downloaded','denied','expired','revoked')),
  ip_hash text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.funding_rounds (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  round_type text not null default 'seed' check (round_type in ('pre_seed','seed','series_a','series_b','series_c','bridge','grant','debt','other')),
  instrument text not null default 'equity' check (instrument in ('equity','safe','convertible','debt','grant','other')),
  target_raise numeric not null default 0 check (target_raise >= 0),
  currency text not null default 'ZAR',
  target_close_date date,
  status text not null default 'planning' check (status in ('planning','raising','soft_circled','closing','closed','cancelled')),
  use_of_funds jsonb not null default '[]'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.funding_round_scenarios (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  round_id uuid references public.funding_rounds(id) on delete cascade,
  name text not null,
  pre_money_valuation numeric not null check (pre_money_valuation >= 0),
  raise_amount numeric not null check (raise_amount >= 0),
  post_money_valuation numeric not null check (post_money_valuation >= 0),
  new_investor_ownership numeric not null check (new_investor_ownership between 0 and 100),
  existing_holder_ownership numeric not null check (existing_holder_ownership between 0 and 100),
  option_pool_post_percent numeric not null default 0 check (option_pool_post_percent between 0 and 100),
  assumptions jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.funding_cap_table_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  holder_name text not null,
  holder_type text not null default 'founder' check (holder_type in ('founder','employee','advisor','investor','option_pool','other')),
  security_type text not null default 'ordinary' check (security_type in ('ordinary','preferred','option','safe','convertible','other')),
  shares numeric check (shares is null or shares >= 0),
  ownership_percent numeric not null default 0 check (ownership_percent between 0 and 100),
  invested_amount numeric check (invested_amount is null or invested_amount >= 0),
  currency text not null default 'ZAR',
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.funding_valuation_scenarios (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  method text not null check (method in ('revenue_multiple','target_ownership','manual','scorecard','other')),
  annual_revenue numeric check (annual_revenue is null or annual_revenue >= 0),
  multiple numeric check (multiple is null or multiple >= 0),
  raise_amount numeric check (raise_amount is null or raise_amount >= 0),
  target_investor_percent numeric check (target_investor_percent is null or target_investor_percent > 0 and target_investor_percent < 100),
  estimated_pre_money numeric not null default 0 check (estimated_pre_money >= 0),
  estimated_post_money numeric not null default 0 check (estimated_post_money >= 0),
  currency text not null default 'ZAR',
  assumptions text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.funding_offers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  round_id uuid references public.funding_rounds(id) on delete set null,
  investor_id uuid references public.funding_investors(id) on delete set null,
  offer_type text not null default 'equity' check (offer_type in ('equity','safe','convertible','debt','grant','other')),
  amount numeric not null default 0 check (amount >= 0),
  currency text not null default 'ZAR',
  valuation numeric check (valuation is null or valuation >= 0),
  ownership_percent numeric check (ownership_percent is null or ownership_percent between 0 and 100),
  terms text,
  status text not null default 'received' check (status in ('received','reviewing','negotiating','accepted','declined','expired','withdrawn')),
  received_at timestamptz not null default now(),
  decision_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists funding_opportunities_search_idx on public.funding_opportunities(status,deadline);
create index if not exists funding_saved_org_idx on public.funding_saved_opportunities(organization_id,status,updated_at desc);
create index if not exists funding_investors_org_idx on public.funding_investors(organization_id,status,updated_at desc);
create index if not exists funding_interactions_org_idx on public.funding_investor_interactions(organization_id,occurred_at desc);
create index if not exists funding_decks_org_idx on public.funding_pitch_decks(organization_id,status,updated_at desc);
create index if not exists funding_rooms_org_idx on public.funding_data_rooms(organization_id,status,updated_at desc);
create index if not exists funding_rounds_org_idx on public.funding_rounds(organization_id,status,updated_at desc);
create index if not exists funding_cap_table_org_idx on public.funding_cap_table_entries(organization_id,ownership_percent desc);

create or replace function public.funding_readiness_summary(org_id uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare verified_count int:=0; governance_docs int:=0; financial_docs int:=0; signed_contracts int:=0; paid_invoices int:=0; customers int:=0; growth_evidence int:=0; critical_risks int:=0; deck_slides int:=0; room_items int:=0; cap_entries int:=0; rounds int:=0; governance_score int:=0; financial_score int:=0; traction_score int:=0; materials_score int:=0; room_score int:=0; risk_penalty int:=0; overall int:=0; gaps jsonb:='[]'::jsonb; begin
  if not private.startup_workspace_member(org_id,(select auth.uid())) then raise exception 'workspace access required'; end if;
  select count(*) into verified_count from public.company_verification_records where organization_id=org_id and status='verified';
  select count(*) filter(where document_type in ('company_registration','tax','bee','bank','insurance')),count(*) filter(where document_type='financial') into governance_docs,financial_docs from public.legal_documents where organization_id=org_id and status='current';
  select count(*) into signed_contracts from public.legal_contracts where organization_id=org_id and status='signed';
  select count(*) into paid_invoices from public.revenue_invoices where organization_id=org_id and status in ('paid','part_paid');
  select count(*) into customers from public.revenue_accounts where organization_id=org_id and lifecycle='customer';
  select count(*) into growth_evidence from public.growth_kpi_measurements where organization_id=org_id;
  select count(*) into critical_risks from public.ops_risks where organization_id=org_id and status in ('open','monitoring') and risk_score>=15;
  select coalesce(max(c),0) into deck_slides from (select count(*) c from public.funding_pitch_slides where organization_id=org_id group by deck_id) s;
  select count(*) into room_items from public.funding_data_room_items where organization_id=org_id;
  select count(*) into cap_entries from public.funding_cap_table_entries where organization_id=org_id;
  select count(*) into rounds from public.funding_rounds where organization_id=org_id and status<>'cancelled';
  governance_score:=least(100,verified_count*20+governance_docs*10+least(signed_contracts*5,20));
  financial_score:=least(100,financial_docs*35+least(paid_invoices*8,40)+case when cap_entries>0 then 25 else 0 end);
  traction_score:=least(100,least(customers*8,40)+least(paid_invoices*6,30)+least(growth_evidence*3,30));
  materials_score:=least(100,deck_slides*8+case when rounds>0 then 10 else 0 end);
  room_score:=least(100,room_items*12+least(governance_docs*5,25)+least(financial_docs*10,30));
  risk_penalty:=least(30,critical_risks*10);
  overall:=greatest(0,least(100,round(governance_score*.25+financial_score*.25+traction_score*.20+materials_score*.15+room_score*.15)::int-risk_penalty));
  if governance_score<60 then gaps:=gaps||jsonb_build_array('Strengthen verified governance and legal evidence'); end if;
  if financial_score<60 then gaps:=gaps||jsonb_build_array('Add current financial evidence and a complete cap table'); end if;
  if traction_score<50 then gaps:=gaps||jsonb_build_array('Connect stronger customer, revenue and growth evidence'); end if;
  if deck_slides<10 then gaps:=gaps||jsonb_build_array('Complete the investor pitch deck'); end if;
  if room_items<6 then gaps:=gaps||jsonb_build_array('Complete the investor data room'); end if;
  if critical_risks>0 then gaps:=gaps||jsonb_build_array('Address high-impact open risks'); end if;
  return jsonb_build_object('overall_score',overall,'governance_score',governance_score,'financial_score',financial_score,'traction_score',traction_score,'materials_score',materials_score,'data_room_score',room_score,'risk_penalty',risk_penalty,'gaps',gaps,'evidence',jsonb_build_object('verified_records',verified_count,'governance_documents',governance_docs,'financial_documents',financial_docs,'signed_contracts',signed_contracts,'paid_invoices',paid_invoices,'customers',customers,'growth_measurements',growth_evidence,'critical_risks',critical_risks,'pitch_slides',deck_slides,'data_room_items',room_items,'cap_table_entries',cap_entries,'funding_rounds',rounds));
end $$;

-- Global opportunity library: authenticated users may read active platform records; workspace records remain private to their company.
alter table public.funding_opportunities enable row level security;
drop policy if exists funding_opportunities_select on public.funding_opportunities;
create policy funding_opportunities_select on public.funding_opportunities for select to authenticated using ((source_scope='platform' and status='active') or (organization_id is not null and private.startup_workspace_member(organization_id,(select auth.uid()))));
drop policy if exists funding_opportunities_insert on public.funding_opportunities;
create policy funding_opportunities_insert on public.funding_opportunities for insert to authenticated with check (source_scope='workspace' and organization_id is not null and private.workspace_has_permission(organization_id,(select auth.uid()),'company.manage'));
drop policy if exists funding_opportunities_update on public.funding_opportunities;
create policy funding_opportunities_update on public.funding_opportunities for update to authenticated using (source_scope='workspace' and organization_id is not null and private.workspace_has_permission(organization_id,(select auth.uid()),'company.manage')) with check (source_scope='workspace' and organization_id is not null and private.workspace_has_permission(organization_id,(select auth.uid()),'company.manage'));
drop policy if exists funding_opportunities_delete on public.funding_opportunities;
create policy funding_opportunities_delete on public.funding_opportunities for delete to authenticated using (source_scope='workspace' and organization_id is not null and private.workspace_has_permission(organization_id,(select auth.uid()),'company.manage'));

do $$ declare t text; begin
  foreach t in array array['funding_saved_opportunities','funding_investors','funding_investor_contacts','funding_investor_interactions','funding_pitch_decks','funding_pitch_slides','funding_readiness_snapshots','funding_data_rooms','funding_data_room_items','funding_data_room_shares','funding_data_room_access_log','funding_rounds','funding_round_scenarios','funding_cap_table_entries','funding_valuation_scenarios','funding_offers'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('drop policy if exists %I on public.%I',t||'_select',t);
    execute format('create policy %I on public.%I for select to authenticated using (private.startup_workspace_member(organization_id,(select auth.uid())))',t||'_select',t);
    execute format('drop policy if exists %I on public.%I',t||'_insert',t);
    execute format('create policy %I on public.%I for insert to authenticated with check (private.workspace_has_permission(organization_id,(select auth.uid()),''company.manage''))',t||'_insert',t);
    execute format('drop policy if exists %I on public.%I',t||'_update',t);
    execute format('create policy %I on public.%I for update to authenticated using (private.workspace_has_permission(organization_id,(select auth.uid()),''company.manage'')) with check (private.workspace_has_permission(organization_id,(select auth.uid()),''company.manage''))',t||'_update',t);
    execute format('drop policy if exists %I on public.%I',t||'_delete',t);
    execute format('create policy %I on public.%I for delete to authenticated using (private.workspace_has_permission(organization_id,(select auth.uid()),''company.manage''))',t||'_delete',t);
  end loop;
end $$;

revoke all on function public.funding_readiness_summary(uuid) from public;
grant execute on function public.funding_readiness_summary(uuid) to authenticated;
