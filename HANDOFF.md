# Handoff

The public website represents Start To Up as a premium venture-development company and product studio. ResKonnect is the first real editorial product showcase: it publishes a public build update, invites relevant companies to collaborate and gives visitors curated key-page previews before they open the live product. The experience appears across the company landing page, Home, Explore and Ventures. Founder information lives on the footer-linked `/company` route. Authentication remains intentionally excluded.

Innovation Media now uses the public `ranked_media_feed` RPC with explicit quality, collaboration, freshness and audience-relevance signals. Collaboration has a public workspace model with workstreams and operating rules designed to keep discussion, scope, files, decisions and progress inside Start To Up. ResKonnect is the first active example room.

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
- Ranked Innovation Media feed and audience filters
- Public collaboration workspaces and ResKonnect workstreams
- Vercel-targeted Nitro production output

## Not yet connected

- Auth guards, sessions, and onboarding persistence
- Permanent-account creation, private messaging, protected access, IP claims and staff decisions
- Production media upload/encoding, protected-project access, evidence vault UI, and notifications
- Legal acceptance UI and final legal text
- Full staff moderation console, native livestream delivery, payments, investor transaction workflows, and analytics

Read `IMPLEMENTATION_STATUS.md`, `ROADMAP.md`, and `docs/KNOWN_ISSUES.md` before continuing. Keep migrations additive and never rewrite published Git history.
