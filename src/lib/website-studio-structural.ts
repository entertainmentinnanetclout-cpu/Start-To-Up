import type { WebsiteStudioDraft } from "./website-studio";

export type StructuralFamily =
  | "saas"
  | "developer"
  | "portfolio"
  | "professional"
  | "property"
  | "accommodation"
  | "restaurant"
  | "commerce"
  | "healthcare"
  | "education"
  | "events"
  | "industrial"
  | "institution"
  | "business";

const familyByTemplate: Record<string, StructuralFamily> = {
  "pulse-saas": "saas",
  "orbit-ai": "saas",
  "block-ledger": "saas",
  "neon-foundry": "developer",
  "studio-north": "portfolio",
  "boldfolio": "portfolio",
  "homecraft": "portfolio",
  "counsel-prime": "professional",
  "ledger-house": "professional",
  "habitat-property": "property",
  "campus-living": "accommodation",
  "reskonnect-premium": "accommodation",
  "table-flame": "restaurant",
  freshcart: "commerce",
  "atelier-mode": "commerce",
  autodrive: "commerce",
  "medica-clinic": "healthcare",
  "glow-beauty": "healthcare",
  sportforge: "healthcare",
  edulaunch: "education",
  "tiny-futures": "education",
  eventspark: "events",
  "summit-travel": "events",
  secureline: "industrial",
  "vertex-build": "industrial",
  "civic-impact": "institution",
  "newsroom-pro": "institution",
};

export const structuralFamilyLabels: Record<StructuralFamily, string> = {
  saas: "SaaS / AI product",
  developer: "Developer tools / API",
  portfolio: "Creative / portfolio",
  professional: "Professional / legal",
  property: "Property / real estate",
  accommodation: "Student accommodation",
  restaurant: "Restaurant / hospitality",
  commerce: "Commerce / fashion / automotive",
  healthcare: "Healthcare / wellness",
  education: "Education / training",
  events: "Events / travel",
  industrial: "Security / construction",
  institution: "Institution / newsroom",
  business: "General business",
};

export function getStructuralFamily(draft: Pick<WebsiteStudioDraft, "templateKey" | "category">): StructuralFamily {
  const key = String(draft.templateKey || "");
  if (familyByTemplate[key]) return familyByTemplate[key];
  if (draft.category === "property") return "property";
  if (draft.category === "restaurant") return "restaurant";
  if (draft.category === "retail") return "commerce";
  if (draft.category === "healthcare") return "healthcare";
  if (draft.category === "education") return "education";
  if (draft.category === "events") return "events";
  if (draft.category === "construction" || draft.category === "security") return "industrial";
  if (draft.category === "institution") return "institution";
  if (draft.category === "technology") return "saas";
  return "business";
}

const e = (value: unknown) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

function array(value: readonly string[] | undefined, fallback: string[]) {
  const clean = (value || []).map(String).map((item) => item.trim()).filter(Boolean);
  return clean.length ? clean : fallback;
}

function cards(items: readonly string[], kind = "card") {
  return items.map((item, index) => `<article class="${kind}"><span>0${index + 1}</span><h3>${e(item)}</h3><p>Built around a clear customer outcome and a direct next step.</p></article>`).join("");
}

function hero(draft: WebsiteStudioDraft, family: StructuralFamily, label: string, visual: string) {
  return `<section class="family-hero family-${family}"><div class="shell family-hero-grid"><div class="family-copy"><span class="eyebrow">${e(label)}</span><h1>${e(draft.site.headline)}</h1><p>${e(draft.site.tagline)}</p><div class="hero-actions"><a class="button primary" href="#primary-action">${e(draft.site.primaryCta)}</a><a class="button ghost" href="#explore">${e(draft.site.secondaryCta)}</a></div></div><div class="family-visual">${visual}</div></div></section>`;
}

function section(title: string, label: string, body: string, id = "explore", alt = false) {
  return `<section id="${id}" class="family-section${alt ? " alt" : ""}"><div class="shell"><header class="family-section-head"><span>${e(label)}</span><h2>${e(title)}</h2></header>${body}</div></section>`;
}

function commonContact(draft: WebsiteStudioDraft, headline: string) {
  return `<section id="primary-action" class="family-cta"><div class="shell family-cta-grid"><div><span>READY WHEN YOU ARE</span><h2>${e(headline)}</h2><p>${e(draft.site.description)}</p></div><div class="contact-panel"><a href="mailto:${e(draft.contact.email)}">${e(draft.contact.email)}</a><a href="tel:${e(draft.contact.phone)}">${e(draft.contact.phone)}</a><strong>${e(draft.contact.address)}</strong></div></div></section>`;
}

function renderSaas(draft: WebsiteStudioDraft) {
  const services = array(draft.site.services, ["Core platform", "Automation", "Analytics", "Integrations", "Security", "Enterprise"]);
  const metrics = draft.site.stats.map((item) => `<article><strong>${e(item.value)}</strong><span>${e(item.label)}</span></article>`).join("");
  return hero(draft, "saas", "PRODUCT PLATFORM", `<div class="product-window"><header><i/><i/><i/></header><div class="product-metric"><strong>Live product</strong><span>Workspace · Analytics · Automation</span></div><div class="product-bars"><i/><i/><i/><i/></div></div>`)
    + `<section class="metric-strip"><div class="shell metric-grid">${metrics}</div></section>`
    + section("Everything the product needs to move work forward.", "FEATURE MATRIX", `<div class="feature-matrix">${cards(services, "feature-card")}</div>`)
    + section("Connect into the tools already running the business.", "INTEGRATIONS", `<div class="integration-cloud">${array(draft.site.highlights, ["GitHub", "Vercel", "Supabase", "Slack", "Stripe", "API"]).map((item) => `<span>${e(item)}</span>`).join("")}</div>`, "integrations", true)
    + section("Use cases built around measurable outcomes.", "USE CASES", `<div class="use-case-grid">${cards(array(draft.site.process, ["Launch faster", "Automate operations", "Understand performance"]), "use-case-card")}</div>`)
    + `<section class="pricing-band"><div class="shell"><span>PRICING / ENTERPRISE</span><h2>Start focused. Scale when the value is proven.</h2><div class="pricing-grid"><article><b>STARTER</b><strong>Launch</strong><p>Core product, support and essential integrations.</p></article><article class="featured"><b>GROWTH</b><strong>Scale</strong><p>Advanced automation, analytics and team workflows.</p></article><article><b>ENTERPRISE</b><strong>Custom</strong><p>Security, procurement and organization-wide rollout.</p></article></div></div></section>`
    + commonContact(draft, "See the product in your own workflow.");
}

function renderDeveloper(draft: WebsiteStudioDraft) {
  const services = array(draft.site.services, ["REST API", "SDKs", "Webhooks", "Auth", "Observability", "CLI"]);
  return hero(draft, "developer", "DEVELOPER PLATFORM", `<div class="terminal"><div><span>●</span><span>●</span><span>●</span></div><pre><code>$ npm install ${e(draft.slug)}\n✓ connected\n✓ authenticated\n✓ ready to ship</code></pre></div>`)
    + section("Build against a platform designed for developers.", "API CAPABILITIES", `<div class="api-grid">${cards(services, "api-card")}</div>`)
    + section("One integration pattern. Multiple environments.", "CODE EXAMPLE", `<div class="code-layout"><pre><code>import { client } from '@${e(draft.slug)}/sdk'\n\nconst result = await client.create({\n  environment: 'production',\n  secure: true\n})</code></pre><div>${array(draft.site.highlights, ["Typed SDK", "Webhooks", "Sandbox", "Audit logs"]).map((item) => `<span>${e(item)}</span>`).join("")}</div></div>`, "code", true)
    + section("Architecture that stays understandable as usage grows.", "SYSTEM DESIGN", `<div class="architecture-row"><span>CLIENT</span><i>→</i><span>API GATEWAY</span><i>→</i><span>CORE</span><i>→</i><span>DATA</span></div>`)
    + commonContact(draft, "Open the docs, test the API, then ship.");
}

function renderPortfolio(draft: WebsiteStudioDraft) {
  const projects = array(draft.site.gallery, ["Campaign system", "Digital product", "Brand platform", "Launch experience", "Editorial identity", "Growth campaign"]);
  return hero(draft, "portfolio", "SELECTED WORK", `<div class="editorial-stack"><article>01<br/><strong>IDENTITY</strong></article><article>02<br/><strong>DIGITAL</strong></article><article>03<br/><strong>CAMPAIGN</strong></article></div>`)
    + section("Work with a point of view.", "PORTFOLIO", `<div class="portfolio-grid">${projects.map((item, index) => `<article class="portfolio-tile"><span>0${index + 1}</span><strong>${e(item)}</strong><small>Strategy · Design · Delivery</small></article>`).join("")}</div>`)
    + section("Capabilities that connect idea to execution.", "CAPABILITIES", `<div class="capability-list">${array(draft.site.services, ["Strategy", "Brand", "Design", "Content", "Digital", "Launch"]).map((item) => `<span>${e(item)}</span>`).join("")}</div>`, "capabilities", true)
    + section("Case studies, not decoration.", "CASE STUDIES", `<div class="case-study-grid">${cards(array(draft.site.process, ["Challenge", "System", "Outcome"]), "case-card")}</div>`)
    + commonContact(draft, "Bring the brief. Build something distinctive.");
}

function renderProfessional(draft: WebsiteStudioDraft) {
  return hero(draft, "professional", "TRUSTED ADVISORY", `<div class="authority-panel"><strong>${e(draft.businessName)}</strong><span>Professional judgement</span><span>Clear scope</span><span>Accountable delivery</span></div>`)
    + section("Expertise organized around the matter at hand.", "PRACTICE AREAS", `<div class="practice-grid">${cards(array(draft.site.services, ["Advisory", "Commercial", "Compliance", "Disputes", "Transactions", "Governance"]), "practice-card")}</div>`)
    + section("Experience that reduces uncertainty.", "CREDENTIALS", `<div class="credential-grid">${draft.site.stats.map((item) => `<article><strong>${e(item.value)}</strong><span>${e(item.label)}</span></article>`).join("")}</div>`, "credentials", true)
    + section("A disciplined route from first conversation to outcome.", "ENGAGEMENT PROCESS", `<div class="step-line">${array(draft.site.process, ["Understand", "Advise", "Execute"]).map((item, index) => `<article><span>0${index + 1}</span><strong>${e(item)}</strong></article>`).join("")}</div>`)
    + commonContact(draft, "Book a confidential consultation.");
}

function renderProperty(draft: WebsiteStudioDraft) {
  const listings = array(draft.site.services, ["City apartment", "Family home", "Investment unit", "New development", "Commercial space", "Premium rental"]);
  return hero(draft, "property", "PROPERTY DISCOVERY", `<div class="property-search"><label>LOCATION<span>${e(draft.site.location)}</span></label><label>PROPERTY TYPE<span>Any</span></label><button>Search properties</button></div>`)
    + section("Featured places worth viewing.", "PROPERTY LISTINGS", `<div class="listing-grid">${listings.map((item, index) => `<article class="listing-card"><div class="listing-image"><span>FEATURED</span></div><div><small>From enquiry</small><h3>${e(item)}</h3><p>${e(draft.site.location)} · View details</p><strong>Available</strong></div></article>`).join("")}</div>`)
    + section("What buyers and tenants care about.", "AMENITIES & TRUST", `<div class="amenity-row">${array(draft.site.highlights, ["Verified", "Secure", "Well located", "Responsive support"]).map((item) => `<span>${e(item)}</span>`).join("")}</div>`, "amenities", true)
    + section("From shortlist to signed outcome.", "PROPERTY JOURNEY", `<div class="step-line">${array(draft.site.process, ["Explore", "View", "Apply"]).map((item, index) => `<article><span>0${index + 1}</span><strong>${e(item)}</strong></article>`).join("")}</div>`)
    + commonContact(draft, "Arrange a viewing or property consultation.");
}

function renderAccommodation(draft: WebsiteStudioDraft) {
  const residences = array(draft.site.services, ["Single room", "Sharing room", "Studio", "Campus residence", "Premium residence", "Budget residence"]);
  return hero(draft, "accommodation", "STUDENT LIVING", `<div class="campus-card"><span>NEAR CAMPUS</span><strong>${e(draft.site.location)}</strong><p>Rooms · Amenities · Applications</p></div>`)
    + section("Choose the living setup that fits your year.", "ROOMS & RESIDENCES", `<div class="residence-grid">${residences.map((item) => `<article><div class="room-photo"></div><h3>${e(item)}</h3><p>Wi-Fi · Study-ready · Secure access</p><strong>Check availability</strong></article>`).join("")}</div>`)
    + section("Everything students need to decide quickly.", "AMENITIES", `<div class="amenity-row">${array(draft.site.highlights, ["Wi-Fi", "Security", "Study areas", "Transport"]).map((item) => `<span>${e(item)}</span>`).join("")}</div>`, "amenities", true)
    + section("A simple path from search to move-in.", "APPLICATION FLOW", `<div class="step-line">${array(draft.site.process, ["Find a residence", "Apply", "Move in"]).map((item, index) => `<article><span>0${index + 1}</span><strong>${e(item)}</strong></article>`).join("")}</div>`)
    + commonContact(draft, "Check availability and start the application.");
}

function renderRestaurant(draft: WebsiteStudioDraft) {
  const dishes = array(draft.site.services, ["Signature plate", "House favourite", "Chef special", "Seasonal dish", "Dessert", "Drinks"]);
  return hero(draft, "restaurant", "DINING EXPERIENCE", `<div class="menu-board"><span>NOW SERVING</span><strong>${e(draft.businessName)}</strong><p>Food · Drinks · Reservations</p></div>`)
    + section("A menu designed around what guests return for.", "MENU", `<div class="menu-grid">${dishes.map((item, index) => `<article><div><h3>${e(item)}</h3><p>Fresh ingredients · House preparation</p></div><strong>R${(95 + index * 20)}</strong></article>`).join("")}</div>`)
    + section("The dishes that define the table.", "FEATURED", `<div class="dish-grid">${array(draft.site.highlights, ["Freshly prepared", "Local ingredients", "Made to order"]).map((item) => `<article><div class="dish-photo"></div><strong>${e(item)}</strong></article>`).join("")}</div>`, "featured", true)
    + section("Book, arrive, enjoy.", "RESERVATION FLOW", `<div class="step-line">${array(draft.site.process, ["Choose a time", "Reserve", "Enjoy"]).map((item, index) => `<article><span>0${index + 1}</span><strong>${e(item)}</strong></article>`).join("")}</div>`)
    + commonContact(draft, "Reserve a table or place an order.");
}

function renderCommerce(draft: WebsiteStudioDraft) {
  const products = array(draft.site.services, ["New arrival", "Best seller", "Signature product", "Limited edition", "Everyday essential", "Premium collection"]);
  return hero(draft, "commerce", "NEW COLLECTION", `<div class="commerce-visual"><div>NEW</div><strong>DROP</strong><span>Shop the latest</span></div>`)
    + `<section class="promo-strip"><div class="shell"><span>FREE DELIVERY OPTIONS</span><span>SECURE CHECKOUT</span><span>EASY SUPPORT</span></div></section>`
    + section("Shop the collection.", "PRODUCT CATALOGUE", `<div class="product-grid">${products.map((item, index) => `<article><div class="product-image"><span>${index % 2 ? "NEW" : "POPULAR"}</span></div><h3>${e(item)}</h3><p>Premium product detail</p><strong>R${(399 + index * 150)}</strong></article>`).join("")}</div>`)
    + section("Browse by collection.", "COLLECTIONS", `<div class="collection-row">${array(draft.site.highlights, ["New arrivals", "Essentials", "Premium", "Limited"]).map((item) => `<span>${e(item)}</span>`).join("")}</div>`, "collections", true)
    + commonContact(draft, "Turn discovery into a confident purchase.");
}

function renderHealthcare(draft: WebsiteStudioDraft) {
  return hero(draft, "healthcare", "CARE & WELLNESS", `<div class="care-card"><span>BOOKING</span><strong>Find the right service</strong><p>Clear information · Professional support · Easy next step</p></div>`)
    + section("Services people can understand before they arrive.", "SERVICES", `<div class="care-grid">${cards(array(draft.site.services, ["Consultation", "Assessment", "Treatment", "Wellness", "Follow-up", "Support"]), "care-service")}</div>`)
    + section("Meet the people behind the care.", "PRACTITIONERS", `<div class="practitioner-grid">${array(draft.site.highlights, ["Qualified practitioner", "Patient support", "Professional care"]).map((item) => `<article><div class="avatar-placeholder"></div><strong>${e(item)}</strong><span>Care team</span></article>`).join("")}</div>`, "team", true)
    + section("Book without unnecessary friction.", "APPOINTMENT FLOW", `<div class="step-line">${array(draft.site.process, ["Choose service", "Book", "Receive care"]).map((item, index) => `<article><span>0${index + 1}</span><strong>${e(item)}</strong></article>`).join("")}</div>`)
    + commonContact(draft, "Book an appointment or ask a care question.");
}

function renderEducation(draft: WebsiteStudioDraft) {
  const programs = array(draft.site.services, ["Certificate programme", "Diploma pathway", "Short course", "Professional programme", "Skills workshop", "Online learning"]);
  return hero(draft, "education", "LEARN · APPLY · PROGRESS", `<div class="education-panel"><span>PROGRAMME FINDER</span><strong>${e(draft.site.location)}</strong><p>Courses · Admissions · Outcomes</p></div>`)
    + section("Find the programme that matches the next step.", "PROGRAMMES", `<div class="course-grid">${programs.map((item) => `<article><span>PROGRAMME</span><h3>${e(item)}</h3><p>Practical learning · Clear outcomes</p><strong>Explore course</strong></article>`).join("")}</div>`)
    + section("Learning should lead somewhere.", "OUTCOMES", `<div class="outcome-grid">${draft.site.stats.map((item) => `<article><strong>${e(item.value)}</strong><span>${e(item.label)}</span></article>`).join("")}</div>`, "outcomes", true)
    + section("A clear admissions path.", "ADMISSIONS", `<div class="step-line">${array(draft.site.process, ["Explore", "Apply", "Start learning"]).map((item, index) => `<article><span>0${index + 1}</span><strong>${e(item)}</strong></article>`).join("")}</div>`)
    + commonContact(draft, "Ask about a programme or start an application.");
}

function renderEvents(draft: WebsiteStudioDraft) {
  const experiences = array(draft.site.services, ["Headline experience", "Main stage", "VIP package", "Weekend pass", "Private booking", "Partner activation"]);
  return hero(draft, "events", "LIVE EXPERIENCE", `<div class="ticket-card"><span>ADMIT ONE</span><strong>${e(draft.businessName)}</strong><p>${e(draft.site.location)}</p></div>`)
    + section("Choose the experience.", "EVENTS / TRIPS", `<div class="experience-grid">${experiences.map((item, index) => `<article><div class="experience-photo"></div><span>0${index + 1}</span><h3>${e(item)}</h3><strong>View details</strong></article>`).join("")}</div>`)
    + section("Know what happens next.", "SCHEDULE / ITINERARY", `<div class="timeline">${array(draft.site.process, ["Arrival", "Main experience", "Finale"]).map((item, index) => `<article><span>${10 + index * 3}:00</span><strong>${e(item)}</strong></article>`).join("")}</div>`, "schedule", true)
    + section("Partners, hosts and people behind the experience.", "PARTNERS", `<div class="partner-row">${array(draft.site.highlights, ["Partner one", "Partner two", "Partner three"]).map((item) => `<span>${e(item)}</span>`).join("")}</div>`)
    + commonContact(draft, "Book the experience or discuss a partnership.");
}

function renderIndustrial(draft: WebsiteStudioDraft) {
  return hero(draft, "industrial", "CAPABILITY & DELIVERY", `<div class="industrial-panel"><strong>READY</strong><span>People</span><span>Process</span><span>Compliance</span></div>`)
    + section("Capability that can be scoped and verified.", "SERVICES", `<div class="industrial-grid">${cards(array(draft.site.services, ["Assessment", "Deployment", "Monitoring", "Project delivery", "Maintenance", "Compliance"]), "industrial-card")}</div>`)
    + section("Proof before promises.", "PROJECTS & COMPLIANCE", `<div class="proof-grid">${array(draft.site.highlights, ["Qualified teams", "Safety discipline", "Clear reporting"]).map((item) => `<article><strong>${e(item)}</strong><p>Evidence-led delivery standard.</p></article>`).join("")}</div>`, "proof", true)
    + section("From scope to controlled execution.", "DELIVERY PROCESS", `<div class="step-line">${array(draft.site.process, ["Assess", "Plan", "Execute"]).map((item, index) => `<article><span>0${index + 1}</span><strong>${e(item)}</strong></article>`).join("")}</div>`)
    + commonContact(draft, "Request a capability assessment or project quote.");
}

function renderInstitution(draft: WebsiteStudioDraft) {
  const programs = array(draft.site.services, ["Public programme", "Community initiative", "Resource centre", "Member service", "Research programme", "Partnership programme"]);
  return hero(draft, "institution", "PUBLIC VALUE", `<div class="news-card"><span>FEATURED UPDATE</span><strong>${e(draft.site.announcement || draft.site.headline)}</strong><p>Programmes · Resources · News</p></div>`)
    + section("Programmes people can actually navigate.", "PROGRAMMES", `<div class="program-grid">${programs.map((item) => `<article><span>PROGRAMME</span><h3>${e(item)}</h3><p>Purpose, eligibility and next action.</p></article>`).join("")}</div>`)
    + section("Impact should be visible.", "IMPACT", `<div class="impact-grid">${draft.site.stats.map((item) => `<article><strong>${e(item.value)}</strong><span>${e(item.label)}</span></article>`).join("")}</div>`, "impact", true)
    + section("A newsroom, not a noticeboard.", "NEWSROOM", `<div class="news-grid">${array(draft.site.testimonials, ["Latest programme update", "New partnership announced", "Community impact report"]).map((item, index) => `<article><span>UPDATE 0${index + 1}</span><h3>${e(item)}</h3><a href="#primary-action">Read more →</a></article>`).join("")}</div>`)
    + commonContact(draft, "Access the right programme, resource or contact point.");
}

function renderBusiness(draft: WebsiteStudioDraft) {
  return hero(draft, "business", "BUSINESS WEBSITE", `<div class="business-panel"><strong>${e(draft.businessName)}</strong><p>${e(draft.site.description)}</p></div>`)
    + section("Services designed around a clear outcome.", "SERVICES", `<div class="feature-matrix">${cards(array(draft.site.services, ["Service one", "Service two", "Service three"]))}</div>`)
    + section("A clear path from interest to action.", "PROCESS", `<div class="step-line">${array(draft.site.process, ["Discover", "Decide", "Deliver"]).map((item, index) => `<article><span>0${index + 1}</span><strong>${e(item)}</strong></article>`).join("")}</div>`, "process", true)
    + commonContact(draft, "Start the conversation.");
}

export function renderStructuralBody(draft: WebsiteStudioDraft): string {
  const family = getStructuralFamily(draft);
  switch (family) {
    case "saas": return renderSaas(draft);
    case "developer": return renderDeveloper(draft);
    case "portfolio": return renderPortfolio(draft);
    case "professional": return renderProfessional(draft);
    case "property": return renderProperty(draft);
    case "accommodation": return renderAccommodation(draft);
    case "restaurant": return renderRestaurant(draft);
    case "commerce": return renderCommerce(draft);
    case "healthcare": return renderHealthcare(draft);
    case "education": return renderEducation(draft);
    case "events": return renderEvents(draft);
    case "industrial": return renderIndustrial(draft);
    case "institution": return renderInstitution(draft);
    default: return renderBusiness(draft);
  }
}

export function renderStructuralWebsiteHtml(draft: WebsiteStudioDraft): string {
  const family = getStructuralFamily(draft);
  const logo = draft.brand.logoUrl ? `<img src="${e(draft.brand.logoUrl)}" alt="${e(draft.businessName)}"/>` : `<strong>${e(draft.brand.logoText || draft.businessName)}</strong>`;
  return `<!doctype html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>${e(draft.seo.title)}</title><meta name="description" content="${e(draft.seo.description)}"/><style>${structuralCss(draft)}</style></head><body><div class="site family-root family-${family}">${draft.site.showAnnouncement ? `<div class="announcement">${e(draft.site.announcement)}</div>` : ""}<header class="family-nav"><div class="shell"><a class="logo" href="#top">${logo}</a><nav><a href="#explore">Explore</a><a href="#primary-action">Contact</a></nav><a class="button primary" href="#primary-action">${e(draft.site.primaryCta)}</a></div></header><main id="top">${renderStructuralBody(draft)}</main><footer><div class="shell"><strong>${e(draft.businessName)}</strong><span>Built with Start To Up Website Studio · ${e(structuralFamilyLabels[family])}</span></div></footer></div></body></html>`;
}

export function structuralCss(draft: WebsiteStudioDraft): string {
  return `*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;font-family:${JSON.stringify(draft.brand.fontFamily)},Inter,system-ui,sans-serif;color:${draft.brand.text};background:#fff}.shell{width:min(${draft.brand.maxWidth}px,calc(100% - 40px));margin:auto}.announcement{padding:9px 20px;text-align:center;background:${draft.brand.secondary};color:#fff;font-size:12px;font-weight:800}.family-nav{position:sticky;top:0;z-index:30;background:rgba(255,255,255,.91);backdrop-filter:blur(18px);border-bottom:1px solid #e8ecf2}.family-nav>.shell{min-height:74px;display:flex;align-items:center;justify-content:space-between;gap:20px}.logo{color:${draft.brand.secondary};text-decoration:none;display:flex;align-items:center}.logo img{max-height:44px;max-width:180px}.family-nav nav{display:flex;gap:22px}.family-nav nav a{font-size:13px;font-weight:750;text-decoration:none;color:#667085}.button{min-height:44px;padding:0 18px;display:inline-flex;align-items:center;justify-content:center;text-decoration:none;border-radius:${draft.brand.buttonStyle === "pill" ? 999 : draft.brand.buttonStyle === "square" ? 5 : 12}px;font-weight:850}.button.primary{background:${draft.brand.primary};color:#fff}.button.ghost{border:1px solid #dce2ea;color:${draft.brand.secondary};background:#fff}.family-hero{padding:88px 0 76px;background:radial-gradient(circle at 85% 10%,color-mix(in srgb,${draft.brand.accent} 18%,transparent),transparent 30%),linear-gradient(180deg,#fff,${draft.brand.surface})}.family-hero-grid{display:grid;grid-template-columns:1.02fr .98fr;gap:56px;align-items:center}.eyebrow,.family-section-head>span,.family-cta span{font-size:10px;letter-spacing:.14em;font-weight:900;color:${draft.brand.primary}}.family-copy h1{font-size:clamp(46px,6vw,82px);line-height:.96;letter-spacing:-.055em;margin:16px 0;color:${draft.brand.secondary}}.family-copy p{font-size:18px;line-height:1.7;color:#667085;max-width:700px}.hero-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:26px}.family-visual{min-height:390px;border-radius:${draft.brand.radius + 8}px;background:${draft.brand.secondary};color:#fff;display:grid;place-items:center;box-shadow:0 30px 90px rgba(12,24,60,.18);overflow:hidden}.family-section{padding:${draft.brand.sectionSpacing}px 0}.family-section.alt{background:${draft.brand.surface}}.family-section-head{max-width:760px;margin-bottom:34px}.family-section-head h2,.family-cta h2{font-size:clamp(34px,4vw,54px);line-height:1.03;letter-spacing:-.04em;color:${draft.brand.secondary};margin:10px 0}.feature-matrix,.api-grid,.practice-grid,.care-grid,.industrial-grid,.program-grid,.course-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.feature-card,.api-card,.practice-card,.care-service,.industrial-card,.program-grid article,.course-grid article,.card{padding:24px;border:1px solid #e3e8ef;border-radius:${draft.brand.radius}px;background:#fff}.feature-card>span,.api-card>span,.practice-card>span,.care-service>span,.industrial-card>span{font-size:10px;font-weight:900;color:${draft.brand.primary}}.metric-strip{border-block:1px solid #e8ecf1}.metric-grid,.credential-grid,.impact-grid,.outcome-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:20px 0}.metric-grid article,.credential-grid article,.impact-grid article,.outcome-grid article{text-align:center;padding:20px}.metric-grid strong,.credential-grid strong,.impact-grid strong,.outcome-grid strong{display:block;font-size:30px;color:${draft.brand.secondary}}.integration-cloud,.amenity-row,.collection-row,.partner-row,.capability-list{display:flex;flex-wrap:wrap;gap:10px}.integration-cloud span,.amenity-row span,.collection-row span,.partner-row span,.capability-list span{padding:13px 18px;border-radius:999px;background:#fff;border:1px solid #dfe5ed;font-weight:800}.pricing-band{padding:${draft.brand.sectionSpacing}px 0;background:${draft.brand.secondary};color:#fff}.pricing-band h2{font-size:clamp(34px,4vw,52px)}.pricing-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.pricing-grid article{padding:28px;border:1px solid rgba(255,255,255,.16);border-radius:${draft.brand.radius}px;background:rgba(255,255,255,.06)}.pricing-grid article.featured{background:${draft.brand.primary}}.pricing-grid strong{display:block;font-size:28px;margin:10px 0}.product-window{width:84%;background:#fff;color:${draft.brand.secondary};border-radius:24px;padding:18px;box-shadow:0 22px 80px rgba(0,0,0,.22)}.product-window header{display:flex;gap:6px}.product-window header i{width:8px;height:8px;border-radius:50%;background:#cad2df}.product-metric{padding:34px 10px 20px}.product-metric strong{display:block;font-size:28px}.product-bars{display:grid;grid-template-columns:repeat(4,1fr);align-items:end;height:120px;gap:8px}.product-bars i{display:block;background:${draft.brand.primary};border-radius:8px 8px 3px 3px}.product-bars i:nth-child(1){height:42%}.product-bars i:nth-child(2){height:72%}.product-bars i:nth-child(3){height:58%}.product-bars i:nth-child(4){height:90%}.terminal{width:86%;background:#070b10;border:1px solid #27313b;border-radius:18px;padding:18px;text-align:left}.terminal>div{display:flex;gap:6px;color:#8cff47}.terminal pre{white-space:pre-wrap;color:#d6fbd4;font:14px/1.7 ui-monospace,monospace}.code-layout{display:grid;grid-template-columns:1.3fr .7fr;gap:18px}.code-layout pre{margin:0;padding:28px;background:#090d12;color:#d8ffdf;border-radius:18px;overflow:auto}.code-layout>div{display:flex;flex-direction:column;gap:10px}.code-layout span{padding:15px;background:#fff;border:1px solid #e2e7ee;border-radius:12px;font-weight:800}.architecture-row{display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap}.architecture-row span{padding:16px 22px;background:${draft.brand.secondary};color:#fff;border-radius:12px;font-weight:900}.editorial-stack{display:grid;grid-template-columns:1fr 1fr;gap:10px;width:80%;transform:rotate(-3deg)}.editorial-stack article{min-height:140px;padding:20px;background:#fff;color:${draft.brand.secondary};display:flex;flex-direction:column;justify-content:space-between}.editorial-stack article:first-child{grid-row:span 2;min-height:290px;background:${draft.brand.primary};color:#fff}.portfolio-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}.portfolio-tile{min-height:260px;padding:24px;border-radius:${draft.brand.radius}px;background:linear-gradient(145deg,${draft.brand.secondary},${draft.brand.primary});color:#fff;display:flex;flex-direction:column;justify-content:flex-end}.portfolio-tile strong{font-size:28px}.authority-panel,.campus-card,.menu-board,.care-card,.education-panel,.industrial-panel,.news-card,.business-panel{width:78%;padding:34px;background:#fff;color:${draft.brand.secondary};border-radius:${draft.brand.radius}px}.authority-panel strong,.campus-card strong,.menu-board strong,.care-card strong,.education-panel strong,.industrial-panel strong,.news-card strong,.business-panel strong{display:block;font-size:28px;margin:12px 0}.authority-panel span,.industrial-panel span{display:block;padding:9px 0;border-bottom:1px solid #e8ecf1}.property-search{width:86%;padding:20px;background:#fff;color:${draft.brand.secondary};border-radius:20px;display:grid;gap:10px}.property-search label{display:flex;justify-content:space-between;padding:12px;border-bottom:1px solid #e7ebf0;font-size:11px;font-weight:900}.property-search button{border:0;background:${draft.brand.primary};color:#fff;padding:14px;border-radius:10px;font-weight:900}.listing-grid,.residence-grid,.product-grid,.experience-grid,.dish-grid,.practitioner-grid,.news-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.listing-card,.residence-grid article,.product-grid article,.experience-grid article,.dish-grid article,.practitioner-grid article,.news-grid article{border:1px solid #e1e6ed;border-radius:${draft.brand.radius}px;overflow:hidden;background:#fff;padding:0 0 20px}.listing-card>div:last-child,.residence-grid article>h3,.residence-grid article>p,.residence-grid article>strong,.product-grid article>h3,.product-grid article>p,.product-grid article>strong,.experience-grid article>span,.experience-grid article>h3,.experience-grid article>strong,.dish-grid article>strong,.practitioner-grid article>strong,.practitioner-grid article>span,.news-grid article>*{margin-inline:18px}.listing-image,.room-photo,.product-image,.experience-photo,.dish-photo,.avatar-placeholder{height:180px;background:linear-gradient(145deg,color-mix(in srgb,${draft.brand.primary} 18%,white),color-mix(in srgb,${draft.brand.accent} 32%,white));position:relative}.listing-image span,.product-image span{position:absolute;top:12px;left:12px;background:#fff;padding:6px 8px;border-radius:999px;font-size:9px;font-weight:900}.menu-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.menu-grid article{display:flex;justify-content:space-between;gap:20px;padding:20px;border-bottom:1px solid #e2e7ed}.commerce-visual,.ticket-card{width:72%;aspect-ratio:1/1;border-radius:28px;background:linear-gradient(135deg,${draft.brand.primary},${draft.brand.accent});display:flex;flex-direction:column;align-items:center;justify-content:center}.commerce-visual strong,.ticket-card strong{font-size:54px}.promo-strip{background:${draft.brand.secondary};color:#fff;padding:12px 0}.promo-strip>.shell{display:flex;justify-content:space-between;gap:12px;font-size:10px;font-weight:900}.step-line,.timeline{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.step-line article,.timeline article{padding:22px;border:1px solid #e0e6ed;border-radius:${draft.brand.radius}px;background:#fff}.step-line span,.timeline span{font-size:10px;color:${draft.brand.primary};font-weight:900}.family-cta{padding:${draft.brand.sectionSpacing}px 0;background:${draft.brand.secondary};color:#fff}.family-cta h2{color:#fff}.family-cta-grid{display:grid;grid-template-columns:1fr .8fr;gap:44px;align-items:center}.contact-panel{padding:24px;border-radius:${draft.brand.radius}px;background:rgba(255,255,255,.08);display:grid;gap:12px}.contact-panel a,.contact-panel strong{color:#fff;text-decoration:none}footer{padding:30px 0;background:#070b15;color:#fff}footer>.shell{display:flex;justify-content:space-between;gap:20px}footer span{opacity:.65}@media(max-width:820px){.family-nav nav{display:none}.family-hero{padding:54px 0}.family-hero-grid,.family-cta-grid,.code-layout{grid-template-columns:1fr}.family-visual{min-height:300px}.feature-matrix,.api-grid,.practice-grid,.care-grid,.industrial-grid,.program-grid,.course-grid,.listing-grid,.residence-grid,.product-grid,.experience-grid,.dish-grid,.practitioner-grid,.news-grid,.pricing-grid{grid-template-columns:1fr}.portfolio-grid,.menu-grid{grid-template-columns:1fr}.metric-grid,.credential-grid,.impact-grid,.outcome-grid,.step-line,.timeline{grid-template-columns:1fr}.family-copy h1{font-size:48px}.promo-strip>.shell,footer>.shell{flex-direction:column}.shell{width:min(100% - 28px,${draft.brand.maxWidth}px)}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;animation:none!important;transition:none!important}}`;
}
