# Testing

Run `npx tsc --noEmit`, `npm run lint`, and `npm run build` before each checkpoint.

Verify landing, authentication, onboarding, and every app route at desktop and mobile widths; keyboard focus and labels; empty/loading/error states; unauthenticated access; and console errors.

Phase 1 adds unit tests for state helpers, integration tests against disposable Supabase, RLS tests for every role/visibility pair, and end-to-end tests for onboarding, publishing, collaboration, and reporting.
