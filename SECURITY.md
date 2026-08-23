# Security

- Supabase RLS is the primary access boundary on all application tables.
- Security-definer helpers use a private schema, empty `search_path`, and minimum grants.
- Projects are private by default; wider visibility is deliberate and auditable.
- Agreement acceptance is versioned. The platform must not imply that posting creates patent or copyright protection.
- Service-role credentials must never enter browser code, commits, logs, or screenshots.

Before production: add upload scanning, rate limits, bot protection, retention review, dependency scanning, incident procedures, penetration testing, and jurisdiction-specific legal review.

Phase 2 now includes private evidence and verification buckets, constrained file types/sizes, owner-path policies, minimum grants and RLS on every new table. Upload scanning, signed-URL application flows and full authenticated adversarial tests remain production gates.

Authless public actions use `guest_action_submissions`, but browser roles have no direct write permission. The `guest-action-submit` Edge Function validates an allowlisted payload and a Cloudflare Turnstile token server-side before using the service role. It fails closed when `TURNSTILE_SECRET_KEY` is missing. Contact details remain staff-only. Restrictive policies prevent guests from creating projects, organizations, conversations, protected-access requests, verification requests or IP claims.

The Turnstile site key is public and belongs in `VITE_TURNSTILE_SITE_KEY`. Its secret must exist only in Supabase Edge Function secrets. CAPTCHA reduces automated abuse; production still needs rate limiting, monitoring and a reviewed retention policy.
