# Known Issues

- The database currently contains no real projects, organizations or expert sessions, so connected routes correctly show empty states.
- Authentication lacks password recovery, social providers, route guards, and persisted onboarding.
- Private messaging, protected access, Evidence Vault management, IP claims and staff actions require permanent authentication by design.
- Public guest intake needs rate limiting or CAPTCHA before a high-traffic production launch.
- Onboarding represents only the first stage.
- Storage buckets/policies and production media processing are not configured.
- Legal and agreement interfaces are unfinished and require review.
- Offline behavior, realtime, admin tools, accessibility audit, automated tests, analytics, and monitoring remain pending.
- Repository-wide lint includes pre-existing formatting errors in Lovable-generated Supabase integration/type files; the new Phase 0 application files have no lint errors.
