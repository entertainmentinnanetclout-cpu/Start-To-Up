create type public.guest_action_type as enum ('collaboration_interest', 'session_registration', 'content_report');

create table public.guest_action_submissions (
  id uuid primary key default gen_random_uuid(),
  action_type public.guest_action_type not null,
  target_id uuid not null,
  contact_email text not null check (contact_email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'),
  message text not null check (char_length(message) between 10 and 3000),
  category text,
  status text not null default 'pending' check (status in ('pending','reviewing','converted','closed','rejected')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index guest_action_submissions_queue_idx on public.guest_action_submissions(status, action_type, created_at);
create index guest_action_submissions_reviewed_by_idx on public.guest_action_submissions(reviewed_by) where reviewed_by is not null;

alter table public.guest_action_submissions enable row level security;

-- Public clients may insert but can never read/enumerate submitted contact data.
create policy "public guest intake" on public.guest_action_submissions for insert to anon, authenticated
  with check (status = 'pending' and reviewed_by is null and reviewed_at is null);
create policy "staff read guest intake" on public.guest_action_submissions for select to authenticated
  using (private.is_staff((select auth.uid())));
create policy "staff review guest intake" on public.guest_action_submissions for update to authenticated
  using (private.is_staff((select auth.uid())))
  with check (private.is_staff((select auth.uid())));

revoke all on public.guest_action_submissions from anon, authenticated;
grant insert on public.guest_action_submissions to anon, authenticated;
grant select, update on public.guest_action_submissions to authenticated;

notify pgrst, 'reload schema';
