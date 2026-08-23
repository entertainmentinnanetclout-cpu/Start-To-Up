# Known Issues

- The database currently contains no real projects, organizations or expert sessions, so connected routes correctly show empty states.
- Authentication lacks password recovery, social providers, route guards, and persisted onboarding.
- Phase 2 protected mutations require authentication and intentionally remain unavailable until auth is connected.
- Onboarding represents only the first stage.
- Storage buckets/policies and production media processing are not configured.
- Legal and agreement interfaces are unfinished and require review.
- Offline behavior, realtime, admin tools, accessibility audit, automated tests, analytics, and monitoring remain pending.
- Repository-wide lint includes pre-existing formatting errors in Lovable-generated Supabase integration/type files; the new Phase 0 application files have no lint errors.
