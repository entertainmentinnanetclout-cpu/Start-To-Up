# Handoff

Phase 2 collaboration and trust is wired to live Supabase without mock content. Authentication is deliberately excluded. Collaboration interest, expert-session registration and content reports submit through an insert-only guest intake; anonymous clients cannot read or manage submissions. Sensitive actions remain protected. The database security advisor is clean after migration `20260823103000_authless_guest_intake.sql`.

Next product task: connect authentication and route guards, then activate the already-wired protected mutations and complete end-to-end role testing with real test accounts.

## Working

- Responsive branded landing page and application shell
- Home, Explore, Network, and Profile live-data routes with honest empty states
- Collaboration board, messages, trust centre, organizations, expert sessions, reports and moderation routes
- Organizations, verification, expert-session registrations, storage buckets and protected-access/evidence enhancements
- Supabase email/password sign-in and sign-up
- Initial identity/commitment onboarding screen
- Complete application schema with RLS
- PWA metadata, icons, favicon, and manifest

## Not yet connected

- Auth guards, sessions, and onboarding persistence
- Permanent-account creation, private messaging, protected access, IP claims and staff decisions
- Media uploads, protected-project access, evidence vault UI, and notifications
- Legal acceptance UI and final legal text
- Full staff moderation console, native livestreaming, investor transaction workflows, and analytics

Read `IMPLEMENTATION_STATUS.md`, `ROADMAP.md`, and `docs/KNOWN_ISSUES.md` before continuing. Keep migrations additive and never rewrite published Git history.
