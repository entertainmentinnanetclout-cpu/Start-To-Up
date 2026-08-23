# Architecture

- **Framework:** React 19, TanStack Start/Router, TypeScript, Vite
- **Backend:** Supabase Postgres, Auth, and planned Storage/Realtime
- **UI:** Custom responsive CSS, Lucide icons, reusable social components
- **Workflow:** GitHub is the source checkpoint; Lovable remains connected for iteration and preview

Routes live in `src/routes`, shared UI in `src/components`, integrations in `src/integrations`, and additive SQL in `supabase/migrations`.

The database is the authorization boundary. Browser checks improve experience, but sensitive access is always enforced through RLS and scoped database functions.
