# Handoff

Phase 0 is implemented and awaiting final screenshot-based browser verification. TypeScript and the production build pass, and the database security advisor is clean after migration `20260823072000_secure_internal_definer_functions.sql`.

Next product task: connect authentication state and profiles to onboarding, then replace the demonstration Home/Explore/Profile content with Supabase queries and mutations.

## Working

- Responsive branded landing page and application shell
- Home, Explore, Create, Network, and Profile presentation routes
- Supabase email/password sign-in and sign-up
- Initial identity/commitment onboarding screen
- Complete application schema with RLS
- PWA metadata, icons, favicon, and manifest

## Not yet connected

- Auth guards, sessions, and onboarding persistence
- Live feed, project creation, reactions, comments, follows, and messaging
- Media uploads, protected-project access, evidence vault UI, and notifications
- Legal acceptance UI and final legal text
- Moderation/admin interfaces, livestreaming, webinars, investor workflows, and analytics

Read `IMPLEMENTATION_STATUS.md`, `ROADMAP.md`, and `docs/KNOWN_ISSUES.md` before continuing. Keep migrations additive and never rewrite published Git history.
