# Handoff

Phase 3 is wired to GitHub and Supabase without mock content or authentication. Build media, live events, ecosystem programs, recommendation events, plans and entitlements have additive schema and RLS. Guest collaboration interest, expert-session registration and content reports now go through the `guest-action-submit` Edge Function and server-side Cloudflare Turnstile verification; direct anonymous inserts are revoked.

Next activation task: configure `VITE_TURNSTILE_SITE_KEY` in the frontend environment and `TURNSTILE_SECRET_KEY` as a Supabase Edge Function secret. Then connect a production media provider, followed by authentication and protected mutation testing when the auth phase is authorized.

## Working

- Responsive branded landing page and application shell
- Home, Explore, Network, and Profile live-data routes with honest empty states
- Collaboration board, messages, trust centre, organizations, expert sessions, reports and moderation routes
- Organizations, verification, expert-session registrations, storage buckets and protected-access/evidence enhancements
- Supabase email/password sign-in and sign-up
- Initial identity/commitment onboarding screen
- Complete application schema with RLS
- PWA metadata, icons, favicon, and manifest
- Build media, live-event, ecosystem-program and plan directories
- CAPTCHA-protected guest intake Edge Function

## Not yet connected

- Auth guards, sessions, and onboarding persistence
- Permanent-account creation, private messaging, protected access, IP claims and staff decisions
- Production media upload/encoding, protected-project access, evidence vault UI, and notifications
- Legal acceptance UI and final legal text
- Full staff moderation console, native livestream delivery, payments, investor transaction workflows, and analytics

Read `IMPLEMENTATION_STATUS.md`, `ROADMAP.md`, and `docs/KNOWN_ISSUES.md` before continuing. Keep migrations additive and never rewrite published Git history.
