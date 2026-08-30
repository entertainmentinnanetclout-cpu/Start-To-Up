-- Phase 1 Meta advertising evidence.
-- This stores a user-observed Ad Library signal only. It does not represent private campaign performance.

alter table public.company_intelligence_records
  add column if not exists meta_ads_evidence_url text,
  add column if not exists meta_ads_checked_at timestamptz;

comment on column public.company_intelligence_records.meta_ads_status is
  'Advertising evidence state. active_observed/none_observed are public observation states; owner_verified requires an authorised owner connection.';
comment on column public.company_intelligence_records.meta_ads_evidence_url is
  'Optional public evidence/reference URL, typically Meta Ad Library. Never treat this as private campaign analytics.';

notify pgrst,'reload schema';
