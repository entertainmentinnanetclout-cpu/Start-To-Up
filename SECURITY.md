# Security

- Supabase RLS is the primary access boundary on all application tables.
- Security-definer helpers use a private schema, empty `search_path`, and minimum grants.
- Projects are private by default; wider visibility is deliberate and auditable.
- Agreement acceptance is versioned. The platform must not imply that posting creates patent or copyright protection.
- Service-role credentials must never enter browser code, commits, logs, or screenshots.

Before production: add upload scanning, rate limits, bot protection, retention review, dependency scanning, incident procedures, penetration testing, and jurisdiction-specific legal review.

Phase 2 now includes private evidence and verification buckets, constrained file types/sizes, owner-path policies, minimum grants and RLS on every new table. Upload scanning, signed-URL application flows and full authenticated adversarial tests remain production gates.
