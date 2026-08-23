export type BusinessCategoryKey =
  | "professional-services"
  | "property"
  | "restaurant"
  | "retail"
  | "technology"
  | "security"
  | "education"
  | "healthcare"
  | "construction"
  | "events"
  | "institution";

export type PreviewDevice = "desktop" | "tablet" | "mobile";
export type SupabaseMode = "none" | "managed" | "external";

export type StudioBrand = {
  primary: string;
  secondary: string;
  accent: string;
  surface: string;
  text: string;
  logoUrl: string;
  logoText: string;
  faviconUrl: string;
  radius: number;
  fontFamily: "Inter" | "Manrope" | "Poppins" | "DM Sans";
  buttonStyle: "soft" | "pill" | "square";
  cardStyle: "bordered" | "elevated" | "glass";
  navStyle: "clean" | "glass" | "dark";
  heroStyle: "split" | "centered" | "minimal";
  maxWidth: number;
  sectionSpacing: number;
};

export type StudioContact = {
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  website: string;
  instagram: string;
  facebook: string;
  linkedin: string;
};

export type StudioSeo = {
  title: string;
  description: string;
  keywords: string;
  ogImageUrl: string;
  indexable: boolean;
};

export type StudioSite = {
  headline: string;
  tagline: string;
  description: string;
  primaryCta: string;
  secondaryCta: string;
  location: string;
  announcement: string;
  heroImageUrl: string;
  services: string[];
  highlights: string[];
  process: string[];
  testimonials: string[];
  stats: Array<{ value: string; label: string }>;
  gallery: string[];
  showAnnouncement: boolean;
  showServices: boolean;
  showHighlights: boolean;
  showProcess: boolean;
  showTestimonials: boolean;
  showStats: boolean;
  showGallery: boolean;
  showContact: boolean;
};

export type StudioIntegrations = {
  supabase: {
    mode: SupabaseMode;
    projectRef: string;
    url: string;
    publishableKey: string;
    managedFormEndpoint: string;
    publicSubmitToken: string;
  };
  vercel: {
    projectName: string;
    teamId: string;
    projectId: string;
    deploymentUrl: string;
    production: boolean;
  };
  lovable: {
    projectId: string;
    editorUrl: string;
    previewUrl: string;
  };
};

export type WebsiteStudioDraft = {
  id?: string;
  projectName: string;
  businessName: string;
  slug: string;
  category: BusinessCategoryKey;
  templateKey: "reskonnect-premium";
  status: "draft" | "review" | "ready" | "published" | "archived";
  brand: StudioBrand;
  site: StudioSite;
  seo: StudioSeo;
  contact: StudioContact;
  github: {
    owner: string;
    repository: string;
    branch: string;
    deploymentUrl: string;
  };
  integrations: StudioIntegrations;
};

export type BusinessCategoryPreset = {
  key: BusinessCategoryKey;
  label: string;
  description: string;
  headline: string;
  tagline: string;
  services: string[];
  highlights: string[];
  process: string[];
};

export const businessCategories: BusinessCategoryPreset[] = [
  { key: "professional-services", label: "Professional services", description: "Consulting, legal, accounting, agencies and specialist firms.", headline: "Trusted expertise. Clear outcomes.", tagline: "Professional service built around the result your clients actually need.", services: ["Consultation", "Advisory", "Project delivery", "Compliance support", "Ongoing support", "Custom solutions"], highlights: ["Clear scope", "Professional delivery", "Direct communication"], process: ["Understand the brief", "Build the right solution", "Deliver and support"] },
  { key: "property", label: "Property & accommodation", description: "Real estate, rentals, student living, developments and property services.", headline: "Find the right space with confidence.", tagline: "Premium property discovery, trusted information and a simpler path from enquiry to move-in.", services: ["Property listings", "Viewings", "Applications", "Tenant support", "Property management", "Landlord services"], highlights: ["Verified options", "Responsive enquiries", "Local support"], process: ["Explore options", "Compare and enquire", "Move forward with support"] },
  { key: "restaurant", label: "Restaurant & food", description: "Restaurants, cafés, catering, takeaways and food brands.", headline: "Food worth coming back for.", tagline: "Make discovery, ordering and booking feel as good as the experience itself.", services: ["Signature menu", "Collections", "Catering", "Reservations", "Delivery", "Private events"], highlights: ["Freshly prepared", "Easy ordering", "Great service"], process: ["Choose your favourites", "Order or reserve", "Enjoy the experience"] },
  { key: "retail", label: "Retail & ecommerce", description: "Stores, product brands, distributors and online retail.", headline: "Products people want. Shopping that feels effortless.", tagline: "A premium storefront designed to convert attention into confident purchases.", services: ["Featured products", "New arrivals", "Collections", "Delivery", "Customer support", "Wholesale enquiries"], highlights: ["Curated products", "Secure buying", "Reliable fulfilment"], process: ["Discover", "Choose", "Checkout and receive"] },
  { key: "technology", label: "Technology & startup", description: "SaaS, apps, digital products, AI and technology companies.", headline: "Technology built to solve a real problem.", tagline: "Show the problem, the product, the proof and the next step without burying visitors in jargon.", services: ["Product platform", "Integrations", "Automation", "Implementation", "Support", "Enterprise solutions"], highlights: ["Built for scale", "Secure by design", "Measurable outcomes"], process: ["Understand the need", "Configure the solution", "Launch and improve"] },
  { key: "security", label: "Security & safety", description: "Security companies, safety services, guarding and monitoring.", headline: "Protection built around your real risk.", tagline: "Professional security services, clear response pathways and accountable support.", services: ["Guarding", "Risk assessments", "Monitoring", "Event security", "Access control", "Security consulting"], highlights: ["Professional teams", "Clear escalation", "Accountable service"], process: ["Assess the risk", "Build the protection plan", "Deploy and monitor"] },
  { key: "education", label: "Education & training", description: "Schools, academies, training providers and learning programmes.", headline: "Learning that creates a path forward.", tagline: "Help students understand programmes, outcomes, admissions and the next step in one clear experience.", services: ["Programmes", "Admissions", "Short courses", "Student support", "Skills training", "Corporate learning"], highlights: ["Practical learning", "Clear admissions", "Student support"], process: ["Explore programmes", "Apply or enquire", "Learn and progress"] },
  { key: "healthcare", label: "Healthcare & wellness", description: "Clinics, practices, wellness providers and healthcare services.", headline: "Professional care made easier to access.", tagline: "A calm, credible digital experience for services, bookings, information and patient contact.", services: ["Consultations", "Appointments", "Preventative care", "Wellness services", "Patient support", "Corporate wellness"], highlights: ["Professional care", "Easy bookings", "Clear information"], process: ["Choose a service", "Book or contact", "Receive care"] },
  { key: "construction", label: "Construction & industrial", description: "Construction, engineering, maintenance, logistics and industrial services.", headline: "Built to deliver. Managed to last.", tagline: "Present capability, projects, compliance and service scope with the confidence serious clients expect.", services: ["Construction", "Project management", "Maintenance", "Procurement", "Engineering support", "Commercial projects"], highlights: ["Qualified teams", "Project discipline", "Safety focused"], process: ["Scope the work", "Plan and execute", "Handover and support"] },
  { key: "events", label: "Events & entertainment", description: "Events, activations, entertainment companies and creative experiences.", headline: "Create the kind of experience people remember.", tagline: "Show the concept, programme, partners, tickets and energy before your audience even arrives.", services: ["Events", "Activations", "Production", "Ticketing", "Partnerships", "Private bookings"], highlights: ["Strong concepts", "Professional production", "Audience focused"], process: ["Choose the experience", "Book or partner", "Show up and enjoy"] },
  { key: "institution", label: "Institution & nonprofit", description: "Institutions, associations, NGOs, public programmes and community organisations.", headline: "Purpose, programmes and impact in one clear place.", tagline: "Make your mandate, services, programmes and public value easy to understand and access.", services: ["Programmes", "Member services", "Public information", "Applications", "Partnerships", "Resources"], highlights: ["Clear mandate", "Accessible services", "Transparent impact"], process: ["Understand the programme", "Access the right service", "Stay connected"] },
];

const defaultBrand: StudioBrand = {
  primary: "#1737d1", secondary: "#071449", accent: "#03a995", surface: "#f7f9fc", text: "#0b1220",
  logoUrl: "", logoText: "YOUR BUSINESS", faviconUrl: "", radius: 22, fontFamily: "Inter", buttonStyle: "soft",
  cardStyle: "elevated", navStyle: "clean", heroStyle: "split", maxWidth: 1160, sectionSpacing: 86,
};

export function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 72) || "new-business";
}

export function getCategoryPreset(category: BusinessCategoryKey): BusinessCategoryPreset {
  return businessCategories.find((item) => item.key === category) ?? businessCategories[0];
}

export function createWebsiteDraft(businessName = "Your Business", category: BusinessCategoryKey = "professional-services"): WebsiteStudioDraft {
  const preset = getCategoryPreset(category);
  const name = businessName.trim() || "Your Business";
  const slug = slugify(name);
  return {
    projectName: `${name} Website`, businessName: name, slug, category, templateKey: "reskonnect-premium", status: "draft",
    brand: { ...defaultBrand, logoText: name.toUpperCase() },
    site: {
      headline: preset.headline, tagline: preset.tagline, description: preset.description, primaryCta: "Get started", secondaryCta: "Explore services",
      location: "South Africa", announcement: "Welcome — discover what we can do for you.", heroImageUrl: "",
      services: [...preset.services], highlights: [...preset.highlights], process: [...preset.process],
      testimonials: ["Professional, responsive and easy to work with.", "The experience was clear from first contact to delivery."],
      stats: [{ value: "100%", label: "Focused delivery" }, { value: "24h", label: "Response target" }, { value: "SA", label: "Based in South Africa" }],
      gallery: [], showAnnouncement: false, showServices: true, showHighlights: true, showProcess: true, showTestimonials: true,
      showStats: true, showGallery: false, showContact: true,
    },
    seo: { title: `${name} | Official Website`, description: `${preset.tagline} Learn more about ${name}, our services and how to get in touch.`, keywords: `${preset.label.toLowerCase()}, ${name.toLowerCase()}, south africa`, ogImageUrl: "", indexable: true },
    contact: { email: "hello@example.co.za", phone: "+27 00 000 0000", whatsapp: "+27 00 000 0000", address: "South Africa", website: "", instagram: "", facebook: "", linkedin: "" },
    github: { owner: "entertainmentinnanetclout-cpu", repository: slug, branch: "main", deploymentUrl: "" },
    integrations: {
      supabase: { mode: "none", projectRef: "", url: "", publishableKey: "", managedFormEndpoint: "https://clawrgsnnmzmcxutiodg.supabase.co/functions/v1/website-studio-form-submit", publicSubmitToken: "" },
      vercel: { projectName: slug, teamId: "", projectId: "", deploymentUrl: "", production: true },
      lovable: { projectId: "", editorUrl: "", previewUrl: "" },
    },
  };
}

export function normalizeWebsiteDraft(input: Partial<WebsiteStudioDraft> | null | undefined): WebsiteStudioDraft {
  const base = createWebsiteDraft(input?.businessName || "Your Business", input?.category || "professional-services");
  return {
    ...base,
    ...(input || {}),
    brand: { ...base.brand, ...(input?.brand || {}) },
    site: { ...base.site, ...(input?.site || {}), stats: input?.site?.stats || base.site.stats, gallery: input?.site?.gallery || base.site.gallery },
    seo: { ...base.seo, ...(input?.seo || {}) },
    contact: { ...base.contact, ...(input?.contact || {}) },
    github: { ...base.github, ...(input?.github || {}) },
    integrations: {
      supabase: { ...base.integrations.supabase, ...(input?.integrations?.supabase || {}) },
      vercel: { ...base.integrations.vercel, ...(input?.integrations?.vercel || {}) },
      lovable: { ...base.integrations.lovable, ...(input?.integrations?.lovable || {}) },
    },
  };
}

export function applyCategoryPreset(current: WebsiteStudioDraft, category: BusinessCategoryKey): WebsiteStudioDraft {
  const preset = getCategoryPreset(category);
  return normalizeWebsiteDraft({
    ...current, category,
    site: { ...current.site, headline: preset.headline, tagline: preset.tagline, description: preset.description, services: [...preset.services], highlights: [...preset.highlights], process: [...preset.process] },
    seo: { ...current.seo, description: `${preset.tagline} Learn more about ${current.businessName}, our services and how to get in touch.`, keywords: `${preset.label.toLowerCase()}, ${current.businessName.toLowerCase()}, south africa` },
  });
}

function esc(value: string): string {
  return String(value || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

export function generateWebsiteHtml(raw: WebsiteStudioDraft): string {
  const draft = normalizeWebsiteDraft(raw);
  const { brand, site, businessName, seo, contact } = draft;
  const radius = brand.buttonStyle === "pill" ? 999 : brand.buttonStyle === "square" ? 5 : 12;
  const cardShadow = brand.cardStyle === "elevated" ? "0 18px 46px rgba(7,20,73,.09)" : "none";
  const navBackground = brand.navStyle === "dark" ? brand.secondary : brand.navStyle === "glass" ? "rgba(255,255,255,.82)" : "#fff";
  const navColor = brand.navStyle === "dark" ? "#fff" : brand.secondary;
  const logo = brand.logoUrl ? `<img src="${esc(brand.logoUrl)}" alt="${esc(businessName)}" />` : `<strong>${esc(brand.logoText || businessName)}</strong>`;
  const services = site.services.filter(Boolean).map((item) => `<article>${esc(item)}</article>`).join("");
  const highlights = site.highlights.filter(Boolean).map((item) => `<article>${esc(item)}</article>`).join("");
  const process = site.process.filter(Boolean).map((item, index) => `<article><span>0${index + 1}</span><strong>${esc(item)}</strong></article>`).join("");
  const testimonials = site.testimonials.filter(Boolean).map((item) => `<blockquote>“${esc(item)}”</blockquote>`).join("");
  const stats = site.stats.map((item) => `<article><strong>${esc(item.value)}</strong><span>${esc(item.label)}</span></article>`).join("");
  const gallery = site.gallery.filter(Boolean).map((url) => `<img src="${esc(url)}" alt="${esc(businessName)}" loading="lazy" />`).join("");
  const heroVisual = site.heroImageUrl ? `<div class="hero-photo"><img src="${esc(site.heroImageUrl)}" alt="${esc(businessName)}" /></div>` : `<aside class="hero-card"><span>WELCOME TO ${esc(businessName).toUpperCase()}</span><strong>${esc(site.description)}</strong><p>Premium digital presence powered by Start To Up Website Studio.</p></aside>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${esc(seo.title)}</title><meta name="description" content="${esc(seo.description)}"/><meta name="keywords" content="${esc(seo.keywords)}"/>${seo.indexable ? "" : '<meta name="robots" content="noindex,nofollow"/>'}${seo.ogImageUrl ? `<meta property="og:image" content="${esc(seo.ogImageUrl)}"/>` : ""}${brand.faviconUrl ? `<link rel="icon" href="${esc(brand.faviconUrl)}"/>` : ""}<style>
:root{--primary:${brand.primary};--secondary:${brand.secondary};--accent:${brand.accent};--surface:${brand.surface};--text:${brand.text};--radius:${brand.radius}px;--button-radius:${radius}px;--max:${brand.maxWidth}px;--space:${brand.sectionSpacing}px}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;font-family:"${brand.fontFamily}",Inter,system-ui,sans-serif;color:var(--text);background:#fff}.shell{width:min(var(--max),calc(100% - 40px));margin:auto}.announcement{padding:9px 20px;text-align:center;background:var(--secondary);color:#fff;font-size:12px;font-weight:700}.nav{min-height:76px;display:flex;align-items:center;justify-content:space-between;gap:20px;background:${navBackground};color:${navColor};${brand.navStyle === "glass" ? "position:sticky;top:0;z-index:20;backdrop-filter:blur(16px);" : ""}}.nav-wrap{background:${navBackground}}.brand{display:flex;align-items:center;color:inherit;text-decoration:none}.brand img{max-width:190px;max-height:52px}.brand strong{font-size:18px;letter-spacing:.03em}.nav-links{display:flex;gap:24px}.nav a{color:inherit;text-decoration:none;font-size:14px;font-weight:700}.button{display:inline-flex;min-height:44px;padding:0 18px;align-items:center;justify-content:center;border-radius:var(--button-radius);font-weight:800;text-decoration:none}.primary{background:linear-gradient(120deg,var(--primary),var(--accent));color:#fff}.secondary{border:1px solid #dce3ee;color:var(--secondary);background:#fff}.hero{padding:88px 0 82px;background:radial-gradient(circle at 85% 10%,color-mix(in srgb,var(--accent) 18%,transparent),transparent 32%),linear-gradient(180deg,#fbfcff,var(--surface))}.hero-grid{display:grid;grid-template-columns:1.05fr .95fr;gap:58px;align-items:center}.hero.centered .hero-grid{display:block;text-align:center;max-width:900px}.hero.minimal .hero-grid{grid-template-columns:1fr}.hero.centered .hero-copy,.hero.minimal .hero-copy{margin:auto;max-width:850px}.hero.centered .hero-actions,.hero.minimal .hero-actions{justify-content:center}.hero.centered .hero-card,.hero.minimal .hero-card,.hero.centered .hero-photo,.hero.minimal .hero-photo{display:none}.kicker{display:inline-flex;padding:8px 11px;border-radius:999px;background:color-mix(in srgb,var(--primary) 9%,white);color:var(--primary);font-size:11px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}.hero h1{font-size:clamp(44px,6vw,78px);line-height:.98;letter-spacing:-.055em;color:var(--secondary);margin:18px 0}.hero p{font-size:18px;line-height:1.7;color:#5d6779}.hero-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:26px}.hero-card,.hero-photo{min-height:380px;border-radius:calc(var(--radius) + 8px);overflow:hidden;box-shadow:0 30px 80px rgba(7,20,73,.18)}.hero-card{padding:34px;display:flex;flex-direction:column;justify-content:flex-end;background:linear-gradient(145deg,var(--secondary),color-mix(in srgb,var(--primary) 68%,#061235));color:#fff}.hero-card span{font-size:10px;letter-spacing:.14em;font-weight:900;opacity:.62}.hero-card strong{font-size:28px;line-height:1.18;margin:14px 0}.hero-card p{font-size:14px;color:rgba(255,255,255,.72)}.hero-photo img{width:100%;height:100%;min-height:380px;object-fit:cover}.trust,.stats{border-bottom:1px solid #edf0f5}.trust-grid,.stats-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:18px 0}.trust-grid article,.stats-grid article{padding:15px;border:1px solid #e6eaf0;border-radius:var(--radius);background:#fff;box-shadow:${cardShadow};text-align:center}.stats-grid strong{display:block;color:var(--secondary);font-size:25px}.stats-grid span{font-size:11px;color:#748099}.section{padding:var(--space) 0}.section.alt{background:var(--surface)}.section-head{max-width:740px;margin-bottom:34px}.section-head span{font-size:11px;letter-spacing:.13em;font-weight:900;color:var(--primary)}.section-head h2{font-size:clamp(34px,4vw,52px);line-height:1.04;letter-spacing:-.04em;color:var(--secondary);margin:10px 0}.section-head p{color:#667287;line-height:1.7}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.cards article,.process article,blockquote{padding:24px;border-radius:var(--radius);border:1px solid #e3e8f0;background:${brand.cardStyle === "glass" ? "rgba(255,255,255,.75)" : "#fff"};box-shadow:${cardShadow};font-weight:800;color:var(--secondary)}.process{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.process article{background:var(--secondary);color:#fff}.process span{display:block;font-size:11px;color:var(--accent);margin-bottom:24px}.testimonials{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}.testimonials blockquote{margin:0;font-size:18px;line-height:1.55}.gallery{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.gallery img{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:var(--radius)}.contact{display:grid;grid-template-columns:1fr 1fr;gap:34px;padding:42px;border-radius:calc(var(--radius) + 8px);background:linear-gradient(135deg,var(--secondary),color-mix(in srgb,var(--primary) 72%,#071449));color:#fff}.contact h2{font-size:clamp(32px,4vw,50px);margin:0 0 12px}.contact-list{display:grid;gap:10px}.contact-list a,.contact-list div{padding:14px 16px;border:1px solid rgba(255,255,255,.16);border-radius:14px;color:#fff;text-decoration:none;background:rgba(255,255,255,.06)}footer{padding:34px 0;color:#738096;font-size:12px}.footer-inner{display:flex;justify-content:space-between;gap:20px}
@media(max-width:800px){.shell{width:min(100% - 28px,var(--max))}.nav-links{display:none}.hero{padding:54px 0}.hero-grid,.contact{grid-template-columns:1fr}.hero-grid{gap:28px}.hero h1{font-size:clamp(40px,13vw,64px)}.cards{grid-template-columns:1fr 1fr}.process,.testimonials,.gallery,.trust-grid,.stats-grid{grid-template-columns:1fr}.section{padding:58px 0}.footer-inner{flex-direction:column}.contact{padding:28px}}
@media(max-width:520px){.cards{grid-template-columns:1fr}.hero-card,.hero-photo,.hero-photo img{min-height:300px}.hero p{font-size:16px}}
</style></head><body>${site.showAnnouncement ? `<div class="announcement">${esc(site.announcement)}</div>` : ""}<div class="nav-wrap"><header class="shell nav"><a class="brand" href="#top">${logo}</a><nav class="nav-links"><a href="#services">Services</a><a href="#about">About</a><a href="#contact">Contact</a></nav><a class="button primary" href="#contact">${esc(site.primaryCta)}</a></header></div><main id="top"><section class="hero ${brand.heroStyle}"><div class="shell hero-grid"><div class="hero-copy"><span class="kicker">${esc(businessName)} · ${esc(site.location)}</span><h1>${esc(site.headline)}</h1><p>${esc(site.tagline)}</p><div class="hero-actions"><a class="button primary" href="#contact">${esc(site.primaryCta)}</a><a class="button secondary" href="#services">${esc(site.secondaryCta)}</a></div></div>${heroVisual}</div></section>${site.showHighlights ? `<section class="trust"><div class="shell trust-grid">${highlights}</div></section>` : ""}${site.showStats ? `<section class="stats"><div class="shell stats-grid">${stats}</div></section>` : ""}${site.showServices ? `<section id="services" class="section"><div class="shell"><div class="section-head"><span>WHAT WE DO</span><h2>Services designed around what your customer needs next.</h2><p>${esc(site.description)}</p></div><div class="cards">${services}</div></div></section>` : ""}<section id="about" class="section alt"><div class="shell"><div class="section-head"><span>ABOUT ${esc(businessName).toUpperCase()}</span><h2>${esc(site.headline)}</h2><p>${esc(site.description)}</p></div></div></section>${site.showProcess ? `<section class="section"><div class="shell"><div class="section-head"><span>HOW IT WORKS</span><h2>A clear route from interest to outcome.</h2></div><div class="process">${process}</div></div></section>` : ""}${site.showGallery && gallery ? `<section class="section alt"><div class="shell"><div class="section-head"><span>GALLERY</span><h2>See the work and experience.</h2></div><div class="gallery">${gallery}</div></div></section>` : ""}${site.showTestimonials ? `<section class="section alt"><div class="shell"><div class="section-head"><span>CLIENT EXPERIENCE</span><h2>Trust is built in the delivery.</h2></div><div class="testimonials">${testimonials}</div></div></section>` : ""}${site.showContact ? `<section id="contact" class="section"><div class="shell contact"><div><span class="kicker">LET'S TALK</span><h2>Ready to take the next step?</h2><p>Contact ${esc(businessName)} and let us help you move forward.</p></div><div class="contact-list"><a href="mailto:${esc(contact.email)}">${esc(contact.email)}</a><a href="tel:${esc(contact.phone.replace(/\s/g, ""))}">${esc(contact.phone)}</a><div>${esc(contact.address)}</div></div></div></section>` : ""}</main><footer><div class="shell footer-inner"><strong>${esc(businessName)}</strong><span>Website powered by Start To Up Website Studio.</span></div></footer></body></html>`;
}

export function buildPublicationManifest(draft: WebsiteStudioDraft) {
  return {
    generator: "Start To Up Website Studio V2",
    template: draft.templateKey,
    template_source: "https://github.com/entertainmentinnanetclout-cpu/resi-seek-app",
    generated_at: new Date().toISOString(),
    business: { name: draft.businessName, category: draft.category, slug: draft.slug },
    integrations: { supabase: draft.integrations.supabase.mode, vercel: Boolean(draft.integrations.vercel.projectId || draft.integrations.vercel.projectName), lovable: Boolean(draft.integrations.lovable.projectId || draft.integrations.lovable.editorUrl), github: Boolean(draft.github.owner && draft.github.repository) },
    site_blueprint: draft,
  };
}
