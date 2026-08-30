-- Phase 4 public lead capture ledger. Public clients never write CRM tables directly.
create table if not exists public.revenue_public_capture_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  lead_magnet_id uuid references public.revenue_lead_magnets(id) on delete set null,
  lead_id uuid references public.revenue_leads(id) on delete set null,
  contact_id uuid references public.revenue_contacts(id) on delete set null,
  email_hash text,
  ip_hash text,
  source_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists revenue_capture_rate_idx on public.revenue_public_capture_events(lead_magnet_id,ip_hash,created_at desc);
create index if not exists revenue_capture_email_idx on public.revenue_public_capture_events(lead_magnet_id,email_hash,created_at desc);
alter table public.revenue_public_capture_events enable row level security;
drop policy if exists revenue_capture_member_read on public.revenue_public_capture_events;
create policy revenue_capture_member_read on public.revenue_public_capture_events for select to authenticated
using (private.startup_workspace_member(organization_id,(select auth.uid())));
-- No anon insert policy. The managed Edge Function validates token, honeypot and rate limits,
-- then uses the service role to create the contact/lead and this audit event.
