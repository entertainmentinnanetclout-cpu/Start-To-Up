# Changelog

## 2026-08-23 — Phase 2 data wiring

- Removed hard-coded project, member, expert and opportunity demonstrations.
- Wired Home, Explore, Network, Profile and Phase 2 collaboration/trust routes to Supabase.
- Added organizations, verification, expert sessions, secure storage buckets, evidence metadata and protected-access lifecycle fields.
- Kept authentication excluded; protected actions are wired but unavailable without a session.
- Activated authless collaboration interest, expert-session registration and content-safety reporting through insert-only guest intake.

## 2026-08-23 — Phase 0 checkpoint

- Added brand system, landing page, app shell, core route concepts, authentication, onboarding start, and PWA metadata.
- Added the Start To Up social innovation schema and comprehensive RLS.
- Hardened internal security-definer functions and cleared Supabase advisor warnings.
- Added architecture, security, database, testing, roadmap, brand, and continuation documentation.
