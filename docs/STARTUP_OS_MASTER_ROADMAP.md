# Start To Up — Startup OS Master Roadmap

## Product objective

Build Start To Up into a founder operating system that supports the full lifecycle of a business: validate, structure, build, launch, sell, operate, finance, comply, raise, collaborate and scale.

This roadmap deliberately reuses shared primitives instead of building isolated mini-apps. Core objects such as companies, contacts, projects, documents, transactions, metrics, campaigns, tasks and integrations should be reusable across modules.

## Phase 0 — Trust, identity, governance and shared platform foundation

### Deliverables
- Registered-company trust state and company verification centre.
- Neutral verification badges for company registration, tax registration and B-BBEE documentation.
- Regulator-logo permission registry: never display a regulator/public-body logo unless its published terms or written authorisation permit the exact use.
- Secure auth/session persistence across all Startup OS workspaces.
- Organisation/workspace model, roles, permissions and audit logging.
- Shared company profile, contact, document, metric, task, notification and activity models.
- Integration centre with beginner-friendly three-step connection guides, test-connection actions and plain-language errors.
- Provider secret isolation: user credentials stored server-side and never exposed to public clients or exported websites.
- Feature flags and staged rollout controls.

### Exit gate
Authentication, permissions, session restoration, audit logs and trust metadata must pass production tests before operational/financial data is added.

---

## Phase 1 — Validate & Research

### Tools
1. Business Idea Validator.
2. Market Size Calculator (TAM / SAM / SOM).
3. Competitor Intelligence.
4. Company Intelligence and prospect discovery.
5. Customer Persona / ICP Builder.
6. Customer Interview Manager.
7. Survey Builder and validation surveys.
8. Brand Name Checker workflow.
9. Startup Health baseline score.

### Company Intelligence capabilities
- Search companies by name, category and location.
- Website / no-website-detected classification.
- Public digital-presence scanner.
- SEO, website-performance and conversion-readiness scores.
- Public advertising-signal detection where legally and technically available.
- Search-demand and competitor opportunity signals when data providers are connected.
- Observed / estimated / owner-verified confidence labels.
- Saved leads and opportunity lists.
- Direct "Build a website" handoff to Website Studio.

### Exit gate
Every score must expose its evidence source and must never present estimated data as verified performance.

---

## Phase 2 — Business Model & Finance

### Tools
1. Business Model Builder.
2. Lean Canvas Builder.
3. Pricing Calculator.
4. Unit Economics Calculator.
5. Startup Financial Model.
6. Runway Calculator.
7. Break-even Calculator.
8. Expense Tracker.
9. Valuation Calculator.
10. SAFE / convertible / dilution calculator.
11. Founder Equity Split Tool.
12. Cap Table Manager.

### Shared finance engine
- Scenario modelling.
- Revenue, cost, burn, runway and margin assumptions.
- Monthly/quarterly projections.
- Versioned financial scenarios.
- Exportable investor-ready summaries.

### Exit gate
All calculations need formula-level tests, clear assumptions and warnings that estimates are not accounting, tax or investment advice.

---

## Phase 3 — Build, Brand & Launch

### Tools
1. Product Roadmap.
2. Feature Prioritisation (RICE, ICE, MoSCoW, impact/effort).
3. Task / Sprint Board.
4. Website Studio.
5. Landing Page Builder.
6. Global Brand Kit Builder.
7. Logo / Asset Manager.
8. Reusable Section Library.
9. Launch Readiness Score.
10. Founder/company asset library.

### Website Studio integration
- Create projects directly from validated ideas or Company Intelligence records.
- Reuse company profile, brand kit, contact information and assets.
- Generate multi-page sites and landing pages.
- Preserve responsive design, SEO, accessibility and performance checks.
- Export deployment-ready source.

### Exit gate
A founder must be able to move from validated company profile to branded launch-ready website/project without re-entering core business data.

---

## Phase 4 — Sales, CRM & Revenue Operations

### Tools
1. CRM Lite.
2. Sales Pipeline.
3. Proposal Builder.
4. Invoice & Quotation Builder.
5. Quote-to-Invoice Flow.
6. Sales Forecasting.
7. Lead Magnet Builder.
8. Referral Programme Builder.
9. Affiliate Manager.
10. Review / Reputation Manager.
11. Customer Support Inbox.

### Shared revenue objects
- Companies.
- Contacts.
- Leads.
- Opportunities.
- Activities.
- Proposals.
- Quotes.
- Invoices.
- Payments.
- Customer tickets.

### Exit gate
A lead must be able to flow from Company Intelligence or a website form into CRM, through proposal/quote, into a won deal and invoice without duplicate manual records.

---

## Phase 5 — Marketing & Growth

### Tools
1. Campaign Planner.
2. Marketing Budget Calculator.
3. Content Calendar.
4. UTM Campaign Builder.
5. SEO Growth Centre.
6. Growth Experiment Tracker.
7. KPI Dashboard Builder.
8. Churn / Retention Tracker.
9. Campaign attribution dashboard.
10. Paid-media integration centre.

### Growth workflow
- Campaign objective and budget.
- Audience and channels.
- Content/calendar execution.
- Trackable links and landing pages.
- Leads and conversions into CRM.
- Experiment result and learning log.
- KPI and retention reporting.

### Exit gate
Marketing metrics and CRM outcomes must share consistent campaign identifiers so founders can see which activities create revenue.

---

## Phase 6 — Operations, Teams & Execution

### Tools
1. Founder Dashboard / Command Centre.
2. OKR Tracker.
3. Decision Log.
4. Risk Register.
5. Hiring Planner.
6. Job Description Builder.
7. Applicant Tracking System.
8. Freelancer / Vendor Manager.
9. Meeting Workspace.
10. Renewal & Deadline Tracker.

### Founder Command Centre
Aggregate the most important signals into one view:
- Launch readiness.
- Revenue and pipeline.
- Burn and runway.
- Product progress.
- Website/SEO health.
- Customer activity.
- Compliance deadlines.
- Funding readiness.
- Highest-priority next actions.

### Exit gate
The Command Centre must derive its scores from actual workspace data rather than static checklists.

---

## Phase 7 — Legal, Compliance & Business Administration

### Tools
1. Company Setup Checklist.
2. Compliance Dashboard.
3. Co-founder Agreement Builder.
4. Contract Builder.
5. E-signature integration/workflow.
6. Document Vault.
7. Tender Readiness Tool.
8. Supplier Readiness Score.
9. Renewal and statutory deadline tracking.
10. Verification-document centre.

### South Africa-first trust workflow
- Company registration evidence.
- Tax registration evidence.
- B-BBEE documentation.
- Supplier/procurement documents.
- Expiry dates and reminders.
- Private due-diligence sharing.
- Public neutral trust badges.
- Official logos displayed only when documented permission/licensing exists.

### Exit gate
Sensitive documents stay private by default, have access logs and cannot be exposed through public URLs unintentionally.

---

## Phase 8 — Funding & Investor Readiness

### Tools
1. Funding Finder.
2. Investor CRM.
3. Pitch Deck Builder.
4. Investor Readiness Score.
5. Secure Data Room.
6. Funding-round modelling.
7. Cap-table / dilution scenarios.
8. Valuation scenarios.

### Workflow
- Assess readiness.
- Close financial/governance gaps.
- Build pitch materials.
- Assemble data room.
- Find funding opportunities.
- Track investor outreach.
- Record meetings, diligence, offers and outcomes.

### Exit gate
Investor readiness must link to actual documents, traction, financials and governance evidence rather than a self-declared score alone.

---

## Phase 9 — Network, Partnerships & Opportunity Marketplace

### Tools
1. Startup Directory Profile.
2. Partnership Matcher.
3. Opportunity Marketplace.
4. Collaboration workspace handoff.
5. Institutional / enterprise programme discovery.
6. Supplier, pilot, tender, WIL and partnership opportunities.

### Matching model
Match on:
- Industry.
- Stage.
- Need.
- Capability.
- Geography.
- Budget/funding status.
- Evidence/verification.
- Availability.

### Exit gate
A network discovery result must move into a structured collaboration, lead, opportunity or project without leaving the platform.

---

## Phase 10 — Intelligence, Automation & Safe Assistance

### Tools
1. Safe AI Assistance for writing, research summaries and structured business workflows.
2. Deterministic builder-chat commands for non-AI operations.
3. Business-plan drafting assistant.
4. SEO metadata assistance.
5. Proposal and pitch narrative assistance.
6. Translation/localisation.
7. Next-best-action recommendations.
8. Workflow automations and reminders.

### Safety / architecture
- External AI providers are optional integrations, not embedded secrets in the browser.
- Users can review extracted facts and changes before applying them.
- Financial/legal/compliance outputs expose assumptions and limitations.
- Visual Website Studio contracts cannot be altered by an assistant unless the user permits layout changes.

### Exit gate
Assistance must remain auditable and reversible, and structured business records must never be silently overwritten.

---

## Product sequencing

### Release A — Foundation + Validation
Phase 0 + Phase 1.

### Release B — Founder Finance
Phase 2.

### Release C — Build & Launch
Phase 3.

### Release D — Revenue Engine
Phase 4 + Phase 5.

### Release E — Operating Company
Phase 6 + Phase 7.

### Release F — Capital & Network
Phase 8 + Phase 9.

### Release G — Intelligence Layer
Phase 10.

## Cross-cutting requirements for every phase

- Mobile-first responsive UI.
- Persistent auth and session restoration.
- Role-based permissions.
- Audit logs for sensitive changes.
- Search and filtering.
- CSV/PDF/export where appropriate.
- Accessible forms and keyboard navigation.
- Clear loading/empty/error states without exposing infrastructure terminology.
- Event analytics and conversion instrumentation.
- Versioning/undo for destructive configuration changes.
- RLS and server-side access enforcement for Supabase-backed records.
- API/integration setup wizards with three beginner-friendly steps and official setup/documentation links.
- Provider-specific cost/quota warnings before enabling billable integrations.
- No claim of private or verified third-party data unless the owner has connected the source.

## Company verification policy

Start To Up should use its own neutral trust badges for registration/tax/B-BBEE status. Public-body or regulator logos must never be used merely because the company is registered with that body. Each logo requires an explicit permission/licence record when the owner's published terms do not already grant the intended use.
