# Start To Up — Phase 0

Brand system, application shell, landing page, visual screens, database foundation and handoff documentation. No live auth or data wiring in this phase (Phase 1A onwards).

## Backend reset

The connected backend currently holds an unrelated student-residence system (buildings, rooms, leases, students, applications, payments and related enums). Per your instruction, Phase 0 drops all of it and rebuilds the schema for Start To Up alone. This is destructive and irreversible for that data.

New schema (created empty, deny-by-default RLS, no seed rows):

- Identity: `profiles`, `user_identities`, `skills`, `sectors`, `profile_skills`, `profile_sectors`
- Roles: `app_role` enum (user, verified_user, verified_investor, verified_organisation, moderator, admin, super_admin) in a separate `user_roles` table with a `has_role` security-definer function
- Agreements: `agreement_versions`, `agreement_acceptances` (user, version, timestamp, method, superseded status)
- Content: `posts`, `post_media`, `comments`, `reactions` (six reaction types), `saves`, `follows`, `hashtags`, `post_hashtags`
- Projects: `projects` (visibility enum: public / community / protected / private, default private; stage enum: idea → established), `project_members`, `project_milestones`, `project_media`, `protected_access_requests`
- Collaboration: `collaboration_requests`, `collaboration_applications`
- Trust and safety: `content_reports`, `ip_misuse_reports`, `moderation_actions`, `appeals`, `admin_audit_log`
- Evidence: `evidence_events` (creator, timestamps, versions, file hashes, access grants, visibility changes)
- Messaging/notifications: `conversations`, `conversation_participants`, `messages`, `notifications`, `blocks`

Every table gets explicit GRANTs, RLS enabled, and restrictive owner-scoped policies. No public read on anything holding private profile data.

## Brand assets

Derive from the uploaded PNG (1983x793) into `public/brand/`:

- `start-to-up-logo-primary.png` (transparent background, full lockup)
- `start-to-up-logo-light.png`, `start-to-up-logo-dark.png`
- `start-to-up-logo-white.png` (white monochrome), `start-to-up-logo-navy.png`
- `start-to-up-symbol.png` (SU symbol crop, transparent)
- `start-to-up-app-icon.png` (square, padded, no crop of the symbol)
- `start-to-up-og-image.png` (1200x630)
- PWA icons (192, 512) and `public/favicon.png`

Variants are produced by background removal and padding only — the mark is never redrawn, retyped or restyled. A true vector SVG cannot be derived faithfully from a raster; it is documented in `BRAND_GUIDELINES.md` as a required asset to supply.

## Design system

`src/styles.css` tokens in oklch for the full palette (Midnight Navy, Innovation Indigo, Electric Blue, Collaboration Teal, Progress Amber, neutrals, semantic states) mapped to semantic Tailwind tokens, with light and dark themes and AA contrast. Manrope for headings, Inter for UI, Geist Mono for technical metadata — loaded via `<link>` in the root route. Restrained radii, subtle elevation, no glassmorphism, amber used only for milestones and highlights.

## Routes and shell

Stack note: this project runs TanStack Start file-based routing (not React Router), so routes live under `src/routes/`.

- `/` landing page: hero (FROM IDEAS TO IMPACT), trending innovations, how it works, build and share, collaborate, protect your work, find opportunity, under-35 innovation, institutions and investors, final CTA, footer
- `/auth/sign-in`, `/auth/sign-up`, `/auth/forgot-password` — screens only, no session wiring
- `/onboarding` — multi-step structure: welcome, identities, professional details, skills, sectors, location, goals, Innovation Community Code, IP-safety tutorial, privacy and visibility, agreements (no pre-ticked boxes), profile completion
- App shell with mobile bottom nav (Home, Explore, Create, Network, Profile) and desktop left sidebar; header access to notifications, messages, saved, settings, help
- `/home` feed, `/explore` (collections + filters), `/create` menu sheet (Post, Build Reel, Project, Progress Update, Research, Collaboration Request), `/reels`, `/network`, `/profile/$username`, `/projects/$slug` with tabs (Overview, Updates, Build Reels, Journey, Team, Research, Collaboration, Media)
- Legal pages: Terms, Privacy/POPIA, Community Code, IP and Attribution, Confidentiality, Content Ownership, Investment Risk — each marked as draft pending South African legal review
- `/admin` shell (visual only, gated placeholder)

All screens use realistic in-file placeholder content clearly marked as visual-only, with skeletons and empty states. No decorative buttons that pretend to work — non-functional actions are visibly labelled as coming in a later phase.

## Documentation

`README.md`, `HANDOFF.md`, `IMPLEMENTATION_STATUS.md`, `ROADMAP.md`, `ARCHITECTURE.md`, `DATABASE.md`, `SECURITY.md`, `BRAND_GUIDELINES.md`, `TESTING.md`, `CHANGELOG.md`, `.env.example`, `docs/DECISIONS.md`, `docs/KNOWN_ISSUES.md`, plus the migration file. HANDOFF.md carries the full required checklist.

## Verification

Typecheck, production build, and a preview pass at 375px and desktop widths. The session ends with the mandatory START TO UP — BUILD CHECKPOINT block.
