-- Start To Up — Startup OS Phase 2: Business Model & Finance backend.
-- Workspace-scoped source of truth for canvases, pricing, financial scenarios,
-- expenses, cap tables, financing and valuation modelling.
-- Calculations are decision-support only and are not accounting, tax, legal or investment advice.

create table if not exists public.finance_business_models (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null default 'Business Model',
  customer_segments jsonb not null default '[]'::jsonb,
  value_propositions jsonb not null default '[]'::jsonb,
  channels jsonb not null default '[]'::jsonb,
  customer_relationships jsonb not null default '[]'::jsonb,
  revenue_streams jsonb not null default '[]'::jsonb,
  key_resources jsonb not null default '[]'::jsonb,
  key_activities jsonb not null default '[]'::jsonb,
  key_partners jsonb not null default '[]'::jsonb,
  cost_structure jsonb not null default '[]'::jsonb,
  status text not null default 'draft' check (status in ('draft','active','archived')),
  version integer not null default 1 check (version > 0),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.finance_lean_canvases (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null default 'Lean Canvas',
  problem jsonb not null default '[]'::jsonb,
  solution jsonb not null default '[]'::jsonb,
  unique_value_proposition text,
  unfair_advantage text,
  customer_segments jsonb not null default '[]'::jsonb,
  key_metrics jsonb not null default '[]'::jsonb,
  channels jsonb not null default '[]'::jsonb,
  cost_structure jsonb not null default '[]'::jsonb,
  revenue_streams jsonb not null default '[]'::jsonb,
  status text not null default 'draft' check (status in ('draft','active','archived')),
  version integer not null default 1 check (version > 0),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.finance_pricing_models (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  pricing_type text not null default 'fixed' check (pricing_type in ('fixed','cost_plus','subscription','usage','tiered','commission','marketplace','custom')),
  currency text not null default 'ZAR',
  base_price numeric not null default 0 check (base_price >= 0),
  variable_cost numeric not null default 0 check (variable_cost >= 0),
  fixed_cost_allocation numeric not null default 0 check (fixed_cost_allocation >= 0),
  target_margin_percent numeric check (target_margin_percent is null or target_margin_percent between 0 and 100),
  tax_percent numeric not null default 0 check (tax_percent between 0 and 100),
  assumptions jsonb not null default '{}'::jsonb,
  evidence_confidence text not null default 'owner_entered' check (evidence_confidence in ('owner_entered','observed','estimated','verified')),
  status text not null default 'draft' check (status in ('draft','active','archived')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.finance_financial_scenarios (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  scenario_type text not null default 'base' check (scenario_type in ('base','best','worst','custom')),
  currency text not null default 'ZAR',
  opening_cash numeric not null default 0,
  start_month date not null default date_trunc('month',current_date)::date,
  horizon_months integer not null default 12 check (horizon_months between 1 and 120),
  notes text,
  assumptions jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft','active','locked','archived')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.finance_assumptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  scenario_id uuid not null references public.finance_financial_scenarios(id) on delete cascade,
  category text not null check (category in ('revenue','cost','headcount','marketing','tax','capex','working_capital','funding','other')),
  name text not null,
  value numeric not null default 0,
  unit text,
  cadence text not null default 'monthly' check (cadence in ('once','monthly','quarterly','annual','percent','custom')),
  starts_on date,
  ends_on date,
  source text,
  evidence_confidence text not null default 'owner_entered' check (evidence_confidence in ('owner_entered','observed','estimated','verified')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.finance_monthly_projections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  scenario_id uuid not null references public.finance_financial_scenarios(id) on delete cascade,
  month date not null,
  revenue numeric not null default 0,
  cost_of_sales numeric not null default 0,
  operating_expenses numeric not null default 0,
  capex numeric not null default 0,
  financing_inflows numeric not null default 0,
  financing_outflows numeric not null default 0,
  tax numeric not null default 0,
  closing_cash numeric,
  customers integer check (customers is null or customers >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(scenario_id,month)
);

create table if not exists public.finance_expenses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  scenario_id uuid references public.finance_financial_scenarios(id) on delete set null,
  vendor_id uuid references public.ops_vendors(id) on delete set null,
  category text not null default 'other',
  description text not null,
  amount numeric not null check (amount >= 0),
  currency text not null default 'ZAR',
  incurred_on date not null default current_date,
  recurring boolean not null default false,
  recurrence text check (recurrence is null or recurrence in ('monthly','quarterly','annual','custom')),
  source text not null default 'manual',
  evidence_confidence text not null default 'owner_entered' check (evidence_confidence in ('owner_entered','observed','estimated','verified')),
  document_id uuid references public.company_documents(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.finance_cap_table_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  holder_name text not null,
  holder_type text not null default 'founder' check (holder_type in ('founder','employee','investor','advisor','entity','option_pool','other')),
  security_type text not null default 'ordinary' check (security_type in ('ordinary','preferred','option','warrant','safe','convertible_note','other')),
  units numeric not null default 0 check (units >= 0),
  fully_diluted_units numeric not null default 0 check (fully_diluted_units >= 0),
  issue_price numeric check (issue_price is null or issue_price >= 0),
  vesting jsonb not null default '{}'::jsonb,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.finance_financing_instruments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  instrument_type text not null check (instrument_type in ('equity','safe','convertible_note','loan','grant','revenue_share','other')),
  principal_or_investment numeric not null default 0 check (principal_or_investment >= 0),
  currency text not null default 'ZAR',
  valuation_cap numeric check (valuation_cap is null or valuation_cap >= 0),
  discount_percent numeric check (discount_percent is null or discount_percent between 0 and 100),
  interest_percent numeric check (interest_percent is null or interest_percent between 0 and 100),
  maturity_date date,
  status text not null default 'scenario' check (status in ('scenario','proposed','signed','active','converted','repaid','cancelled')),
  terms jsonb not null default '{}'::jsonb,
  document_id uuid references public.company_documents(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.finance_dilution_scenarios (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  pre_money_valuation numeric not null check (pre_money_valuation >= 0),
  new_money numeric not null check (new_money >= 0),
  option_pool_percent numeric not null default 0 check (option_pool_percent between 0 and 100),
  existing_fully_diluted_units numeric not null default 0 check (existing_fully_diluted_units >= 0),
  result jsonb not null default '{}'::jsonb,
  assumptions jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.finance_valuation_scenarios (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  method text not null check (method in ('revenue_multiple','ebitda_multiple','scorecard','target_ownership','custom')),
  annual_revenue numeric,
  ebitda numeric,
  multiple numeric,
  raise_amount numeric,
  target_investor_ownership_percent numeric check (target_investor_ownership_percent is null or target_investor_ownership_percent between 0 and 100),
  estimated_value numeric,
  assumptions jsonb not null default '{}'::jsonb,
  evidence_confidence text not null default 'estimated' check (evidence_confidence in ('owner_entered','observed','estimated','verified')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.finance_model_snapshots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  scenario_id uuid references public.finance_financial_scenarios(id) on delete cascade,
  snapshot_name text not null,
  snapshot jsonb not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists finance_scenarios_org_idx on public.finance_financial_scenarios(organization_id,status,updated_at desc);
create index if not exists finance_assumptions_scenario_idx on public.finance_assumptions(scenario_id,category);
create index if not exists finance_projection_scenario_idx on public.finance_monthly_projections(scenario_id,month);
create index if not exists finance_expenses_org_idx on public.finance_expenses(organization_id,incurred_on desc);
create index if not exists finance_cap_table_org_idx on public.finance_cap_table_entries(organization_id,holder_type);
create index if not exists finance_instruments_org_idx on public.finance_financing_instruments(organization_id,status,updated_at desc);

create or replace function public.finance_runway(cash_balance numeric, monthly_burn numeric)
returns numeric language sql immutable set search_path='' as $$
  select case when coalesce(monthly_burn,0)<=0 then null else greatest(0,coalesce(cash_balance,0))/monthly_burn end;
$$;

create or replace function public.finance_break_even_units(fixed_costs numeric, unit_price numeric, unit_variable_cost numeric)
returns numeric language sql immutable set search_path='' as $$
  select case when coalesce(unit_price,0)-coalesce(unit_variable_cost,0)<=0 then null
  else ceil(greatest(0,coalesce(fixed_costs,0))/(unit_price-unit_variable_cost)) end;
$$;

create or replace function public.finance_unit_economics(arpu numeric, gross_margin_percent numeric, cac numeric, monthly_churn_percent numeric)
returns jsonb language sql immutable set search_path='' as $$
  select jsonb_build_object(
    'grossProfitPerCustomer',coalesce(arpu,0)*coalesce(gross_margin_percent,0)/100.0,
    'ltv',case when coalesce(monthly_churn_percent,0)<=0 then null else (coalesce(arpu,0)*coalesce(gross_margin_percent,0)/100.0)/(monthly_churn_percent/100.0) end,
    'cac',greatest(0,coalesce(cac,0)),
    'ltvCac',case when coalesce(cac,0)<=0 or coalesce(monthly_churn_percent,0)<=0 then null else ((coalesce(arpu,0)*coalesce(gross_margin_percent,0)/100.0)/(monthly_churn_percent/100.0))/cac end,
    'paybackMonths',case when coalesce(arpu,0)*coalesce(gross_margin_percent,0)<=0 then null else greatest(0,coalesce(cac,0))/(arpu*gross_margin_percent/100.0) end
  );
$$;

create or replace function public.finance_round_model(pre_money numeric, raise_amount numeric)
returns jsonb language sql immutable set search_path='' as $$
  select jsonb_build_object(
    'preMoney',greatest(0,coalesce(pre_money,0)),
    'raise',greatest(0,coalesce(raise_amount,0)),
    'postMoney',greatest(0,coalesce(pre_money,0))+greatest(0,coalesce(raise_amount,0)),
    'newInvestorOwnershipPercent',case when greatest(0,coalesce(pre_money,0))+greatest(0,coalesce(raise_amount,0))=0 then 0 else greatest(0,coalesce(raise_amount,0))/(greatest(0,coalesce(pre_money,0))+greatest(0,coalesce(raise_amount,0)))*100 end,
    'existingOwnershipPercent',case when greatest(0,coalesce(pre_money,0))+greatest(0,coalesce(raise_amount,0))=0 then 100 else greatest(0,coalesce(pre_money,0))/(greatest(0,coalesce(pre_money,0))+greatest(0,coalesce(raise_amount,0)))*100 end
  );
$$;

create or replace function public.finance_scenario_summary(org_id uuid, scenario_uuid uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare s public.finance_financial_scenarios; r numeric:=0; cos numeric:=0; opex numeric:=0; last_cash numeric; months integer:=0;
begin
  if not private.startup_workspace_member(org_id,(select auth.uid())) then raise exception 'workspace access required'; end if;
  select * into s from public.finance_financial_scenarios where id=scenario_uuid and organization_id=org_id;
  if s.id is null then raise exception 'scenario not found'; end if;
  select coalesce(sum(revenue),0),coalesce(sum(cost_of_sales),0),coalesce(sum(operating_expenses),0),max(closing_cash) filter (where month=(select max(month) from public.finance_monthly_projections where scenario_id=scenario_uuid)),count(*)
    into r,cos,opex,last_cash,months from public.finance_monthly_projections where scenario_id=scenario_uuid;
  return jsonb_build_object('scenarioId',scenario_uuid,'months',months,'revenue',r,'grossProfit',r-cos,'operatingResult',r-cos-opex,'closingCash',last_cash,'currency',s.currency);
end $$;

grant execute on function public.finance_scenario_summary(uuid,uuid) to authenticated;

-- Workspace RLS for all Phase 2 finance records.
do $$ declare t text; begin
  foreach t in array array[
    'finance_business_models','finance_lean_canvases','finance_pricing_models','finance_financial_scenarios',
    'finance_assumptions','finance_monthly_projections','finance_expenses','finance_cap_table_entries',
    'finance_financing_instruments','finance_dilution_scenarios','finance_valuation_scenarios','finance_model_snapshots'
  ] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('drop policy if exists %I on public.%I',t||'_workspace_select',t);
    execute format('create policy %I on public.%I for select to authenticated using (private.startup_workspace_member(organization_id,(select auth.uid())))',t||'_workspace_select',t);
    execute format('drop policy if exists %I on public.%I',t||'_workspace_manage',t);
    execute format('create policy %I on public.%I for all to authenticated using (private.workspace_has_permission(organization_id,(select auth.uid()),''company.manage'')) with check (private.workspace_has_permission(organization_id,(select auth.uid()),''company.manage''))',t||'_workspace_manage',t);
  end loop;
end $$;

revoke all on function public.finance_runway(numeric,numeric) from public;
revoke all on function public.finance_break_even_units(numeric,numeric,numeric) from public;
revoke all on function public.finance_unit_economics(numeric,numeric,numeric,numeric) from public;
revoke all on function public.finance_round_model(numeric,numeric) from public;
grant execute on function public.finance_runway(numeric,numeric) to authenticated;
grant execute on function public.finance_break_even_units(numeric,numeric,numeric) to authenticated;
grant execute on function public.finance_unit_economics(numeric,numeric,numeric,numeric) to authenticated;
grant execute on function public.finance_round_model(numeric,numeric) to authenticated;
