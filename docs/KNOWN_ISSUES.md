# Known Issues

- The database currently contains no real projects, organizations or expert sessions, so connected routes correctly show empty states.
- Authentication lacks password recovery, social providers, route guards, and persisted onboarding.
- Private messaging, protected access, Evidence Vault management, IP claims and staff actions require permanent authentication by design.
- Public guest intake fails closed until Cloudflare Turnstile site and secret keys are configured. Rate limiting and monitoring remain production gates.
- Onboarding represents only the first stage.
- The private build-media bucket and policies exist; production upload UX, scanning, transcoding, streaming and CDN delivery are not configured.
- Legal and agreement interfaces are unfinished and require review.
- Offline behavior, Realtime subscriptions, full multilingual UI, native apps, payments, admin tools, accessibility audit, analytics and monitoring remain pending.
- Repository-wide lint includes pre-existing formatting errors in Lovable-generated Supabase integration/type files; the new Phase 0 application files have no lint errors.
