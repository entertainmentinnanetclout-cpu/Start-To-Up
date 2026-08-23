# Database

The initial migration models profiles, private profile data, roles, agreement versions and acceptances, projects, teams, milestones, media, protected access, posts, reactions, comments, follows, hashtags, blocks, collaboration, messages, notifications, reporting, moderation, appeals, audit events, and an evidence vault.

Projects default to private and support `private`, `protected`, `connections`, and `public` visibility. Roles are separate from profiles. Every application table has RLS enabled.

The security migration moves authorization helpers into a non-exposed `private` schema, fixes their `search_path`, and grants only execution required by RLS. Apply migrations in filename order; never edit an applied migration.

Phase 2 adds organizations/memberships, identity-investor-organization verification, scheduled expert sessions and registrations, protected-access expiry/revocation metadata, evidence file metadata, five constrained Storage buckets, audit automation, and production query indexes. No seed/demo people, projects, organizations or sessions are inserted.
