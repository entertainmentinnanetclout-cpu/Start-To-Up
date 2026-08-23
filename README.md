# Start To Up

Start To Up is a professional social network for innovators, founders, researchers, technicians, investors, mentors, and public-sector ecosystem partners. It combines project storytelling, progress tracking, collaboration, and trusted discovery in one platform.

## Current checkpoint

Phase 0 establishes the product identity and technical foundation: a branded public site, representative social-product screens, email authentication, initial onboarding, a PWA manifest, and a security-first Supabase schema. Feed data and most product actions are still demonstrations pending Phase 1 integration.

## Local development

1. Copy `.env.example` to `.env` and add the Supabase publishable key.
2. Install dependencies with `npm install --package-lock=false` or `bun install`.
3. Run `npm run dev`.

Validation: `npx tsc --noEmit`, `npm run lint`, and `npm run build`.

See [Implementation status](IMPLEMENTATION_STATUS.md), [Roadmap](ROADMAP.md), [Architecture](ARCHITECTURE.md), [Database](DATABASE.md), [Security](SECURITY.md), [Brand guidelines](BRAND_GUIDELINES.md), and [Handoff](HANDOFF.md).

The connected Supabase project is `clawrgsnnmzmcxutiodg`. Never commit service-role keys or user data.
