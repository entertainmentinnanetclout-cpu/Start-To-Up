# Handoff

Phase 2 collaboration and trust is wired to the live Supabase schema without mock content. Authentication is deliberately excluded, so protected mutations show an unavailable-account state until the auth phase. The database security advisor is clean after migration `20260823090000_phase_2_collaboration_and_trust.sql`.

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
- Auth-dependent creation, applications, messaging and moderation actions (data services and policies are ready)
- Media uploads, protected-project access, evidence vault UI, and notifications
- Legal acceptance UI and final legal text
- Full staff moderation console, native livestreaming, investor transaction workflows, and analytics

Read `IMPLEMENTATION_STATUS.md`, `ROADMAP.md`, and `docs/KNOWN_ISSUES.md` before continuing. Keep migrations additive and never rewrite published Git history.
