# Start To Up — Startup OS Backend Runbook

This runbook is the production backend contract for Startup OS Phases 0–10. It is intentionally separate from the product phase tracker: code may be released while a provider-side migration or function deployment is still pending.

## Core rules

1. Supabase/Postgres is the source of truth for authenticated business records.
2. Every company-scoped table must use workspace membership and permission checks through the Phase 0 primitives.
3. Anonymous browser clients do not receive direct table access to Startup OS business data. Public capture/sign/share flows go through scoped Edge Functions with tokens, validation, rate limits and audit evidence.
4. Service-role credentials and third-party provider secrets remain server-only and must never be bundled into `src/` or exported Website Studio projects.
5. Legal and due-diligence source documents remain private. The `legal-documents` bucket must never be public.
6. Public company pages do not publish registration dates, certificate issue dates, certificate expiry dates, taxpayer references or private verification source files.
7. Regulator/public-body logos remain permission-gated. Registration with an authority is not itself permission to display its mark.
8. AI/provider output never silently overwrites structured business records. Phase 10 changes are reviewable, reversible and audited.

## Canonical phase migrations

| Phase | Canonical migration(s) |
| --- | --- |
| 0 | `20260827090000_startup_os_phase0_foundation.sql`, `20260827090500_startup_os_phase0_trust_hardening.sql` |
| 1 | `20260827100000_startup_os_phase1_validation_intelligence.sql`, `20260827101000_startup_os_phase1_meta_ads_evidence.sql` |
| 2 | `20260902071000_startup_os_phase2_finance_backend.sql` |
| 3 | Website Studio V6 + `20260830113000_website_studio_access_admin_and_commercial_controls.sql`, `20260830113500_website_studio_approval_enforcement.sql` |
| 4 | `20260830130000_startup_os_phase4_revenue_operations.sql`, `20260830130500_startup_os_phase4_public_capture.sql` |
| 5 | `20260830150000_startup_os_phase5_marketing_growth.sql` |
| 6 | `20260830151000_startup_os_phase6_operating_company.sql` |
| 7 | `20260830170000_startup_os_phase7_legal_compliance.sql` |
| 8 | `20260830180000_startup_os_phase8_funding_investors.sql` |
| 9 | `20260830183000_startup_os_phase9_network_marketplace.sql` |
| 10 | `20260830190000_startup_os_phase10_intelligence_automation.sql` |
| Reconciliation | `20260902072000_startup_os_backend_reconciliation.sql` |

### Historical migration-version correction

The repository previously contained two version collisions:

- Phase 5 and Phase 6 both used `20260830150000`.
- Phase 7 and Phase 9 both used `20260830170000`.

The canonical repository versions are now unique: Phase 6 uses `20260830151000` and Phase 9 uses `20260830183000`.

**Before applying these to an existing production database, inspect the live migration history.** Do not blindly mark a renamed migration as applied. Determine which SQL body, if either, was actually executed under each old duplicate version. Apply only the missing schema body under the corrected unique version, then record the reconciliation result.

## Phase 2 finance backend

Phase 2 now has a dedicated backend even while its full product UI can be released separately. It provides:

- business model and Lean Canvas records;
- pricing models;
- versionable financial scenarios and assumptions;
- monthly projections;
- expense records;
- cap-table entries;
- SAFE/convertible/equity/loan/grant instrument records;
- dilution scenarios;
- valuation scenarios;
- model snapshots;
- deterministic runway, break-even, unit-economics and round-model functions.

All finance outputs remain decision-support scenarios, not accounting, tax, legal, valuation or investment advice.

## Required server gateways

The repository must retain these Startup OS / Website Studio gateways:

- `startup-os-provider-connect`
- `startup-os-company-intelligence`
- `startup-os-revenue-public`
- `startup-os-growth-public`
- `startup-os-legal-public`
- `startup-os-funding-public`
- `startup-os-assistant`
- `website-studio-public-api`
- `website-studio-form-submit`
- `website-studio-deploy-vercel`
- `website-studio-publish-github`
- `website-studio-domain`
- `website-studio-admin-asset-sync`

Private/account-management functions should require a valid JWT. A function may run without platform JWT verification only when it is intentionally public **and** its implementation performs its own scoped-token/custom authentication, abuse/rate controls and data-boundary validation. Never disable JWT merely to make a failing integration work.

## Live production reconciliation procedure

### 1. Inspect before mutating

- List live migration history.
- Confirm the presence/absence of every canonical Phase 0–10 migration.
- Specifically investigate the two historical duplicate versions before applying Phase 6 or Phase 9.
- List deployed Edge Functions and versions.
- Inspect `legal-documents` storage bucket visibility.

### 2. Apply missing migrations in dependency order

Apply missing canonical migrations from Phase 0 upward, then apply `20260902072000_startup_os_backend_reconciliation.sql` last. Do not hardcode generated IDs or rewrite production user data merely to make a migration pass.

### 3. Deploy/upgrade Edge Functions

Deploy function source from the same Git commit being released. Preserve each gateway's authentication mode. Confirm all server secrets exist before testing provider-backed operations.

### 4. Run backend health

Using a server/service-role context only:

```sql
select public.startup_os_backend_health();
```

The report must show each phase's minimum table set, RLS table count and critical functions. The legal document bucket must report private.

### 5. Inspect RLS and grants

Confirm:

- Startup OS workspace tables have RLS enabled;
- direct `anon` table grants are absent for business records;
- authenticated write policies require appropriate workspace permissions;
- explicitly discoverable Phase 9 records expose only intended fields/records through their read policies;
- public signing, due-diligence, funding-room and capture flows are mediated by their server gateways.

### 6. Functional smoke tests

Use separate test users/workspaces where practical:

- member can read only joined workspace data;
- viewer/member without manage permission cannot mutate management records;
- anonymous client cannot directly query private Startup OS tables;
- revenue lead capture creates scoped CRM records through the gateway;
- growth tracking records only token-scoped events;
- legal signer can access only the requested signing payload;
- expired/revoked legal and investor shares deny access;
- Company Intelligence provider keys never return to the client;
- Website Studio export/publish remains approval/entitlement-gated;
- Phase 10 assistant cannot silently apply a proposed structured change.

### 7. Record deployment audit

Persist the result with `startup_os_record_backend_audit(...)` from a server/service-role context. Include the Git commit SHA, live migration inventory, function inventory, RLS/grant findings, storage findings and smoke-test summary.

## CI contract

`scripts/verify-startup-os-backend.ts` fails the release if:

- migration versions collide;
- a canonical Phase 0–10 backend migration is missing;
- Phase 2 finance backend objects disappear;
- core workspace/RLS markers are removed;
- required server gateway source disappears;
- service-role markers leak into browser source;
- legal/investor public flows lose token scoping;
- the legal document bucket becomes public in source;
- public verification-date/taxpayer privacy rules regress.

This CI contract validates repository/backend source integrity. It does **not** substitute for the live production reconciliation procedure above.
