# Handoff

The public website now represents Start To Up as a founder-led innovation and venture-development company, with Start To Up Network as its digital engine. It includes real company positioning, services, founder identity, registration-pending wording and direct contact details. Phase 3 remains wired to GitHub and Supabase without mock content or authentication.

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
