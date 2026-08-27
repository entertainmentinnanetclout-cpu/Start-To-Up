# Startup OS Phase 1 — Validate & Research

## Objective

Phase 1 turns founder assumptions into structured research records that can be reused by later Startup OS modules. It must improve decision quality without presenting estimates, public observations or founder-entered assumptions as verified business performance.

## Tools in this release

1. Business Idea Validator.
2. Market Size Calculator (TAM / SAM / SOM).
3. Company Intelligence and prospect discovery.
4. Competitor Intelligence workspace.
5. Customer Persona / ICP Builder.
6. Customer Interview Manager.
7. Validation Survey workspace.
8. Brand/domain signal checker.
9. Startup Health baseline score.

## Evidence vocabulary

Every intelligence surface should distinguish one of four evidence states:

- `owner_entered` — supplied manually by the founder/workspace member.
- `observed` — directly observed from a permitted public source or public website scan.
- `estimated` — calculated proxy or third-party estimate. It is not verified company performance.
- `verified` — supplied through an owner-authorised source or reviewed evidence workflow.

UI copy must never silently upgrade one evidence class into another.

## Idea Validator

The validator scores seven dimensions: problem urgency, customer evidence, willingness to pay, competitive understanding, differentiation, monetisation clarity and execution readiness.

The weighted score is a prioritisation aid, not a prediction of commercial success, investment return or future revenue. The underlying dimension evidence remains stored with the score.

## Market Size

The basic deterministic model is:

- `TAM = total potential customers × estimated annual spend per customer`
- `SAM = TAM × serviceable-market percentage`
- `SOM = SAM × obtainable percentage of SAM`

These figures remain assumption-driven until supported by external research. Later provider integrations may add supporting datasets, but must not overwrite founder assumptions without review.

## Company Intelligence

### Google Places discovery

The Company Intelligence service can use a workspace-owned Google Places key to search businesses by company/category and location. A live Places search must require an explicit cost acknowledgement because the user's Google account may have billing/prepayment requirements and usage charges.

Observed fields can include name, category, address, phone, rating, review count, business status, Maps URL and whether a `websiteUri` is present in the returned record.

The correct wording is **“No website detected”**, never “this business has no website,” because absence from one source cannot prove that no website exists.

### Demand proxy

The initial no-cost demand score is an **estimated proxy** derived from visible public review-volume/rating signals. It is deliberately labelled as not being search volume, revenue, sales or private analytics.

Advanced search-demand data can be added from connected providers such as Semrush. Semrush requests must require an API-unit warning/confirmation before execution.

### Website scanner

The public website scanner checks observable technical signals such as HTTPS, page title, description, H1, canonical markup, structured data, viewport configuration, contact cues, social links, robots.txt and sitemap.xml.

Its initial performance score is a technical response/HTML-size proxy. It must not be labelled as Core Web Vitals, Google Analytics performance or owner-verified conversion data.

The scanner must reject loopback/private-network destinations and resolve public hosts before retrieval to reduce SSRF risk.

### Meta advertising

Phase 1 does not invent private Meta campaign metrics. Public research may record an observed active-ad signal when a permitted source is available, but metrics such as spend, CTR, CPA, conversions and ROAS require owner-authorised Meta access or another source that explicitly supplies them.

## Competitor Intelligence

Founder-entered competitor positioning, pricing observations, strengths, weaknesses and ad observations are saved with `owner_entered` confidence unless stronger evidence is attached or a connected provider verifies the field.

## Customer Research

Personas begin as hypotheses. Interviews and survey evidence are stored separately so a later evidence engine can measure whether persona assumptions are actually supported.

Direct survey-response data remains private workspace research data. Public submission endpoints should validate scoped tokens, rate-limit submissions and write server-side instead of granting anonymous write access to the underlying response table.

## Brand checker

The automated brand/domain check is a signal workflow, not legal clearance. DNS presence/absence does not prove domain registration availability, company-name availability or trademark availability. The UI must direct founders to the relevant registrar/official registry for authoritative checks.

## Startup Health

The Phase 1 baseline combines validation, product, finance, sales, digital presence, compliance and team-readiness inputs. At this stage it is primarily a structured self-assessment. As later Startup OS phases launch, components should progressively derive from actual workspace records instead of manual inputs.

## Security and permissions

- All Phase 1 data belongs to an organisation/workspace.
- Phase 0 workspace membership and permissions remain the source of authorisation.
- RLS stays enabled for every Phase 1 business table.
- Provider secrets remain in the Phase 0 encrypted credential store.
- Public search/website results retain source metadata and confidence labels.
- Destructive/edit operations remain auditable through the shared workspace layer.

## Public company privacy rule

Phase 1 must not regress the company-verification privacy policy. Public Start To Up pages must not publish:

- registration dates;
- certificate issue dates;
- certificate expiry dates;
- taxpayer reference numbers;
- personal identity numbers;
- private verification documents or residential details.

## Release gate

Phase 1 can merge only when:

- the Phase 0 release contract still passes;
- deterministic scoring/formula tests pass;
- the production application builds;
- Website Studio V6 model/export tests still pass;
- template visual-fidelity tests remain green;
- Company Intelligence retains billing acknowledgements and evidence labels;
- scanner SSRF protections remain present;
- no public verification-date leakage is introduced.
