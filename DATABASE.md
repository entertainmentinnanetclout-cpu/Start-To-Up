# Database

The initial migration models profiles, private profile data, roles, agreement versions and acceptances, projects, teams, milestones, media, protected access, posts, reactions, comments, follows, hashtags, blocks, collaboration, messages, notifications, reporting, moderation, appeals, audit events, and an evidence vault.

Projects default to private and support `private`, `protected`, `connections`, and `public` visibility. Roles are separate from profiles. Every application table has RLS enabled.

The security migration moves authorization helpers into a non-exposed `private` schema, fixes their `search_path`, and grants only execution required by RLS. Apply migrations in filename order; never edit an applied migration.
