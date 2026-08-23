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

export type StudioBrand = {
  primary: string;
  secondary: string;
  accent: string;
  surface: string;
  text: string;
  logoUrl: string;
  logoText: string;
  radius: number;
};

export type StudioContact = {
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  website: string;
};

export type StudioSeo = {
  title: string;
  description: string;
  keywords: string;
};

export type StudioSite = {
  headline: string;
  tagline: string;
  description: string;
  primaryCta: string;
  secondaryCta: string;
  location: string;
  services: string[];
  highlights: string[];
  process: string[];
  testimonials: string[];
  showServices: boolean;
  showHighlights: boolean;
  showProcess: boolean;
  showTestimonials: boolean;
  showContact: boolean;
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
  {
    key: "professional-services",
    label: "Professional services",
    description: "Consulting, legal, accounting, agencies and specialist firms.",
    headline: "Trusted expertise. Clear outcomes.",
    tagline: "Professional service built around the result your clients actually need.",
    services: ["Consultation", "Advisory", "Project delivery", "Compliance support", "Ongoing support", "Custom solutions"],
    highlights: ["Clear scope", "Professional delivery", "Direct communication"],
    process: ["Understand the brief", "Build the right solution", "Deliver and support"],
  },
  {
    key: "property",
    label: "Property & accommodation",
    description: "Real estate, rentals, student living, developments and property services.",
    headline: "Find the right space with confidence.",
    tagline: "Premium property discovery, trusted information and a simpler path from enquiry to move-in.",
    services: ["Property listings", "Viewings", "Applications", "Tenant support", "Property management", "Landlord services"],
    highlights: ["Verified options", "Responsive enquiries", "Local support"],
    process: ["Explore options", "Compare and enquire", "Move forward with support"],
  },
  {
    key: "restaurant",
    label: "Restaurant & food",
    description: "Restaurants, cafés, catering, takeaways and food brands.",
    headline: "Food worth coming back for.",
    tagline: "Make discovery, ordering and booking feel as good as the experience itself.",
    services: ["Signature menu", "Collections", "Catering", "Reservations", "Delivery", "Private events"],
    highlights: ["Freshly prepared", "Easy ordering", "Great service"],
    process: ["Choose your favourites", "Order or reserve", "Enjoy the experience"],
  },
  {
    key: "retail",
    label: "Retail & ecommerce",
    description: "Stores, product brands, distributors and online retail.",
    headline: "Products people want. Shopping that feels effortless.",
    tagline: "A premium storefront designed to convert attention into confident purchases.",
    services: ["Featured products", "New arrivals", "Collections", "Delivery", "Customer support", "Wholesale enquiries"],
    highlights: ["Curated products", "Secure buying", "Reliable fulfilment"],
    process: ["Discover", "Choose", "Checkout and receive"],
  },
  {
    key: "technology",
    label: "Technology & startup",
    description: "SaaS, apps, digital products, AI and technology companies.",
    headline: "Technology built to solve a real problem.",
    tagline: "Show the problem, the product, the proof and the next step without burying visitors in jargon.",
    services: ["Product platform", "Integrations", "Automation", "Implementation", "Support", "Enterprise solutions"],
    highlights: ["Built for scale", "Secure by design", "Measurable outcomes"],
    process: ["Understand the need", "Configure the solution", "Launch and improve"],
  },
  {
    key: "security",
    label: "Security & safety",
    description: "Security companies, safety services, guarding and monitoring.",
    headline: "Protection built around your real risk.",
    tagline: "Professional security services, clear response pathways and accountable support.",
    services: ["Guarding", "Risk assessments", "Monitoring", "Event security", "Access control", "Security consulting"],
    highlights: ["Professional teams", "Clear escalation", "Accountable service"],
    process: ["Assess the risk", "Build the protection plan", "Deploy and monitor"],
  },
  {
    key: "education",
    label: "Education & training",
    description: "Schools, academies, training providers and learning programmes.",
    headline: "Learning that creates a path forward.",
    tagline: "Help students understand programmes, outcomes, admissions and the next step in one clear experience.",
    services: ["Programmes", "Admissions", "Short courses", "Student support", "Skills training", "Corporate learning"],
    highlights: ["Practical learning", "Clear admissions", "Student support"],
    process: ["Explore programmes", "Apply or enquire", "Learn and progress"],
  },
  {
    key: "healthcare",
    label: "Healthcare & wellness",
    description: "Clinics, practices, wellness providers and healthcare services.",
    headline: "Professional care made easier to access.",
    tagline: "A calm, credible digital experience for services, bookings, information and patient contact.",
    services: ["Consultations", "Appointments", "Preventative care", "Wellness services", "Patient support", "Corporate wellness"],
    highlights: ["Professional care", "Easy bookings", "Clear information"],
    process: ["Choose a service", "Book or contact", "Receive care"],
  },
  {
    key: "construction",
    label: "Construction & industrial",
    description: "Construction, engineering, maintenance, logistics and industrial services.",
    headline: "Built to deliver. Managed to last.",
    tagline: "Present capability, projects, compliance and service scope with the confidence serious clients expect.",
    services: ["Construction", "Project management", "Maintenance", "Procurement", "Engineering support", "Commercial projects"],
    highlights: ["Qualified teams", "Project discipline", "Safety focused"],
    process: ["Scope the work", "Plan and execute", "Handover and support"],
  },
  {
    key: "events",
    label: "Events & entertainment",
    description: "Events, activations, entertainment companies and creative experiences.",
    headline: "Create the kind of experience people remember.",
    tagline: "Show the concept, programme, partners, tickets and energy before your audience even arrives.",
    services: ["Events", "Activations", "Production", "Ticketing", "Partnerships", "Private bookings"],
    highlights: ["Strong concepts", "Professional production", "Audience focused"],
    process: ["Choose the experience", "Book or partner", "Show up and enjoy"],
  },
  {
    key: "institution",
    label: "Institution & nonprofit",
    description: "Institutions, associations, NGOs, public programmes and community organisations.",
    headline: "Purpose, programmes and impact in one clear place.",
    tagline: "Make your mandate, services, programmes and public value easy to understand and access.",
    services: ["Programmes", "Member services", "Public information", "Applications", "Partnerships", "Resources"],
    highlights: ["Clear mandate", "Accessible services", "Transparent impact"],
    process: ["Understand the programme", "Access the right service", "Stay connected"],
  },
];

const defaultBrand: StudioBrand = {
  primary: "#1737d1",
  secondary: "#071449",
  accent: "#03a995",
  surface: "#f7f9fc",
  text: "#0b1220",
  logoUrl: "",
  logoText: "YOUR BUSINESS",
  radius: 22,
};

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72) || "new-business";
}

export function getCategoryPreset(category: BusinessCategoryKey): BusinessCategoryPreset {
  return businessCategories.find((item) => item.key === category) ?? businessCategories[0];
}

export function createWebsiteDraft(
  businessName = "Your Business",
  category: BusinessCategoryKey = "professional-services",
): WebsiteStudioDraft {
  const preset = getCategoryPreset(category);
  const name = businessName.trim() || "Your Business";
  return {
    projectName: `${name} Website`,
    businessName: name,
    slug: slugify(name),
    category,
    templateKey: "reskonnect-premium",
    status: "draft",
    brand: { ...defaultBrand, logoText: name.toUpperCase() },
    site: {
      headline: preset.headline,
      tagline: preset.tagline,
      description: preset.description,
      primaryCta: "Get started",
      secondaryCta: "Explore services",
      location: "South Africa",
      services: [...preset.services],
      highlights: [...preset.highlights],
      process: [...preset.process],
      testimonials: [
        "Professional, responsive and easy to work with.",
        "The experience was clear from first contact to delivery.",
      ],
      showServices: true,
      showHighlights: true,
      showProcess: true,
      showTestimonials: true,
      showContact: true,
    },
    seo: {
      title: `${name} | Official Website`,
      description: `${preset.tagline} Learn more about ${name}, our services and how to get in touch.`,
      keywords: `${preset.label.toLowerCase()}, ${name.toLowerCase()}, south africa`,
    },
    contact: {
      email: "hello@example.co.za",
      phone: "+27 00 000 0000",
      whatsapp: "+27 00 000 0000",
      address: "South Africa",
      website: "",
    },
    github: {
      owner: "entertainmentinnanetclout-cpu",
      repository: slugify(name),
      branch: "main",
      deploymentUrl: "",
    },
  };
}

export function applyCategoryPreset(
  current: WebsiteStudioDraft,
  category: BusinessCategoryKey,
): WebsiteStudioDraft {
  const preset = getCategoryPreset(category);
  return {
    ...current,
    category,
    site: {
      ...current.site,
      headline: preset.headline,
      tagline: preset.tagline,
      description: preset.description,
      services: [...preset.services],
      highlights: [...preset.highlights],
      process: [...preset.process],
    },
    seo: {
      ...current.seo,
      description: `${preset.tagline} Learn more about ${current.businessName}, our services and how to get in touch.`,
      keywords: `${preset.label.toLowerCase()}, ${current.businessName.toLowerCase()}, south africa`,
    },
  };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function list(items: string[], className: string): string {
  return items.filter(Boolean).map((item) => `<article class="${className}">${escapeHtml(item)}</article>`).join("");
}

export function generateWebsiteHtml(draft: WebsiteStudioDraft): string {
  const { brand, site, businessName, seo, contact } = draft;
  const logo = brand.logoUrl
    ? `<img src="${escapeHtml(brand.logoUrl)}" alt="${escapeHtml(businessName)}" />`
    : `<strong>${escapeHtml(brand.logoText || businessName)}</strong>`;
  const services = list(site.services, "service-card");
  const highlights = list(site.highlights, "highlight-card");
  const process = site.process.filter(Boolean).map((item, index) => `<article class="process-card"><span>0${index + 1}</span><strong>${escapeHtml(item)}</strong></article>`).join("");
  const testimonials = site.testimonials.filter(Boolean).map((item) => `<blockquote>“${escapeHtml(item)}”</blockquote>`).join("");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(seo.title)}</title>
<meta name="description" content="${escapeHtml(seo.description)}" />
<meta name="keywords" content="${escapeHtml(seo.keywords)}" />
<style>
:root{--primary:${brand.primary};--secondary:${brand.secondary};--accent:${brand.accent};--surface:${brand.surface};--text:${brand.text};--radius:${brand.radius}px}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;font-family:Inter,Manrope,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:var(--text);background:#fff}.shell{width:min(1160px,calc(100% - 40px));margin:auto}.nav{height:78px;display:flex;align-items:center;justify-content:space-between;gap:24px}.brand{display:flex;align-items:center;min-width:0}.brand img{display:block;max-width:180px;max-height:52px;object-fit:contain}.brand strong{font-size:18px;letter-spacing:.04em;color:var(--secondary)}.nav-links{display:flex;gap:24px;font-size:14px;font-weight:750;color:#596477}.nav a{text-decoration:none;color:inherit}.button{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 18px;border-radius:12px;font-weight:800;text-decoration:none}.primary{background:linear-gradient(120deg,var(--primary),var(--accent));color:#fff}.secondary{border:1px solid #dce3ee;color:var(--secondary);background:#fff}.hero{padding:88px 0 82px;background:radial-gradient(circle at 85% 10%,color-mix(in srgb,var(--accent) 18%,transparent),transparent 32%),linear-gradient(180deg,#fbfcff,var(--surface))}.hero-grid{display:grid;grid-template-columns:1.05fr .95fr;gap:60px;align-items:center}.kicker{display:inline-flex;padding:8px 11px;border-radius:999px;background:color-mix(in srgb,var(--primary) 8%,white);color:var(--primary);font-size:11px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}.hero h1{font-size:clamp(44px,6vw,78px);line-height:.98;letter-spacing:-.055em;color:var(--secondary);margin:18px 0}.hero p{font-size:18px;line-height:1.7;color:#5d6779;max-width:650px}.hero-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:26px}.hero-card{padding:34px;border-radius:calc(var(--radius) + 8px);background:linear-gradient(145deg,var(--secondary),color-mix(in srgb,var(--primary) 68%,#061235));color:#fff;box-shadow:0 30px 80px rgba(7,20,73,.2)}.hero-card span{font-size:11px;letter-spacing:.15em;font-weight:900;opacity:.65}.hero-card strong{display:block;font-size:30px;line-height:1.15;margin:12px 0}.hero-card p{font-size:14px;color:rgba(255,255,255,.72)}.trust{padding:18px 0;border-bottom:1px solid #edf0f5}.trust-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.highlight-card{padding:14px 16px;border-radius:14px;background:#fff;border:1px solid #e7ebf2;font-size:13px;font-weight:800;text-align:center;color:#40506a}.section{padding:86px 0}.section.alt{background:var(--surface)}.section-head{max-width:720px;margin-bottom:34px}.section-head span{font-size:11px;letter-spacing:.14em;font-weight:900;color:var(--primary)}.section-head h2{font-size:clamp(34px,4vw,52px);line-height:1.05;letter-spacing:-.04em;color:var(--secondary);margin:10px 0}.section-head p{color:#667287;line-height:1.7}.services{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.service-card{padding:24px;border-radius:var(--radius);border:1px solid #e3e8f0;background:#fff;min-height:128px;font-weight:850;color:var(--secondary);box-shadow:0 10px 30px rgba(7,20,73,.05)}.process{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.process-card{padding:24px;border-radius:var(--radius);background:var(--secondary);color:#fff}.process-card span{display:block;color:color-mix(in srgb,var(--accent) 80%,white);font-size:11px;font-weight:900;margin-bottom:26px}.process-card strong{font-size:18px}.testimonials{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}.testimonials blockquote{margin:0;padding:26px;border-radius:var(--radius);border:1px solid #e4e8ef;background:#fff;font-size:18px;line-height:1.55;color:#34425a}.contact{display:grid;grid-template-columns:1fr 1fr;gap:36px;align-items:center;padding:42px;border-radius:calc(var(--radius) + 8px);background:linear-gradient(135deg,var(--secondary),color-mix(in srgb,var(--primary) 72%,#071449));color:#fff}.contact h2{font-size:clamp(32px,4vw,50px);margin:0 0 12px}.contact p{color:rgba(255,255,255,.72);line-height:1.65}.contact-list{display:grid;gap:10px}.contact-list a,.contact-list div{padding:14px 16px;border:1px solid rgba(255,255,255,.15);border-radius:14px;color:#fff;text-decoration:none;background:rgba(255,255,255,.06)}footer{padding:34px 0;color:#738096;font-size:12px}.footer-inner{display:flex;justify-content:space-between;gap:24px;align-items:center}.footer-brand{font-weight:900;color:var(--secondary)}
@media(max-width:800px){.shell{width:min(100% - 28px,1160px)}.nav-links{display:none}.nav{height:68px}.hero{padding:54px 0}.hero-grid,.contact{grid-template-columns:1fr}.hero-grid{gap:28px}.hero h1{font-size:clamp(40px,13vw,64px)}.services{grid-template-columns:1fr 1fr}.process{grid-template-columns:1fr}.testimonials{grid-template-columns:1fr}.section{padding:62px 0}.trust-grid{grid-template-columns:1fr}.footer-inner{align-items:flex-start;flex-direction:column}.contact{padding:28px}}
@media(max-width:520px){.services{grid-template-columns:1fr}.hero-card{padding:26px}.hero p{font-size:16px}.nav .button{padding:0 12px;font-size:12px}}
</style>
</head>
<body>
<header class="shell nav"><a class="brand" href="#top">${logo}</a><nav class="nav-links"><a href="#services">Services</a><a href="#about">About</a><a href="#contact">Contact</a></nav><a class="button primary" href="#contact">${escapeHtml(site.primaryCta)}</a></header>
<main id="top">
<section class="hero"><div class="shell hero-grid"><div><span class="kicker">${escapeHtml(businessName)} · ${escapeHtml(site.location)}</span><h1>${escapeHtml(site.headline)}</h1><p>${escapeHtml(site.tagline)}</p><div class="hero-actions"><a class="button primary" href="#contact">${escapeHtml(site.primaryCta)}</a><a class="button secondary" href="#services">${escapeHtml(site.secondaryCta)}</a></div></div><aside class="hero-card"><span>WELCOME TO ${escapeHtml(businessName).toUpperCase()}</span><strong>${escapeHtml(site.description)}</strong><p>Built with the Start To Up ResKonnect Premium website system.</p></aside></div></section>
${site.showHighlights ? `<section class="trust"><div class="shell trust-grid">${highlights}</div></section>` : ""}
${site.showServices ? `<section id="services" class="section"><div class="shell"><div class="section-head"><span>WHAT WE DO</span><h2>Services designed around what your customer needs next.</h2><p>${escapeHtml(site.description)}</p></div><div class="services">${services}</div></div></section>` : ""}
<section id="about" class="section alt"><div class="shell"><div class="section-head"><span>ABOUT ${escapeHtml(businessName).toUpperCase()}</span><h2>${escapeHtml(site.headline)}</h2><p>${escapeHtml(site.tagline)}</p></div></div></section>
${site.showProcess ? `<section class="section"><div class="shell"><div class="section-head"><span>HOW IT WORKS</span><h2>A clear route from interest to outcome.</h2></div><div class="process">${process}</div></div></section>` : ""}
${site.showTestimonials ? `<section class="section alt"><div class="shell"><div class="section-head"><span>CLIENT EXPERIENCE</span><h2>Trust is built in the delivery.</h2></div><div class="testimonials">${testimonials}</div></div></section>` : ""}
${site.showContact ? `<section id="contact" class="section"><div class="shell contact"><div><span class="kicker">LET'S TALK</span><h2>Ready to take the next step?</h2><p>Contact ${escapeHtml(businessName)} and let us help you move forward.</p></div><div class="contact-list"><a href="mailto:${escapeHtml(contact.email)}">${escapeHtml(contact.email)}</a><a href="tel:${escapeHtml(contact.phone.replace(/\s/g, ""))}">${escapeHtml(contact.phone)}</a><div>${escapeHtml(contact.address)}</div></div></div></section>` : ""}
</main>
<footer><div class="shell footer-inner"><span class="footer-brand">${escapeHtml(businessName)}</span><span>Website powered by Start To Up Website Studio.</span></div></footer>
</body>
</html>`;
}

export function buildPublicationManifest(draft: WebsiteStudioDraft) {
  return {
    generator: "Start To Up Website Studio",
    template: draft.templateKey,
    template_source: "https://github.com/entertainmentinnanetclout-cpu/resi-seek-app",
    generated_at: new Date().toISOString(),
    business: {
      name: draft.businessName,
      category: draft.category,
      slug: draft.slug,
    },
    files: ["index.html", "site-blueprint.json"],
    site_blueprint: draft,
  };
}
