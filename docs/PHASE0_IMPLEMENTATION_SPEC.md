# Start To Up — Startup OS Phase 0 Production Specification

## Scope
Phase 0 establishes the shared trust, identity, workspace, security and integration foundation used by every later Startup OS module.

## Public company verification policy
Public company pages may publish the legal company name, registration number, registration/tax/B-BBEE status and procurement-recognition status. Registration dates, certificate issue dates and certificate expiry dates remain private operational metadata and are not shown publicly. Tax reference numbers, personal identity numbers, residential addresses and private verification documents are never published.

Official regulator/public-body logos remain disabled unless a published licence or written authorisation explicitly permits the intended third-party website/marketing use.

## Production capabilities
- Persistent Supabase authentication/session restoration with saved return path.
- Organisation workspaces with owner/admin/editor/member/viewer roles.
- Fine-grained workspace permissions.
- Shared company profile, contacts, documents, metrics, tasks, activities and notifications.
- Company verification records with public-safe labels and private evidence metadata.
- Regulator-logo permission registry.
- Workspace audit log for sensitive changes.
- Global integration centre with three-step beginner setup flows and official provider links.
- Server-side encrypted provider credentials; exported/public clients never receive secret credentials.
- Feature flags and per-workspace staged-rollout overrides.
- Session/device activity metadata for security visibility.
- RLS and server-side permission enforcement.

## Exit gate
Phase 0 is complete when auth/session restoration, workspace permissions, trust metadata, integration-secret isolation and audit logging pass production build/CI and live Supabase validation.
