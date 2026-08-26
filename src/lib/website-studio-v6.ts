import { businessCategories, normalizeWebsiteDraft, type BusinessCategoryKey, type WebsiteStudioDraft } from "./website-studio";
import { getStructuralFamily, type StructuralFamily } from "./website-studio-structural";

export type StudioV6Device = "desktop" | "tablet" | "mobile";
export type StudioV6PageType = "home" | "about" | "services" | "products" | "properties" | "menu" | "courses" | "team" | "blog" | "contact" | "faq" | "custom";
export type StudioV6SectionType =
  | "hero" | "intro" | "services" | "features" | "stats" | "gallery" | "testimonials" | "process" | "team"
  | "products" | "properties" | "menu" | "courses" | "articles" | "rooms" | "practitioners" | "events" | "faq"
  | "form" | "contact" | "cta" | "logo-cloud" | "pricing" | "integrations" | "code" | "map" | "custom";

export type StudioV6DeviceStyle = {
  fontScale: number;
  spacingScale: number;
  columns: number;
  hidden: boolean;
  order?: number;
  imageFit?: "cover" | "contain";
  imagePosition?: string;
};

export type StudioV6Section = {
  id: string;
  key: string;
  type: StudioV6SectionType;
  title: string;
  order: number;
  columns: number;
  content: Record<string, unknown>;
  style: Record<string, unknown>;
  responsive: Record<StudioV6Device, StudioV6DeviceStyle>;
  locked?: boolean;
};

export type StudioV6Page = {
  id: string;
  slug: string;
  title: string;
  type: StudioV6PageType;
  order: number;
  visible: boolean;
  sections: StudioV6Section[];
  seo: { title: string; description: string; canonical: string; ogImageUrl: string; noIndex: boolean; schemaType: string };
};

export type StudioV6IndustryRecord = {
  id: string;
  moduleType: "product" | "collection" | "property" | "agent" | "menu_item" | "course" | "practitioner" | "article" | "room" | "event";
  title: string;
  slug: string;
  status: "draft" | "active" | "archived";
  data: Record<string, unknown>;
  media: Array<{ url: string; alt: string }>;
};

export type StudioV6FormField = { id: string; name: string; label: string; type: "text" | "email" | "tel" | "textarea" | "select" | "checkbox" | "date" | "time" | "number"; required: boolean; options?: string[] };
export type StudioV6Form = {
  id: string;
  name: string;
  slug: string;
  fields: StudioV6FormField[];
  settings: { submitLabel: string; successMessage: string; destination?: string };
  spam: { honeypot: boolean; minimumSeconds: number };
  autoresponder: { enabled: boolean; subject: string; message: string };
};

export type StudioV6Config = {
  version: 6;
  activePageSlug: string;
  pages: StudioV6Page[];
  brandKitId: string;
  responsive: Record<StudioV6Device, { baseFont: number; sectionGap: number; containerPadding: number; navMode: "full" | "compact" | "drawer" }>;
  industryRecords: StudioV6IndustryRecord[];
  forms: StudioV6Form[];
  analytics: { enabled: boolean; consentMode: "essential" | "opt-in" | "off"; campaignTracking: boolean };
  optimization: { lazyImages: boolean; responsiveImages: boolean; webp: boolean; avif: boolean; fontPreload: boolean; cacheAssets: boolean };
  accessibility: { enforceAltText: boolean; enforceContrast: boolean; reducedMotion: boolean };
  domain: { production: string; staging: string };
  assistant: { visualContractLocked: boolean; allowLayoutChanges: boolean };
};

export type StudioV6Draft = WebsiteStudioDraft & { studioV6: StudioV6Config };

const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36).slice(-5)}`;

const defaultResponsive = (): StudioV6Section["responsive"] => ({
  desktop: { fontScale: 1, spacingScale: 1, columns: 3, hidden: false, imageFit: "cover", imagePosition: "50% 50%" },
  tablet: { fontScale: 0.94, spacingScale: 0.85, columns: 2, hidden: false, imageFit: "cover", imagePosition: "50% 50%" },
  mobile: { fontScale: 0.88, spacingScale: 0.7, columns: 1, hidden: false, imageFit: "cover", imagePosition: "50% 50%" },
});

export function sectionLabel(type: StudioV6SectionType) {
  return ({ hero: "Hero", intro: "Introduction", services: "Services", features: "Feature grid", stats: "Statistics", gallery: "Gallery", testimonials: "Testimonials", process: "Process", team: "Team", products: "Product catalogue", properties: "Property listings", menu: "Menu", courses: "Course grid", articles: "Newsroom", rooms: "Room availability", practitioners: "Practitioners", events: "Events", faq: "FAQ", form: "Form", contact: "Contact", cta: "Call to action", "logo-cloud": "Logo cloud", pricing: "Pricing", integrations: "Integrations", code: "Code / API", map: "Map", custom: "Custom section" } satisfies Record<StudioV6SectionType, string>)[type];
}

export function createStudioSection(type: StudioV6SectionType, order = 0): StudioV6Section {
  return {
    id: uid("section"), key: `${type}-${order + 1}`, type, title: sectionLabel(type), order, columns: ["hero","intro","cta","contact","form","code"].includes(type) ? 1 : 3,
    content: {}, style: { paddingTop: 72, paddingBottom: 72, background: "", width: "contained", align: "left" }, responsive: defaultResponsive(),
  };
}

function categoryPrimaryPage(category: BusinessCategoryKey): { type: StudioV6PageType; title: string; section: StudioV6SectionType } {
  if (category === "property") return { type: "properties", title: "Properties", section: "properties" };
  if (category === "restaurant") return { type: "menu", title: "Menu", section: "menu" };
  if (category === "retail") return { type: "products", title: "Shop", section: "products" };
  if (category === "education") return { type: "courses", title: "Programmes", section: "courses" };
  if (category === "healthcare") return { type: "services", title: "Services", section: "practitioners" };
  if (category === "events") return { type: "services", title: "Events", section: "events" };
  if (category === "institution") return { type: "blog", title: "News & Resources", section: "articles" };
  return { type: "services", title: "Services", section: "services" };
}

function page(slug: string, title: string, type: StudioV6PageType, order: number, sectionTypes: StudioV6SectionType[], businessName: string): StudioV6Page {
  return {
    id: uid("page"), slug, title, type, order, visible: true,
    sections: sectionTypes.map((sectionType, index) => createStudioSection(sectionType, index)),
    seo: { title: `${title} | ${businessName}`, description: `${title} from ${businessName}.`, canonical: "", ogImageUrl: "", noIndex: false, schemaType: type === "blog" ? "CollectionPage" : "WebPage" },
  };
}

export function createDefaultStudioV6(raw: WebsiteStudioDraft): StudioV6Config {
  const draft = normalizeWebsiteDraft(raw);
  const primary = categoryPrimaryPage(draft.category);
  const family = getStructuralFamily(draft);
  const homeSections: StudioV6SectionType[] = family === "saas" ? ["hero","logo-cloud","stats","features","integrations","pricing","testimonials","cta"]
    : family === "developer" ? ["hero","code","features","integrations","process","cta"]
    : family === "restaurant" ? ["hero","menu","intro","gallery","testimonials","form","contact"]
    : family === "property" || family === "accommodation" ? ["hero", family === "accommodation" ? "rooms" : "properties", "features","process","testimonials","cta"]
    : family === "education" ? ["hero","courses","stats","features","process","testimonials","cta"]
    : family === "institution" ? ["hero","articles","stats","features","cta"]
    : ["hero","services","features","stats","testimonials","cta"];
  const pages = [
    page("/", "Home", "home", 0, homeSections, draft.businessName),
    page("about", "About", "about", 1, ["hero","intro","stats","team","cta"], draft.businessName),
    page(primary.type === "services" ? "services" : primary.type, primary.title, primary.type, 2, ["hero", primary.section, "faq", "cta"], draft.businessName),
    page("contact", "Contact", "contact", 3, ["hero","contact","form","map"], draft.businessName),
    page("faq", "FAQ", "faq", 4, ["hero","faq","cta"], draft.businessName),
  ];
  return {
    version: 6, activePageSlug: "/", pages, brandKitId: "",
    responsive: {
      desktop: { baseFont: 16, sectionGap: 88, containerPadding: 24, navMode: "full" },
      tablet: { baseFont: 16, sectionGap: 68, containerPadding: 22, navMode: "compact" },
      mobile: { baseFont: 15, sectionGap: 50, containerPadding: 16, navMode: "drawer" },
    },
    industryRecords: [], forms: [defaultContactForm()],
    analytics: { enabled: true, consentMode: "essential", campaignTracking: true },
    optimization: { lazyImages: true, responsiveImages: true, webp: true, avif: true, fontPreload: true, cacheAssets: true },
    accessibility: { enforceAltText: true, enforceContrast: true, reducedMotion: true },
    domain: { production: "", staging: "" }, assistant: { visualContractLocked: true, allowLayoutChanges: false },
  };
}

export function defaultContactForm(): StudioV6Form {
  return {
    id: uid("form"), name: "Contact form", slug: "contact",
    fields: [
      { id: uid("field"), name: "fullName", label: "Name", type: "text", required: true },
      { id: uid("field"), name: "email", label: "Email", type: "email", required: true },
      { id: uid("field"), name: "phone", label: "Phone", type: "tel", required: false },
      { id: uid("field"), name: "message", label: "How can we help?", type: "textarea", required: true },
    ],
    settings: { submitLabel: "Send enquiry", successMessage: "Thank you. Your enquiry has been sent." },
    spam: { honeypot: true, minimumSeconds: 2 }, autoresponder: { enabled: false, subject: "We received your enquiry", message: "Thank you for getting in touch. We will respond shortly." },
  };
}

export function ensureStudioV6Draft(raw: WebsiteStudioDraft | StudioV6Draft): StudioV6Draft {
  const normalized = normalizeWebsiteDraft(raw as WebsiteStudioDraft) as StudioV6Draft;
  const incoming = (raw as Partial<StudioV6Draft>).studioV6;
  const base = createDefaultStudioV6(normalized);
  normalized.studioV6 = incoming ? {
    ...base, ...incoming,
    responsive: { ...base.responsive, ...(incoming.responsive || {}) },
    analytics: { ...base.analytics, ...(incoming.analytics || {}) },
    optimization: { ...base.optimization, ...(incoming.optimization || {}) },
    accessibility: { ...base.accessibility, ...(incoming.accessibility || {}) },
    domain: { ...base.domain, ...(incoming.domain || {}) },
    assistant: { ...base.assistant, ...(incoming.assistant || {}) },
    pages: incoming.pages?.length ? incoming.pages : base.pages,
    forms: incoming.forms?.length ? incoming.forms : base.forms,
    industryRecords: incoming.industryRecords || [],
  } : base;
  return normalized;
}

export type BuilderIntent = {
  summary: string;
  businessName?: string;
  category?: BusinessCategoryKey;
  location?: string;
  primaryColor?: string;
  secondaryColor?: string;
  style?: "minimal" | "luxury" | "bold" | "corporate" | "playful" | "dark";
  requestedPages: StudioV6PageType[];
  requestedFeatures: string[];
  copyHints: string[];
  warnings: string[];
};

const categoryKeywords: Array<[BusinessCategoryKey, string[]]> = [
  ["restaurant", ["restaurant","cafe","coffee","food","takeaway","menu","catering"]],
  ["property", ["property","real estate","accommodation","residence","rental","apartments","housing"]],
  ["retail", ["shop","store","ecommerce","fashion","products","retail","clothing"]],
  ["technology", ["saas","software","technology","tech","ai","app","developer","api","startup"]],
  ["education", ["school","academy","college","university","training","courses","education"]],
  ["healthcare", ["clinic","doctor","health","wellness","medical","dentist","therapy"]],
  ["security", ["security","guarding","safety","protection","cctv"]],
  ["construction", ["construction","engineering","contractor","industrial","building"]],
  ["events", ["events","festival","concert","entertainment","tickets","travel","tour"]],
  ["institution", ["ngo","nonprofit","institution","association","newsroom","publication","community"]],
  ["professional-services", ["consulting","law","legal","accounting","agency","professional","advisory"]],
];

const namedColors: Record<string, string> = { blue: "#2563eb", navy: "#0b1f3a", black: "#0b0b0c", white: "#ffffff", red: "#dc2626", orange: "#f97316", yellow: "#eab308", green: "#16a34a", teal: "#0f9f94", purple: "#7c3aed", pink: "#ec4899", gold: "#c8952e", beige: "#d8c7ad", brown: "#7c4a2d", grey: "#64748b", gray: "#64748b" };

const pageWords: Array<[StudioV6PageType, string[]]> = [
  ["about", ["about"]], ["services", ["services"]], ["products", ["products","shop","catalogue","catalog"]], ["properties", ["properties","listings"]], ["menu", ["menu"]], ["courses", ["courses","programmes","programs"]], ["team", ["team","staff"]], ["blog", ["blog","news","articles"]], ["contact", ["contact"]], ["faq", ["faq","frequently asked"]],
];

export function parseBuilderCommand(input: string, current?: WebsiteStudioDraft): BuilderIntent {
  const text = input.trim();
  const lower = text.toLowerCase();
  const intent: BuilderIntent = { summary: "", requestedPages: [], requestedFeatures: [], copyHints: [], warnings: [] };
  const called = text.match(/(?:called|named)\s+["']?([^,.;\n]+?)(?=\s+(?:in|based|with|for|that|using)\b|[,.;\n]|$)/i);
  if (called?.[1]) intent.businessName = called[1].replace(/["']$/g, "").trim();
  for (const [category, keywords] of categoryKeywords) if (keywords.some((keyword) => lower.includes(keyword))) { intent.category = category; break; }
  const location = text.match(/(?:based in|located in|\bin)\s+([A-Z][A-Za-zÀ-ÿ' -]{2,48})(?=[,.;\n]|\s+(?:with|using|and|that)\b|$)/);
  if (location?.[1]) intent.location = location[1].trim();
  const hex = text.match(/#[0-9a-f]{6}\b/i);
  if (hex) intent.primaryColor = hex[0];
  const mentionedColors = Object.entries(namedColors).filter(([name]) => new RegExp(`\\b${name}\\b`, "i").test(lower));
  if (!intent.primaryColor && mentionedColors[0]) intent.primaryColor = mentionedColors[0][1];
  if (mentionedColors[1]) intent.secondaryColor = mentionedColors[1][1];
  for (const style of ["minimal","luxury","bold","corporate","playful","dark"] as const) if (lower.includes(style)) intent.style = style;
  for (const [pageType, words] of pageWords) if (words.some((word) => lower.includes(word))) intent.requestedPages.push(pageType);
  const features = ["bookings","reservations","payments","stripe","forms","crm","analytics","blog","gallery","testimonials","maps","whatsapp","seo","shop","applications","availability"];
  intent.requestedFeatures = features.filter((feature) => lower.includes(feature));
  if (/modern|premium|clean|professional|youthful|gen-z|editorial|cinematic/i.test(text)) intent.copyHints.push(...(text.match(/modern|premium|clean|professional|youthful|gen-z|editorial|cinematic/gi) || []));
  if (!intent.category && current) intent.category = current.category;
  if (!intent.businessName && current?.businessName && current.businessName !== "Your Business") intent.businessName = current.businessName;
  if (!text) intent.warnings.push("Type a brief describing the business, pages and functionality you want.");
  intent.summary = [intent.businessName ? `Build ${intent.businessName}` : "Update the website", intent.category ? `as ${businessCategories.find((item) => item.key === intent.category)?.label}` : "", intent.location ? `in ${intent.location}` : "", intent.requestedFeatures.length ? `with ${intent.requestedFeatures.join(", ")}` : ""].filter(Boolean).join(" ");
  return intent;
}

export function applyBuilderIntent(raw: StudioV6Draft, intent: BuilderIntent): StudioV6Draft {
  const draft = ensureStudioV6Draft(raw);
  const next = ensureStudioV6Draft({
    ...draft,
    businessName: intent.businessName || draft.businessName,
    category: intent.category || draft.category,
    brand: {
      ...draft.brand,
      primary: intent.primaryColor || draft.brand.primary,
      secondary: intent.secondaryColor || draft.brand.secondary,
      navStyle: intent.style === "dark" ? "dark" : draft.brand.navStyle,
      cardStyle: intent.style === "luxury" ? "elevated" : intent.style === "minimal" ? "bordered" : draft.brand.cardStyle,
      buttonStyle: intent.style === "playful" ? "pill" : intent.style === "minimal" ? "square" : draft.brand.buttonStyle,
    },
    site: { ...draft.site, location: intent.location || draft.site.location },
  } as StudioV6Draft);
  const pageTypes = new Set(next.studioV6.pages.map((item) => item.type));
  for (const pageType of intent.requestedPages) {
    if (pageTypes.has(pageType)) continue;
    const title = pageType === "faq" ? "FAQ" : pageType.charAt(0).toUpperCase() + pageType.slice(1);
    const sectionType = ({ products: "products", properties: "properties", menu: "menu", courses: "courses", blog: "articles", team: "team", services: "services", contact: "contact", faq: "faq", about: "intro", home: "hero", custom: "custom" } as Record<StudioV6PageType, StudioV6SectionType>)[pageType];
    next.studioV6.pages.push(page(pageType, title, pageType, next.studioV6.pages.length, ["hero", sectionType, "cta"], next.businessName));
  }
  if (intent.requestedFeatures.includes("payments" ) || intent.requestedFeatures.includes("stripe")) next.integrations = { ...next.integrations, vercel: { ...next.integrations.vercel } };
  return next;
}

export type AuditFinding = { severity: "error" | "warning" | "info"; code: string; message: string; page?: string };
export type StudioAuditResult = { type: "seo" | "accessibility" | "performance"; score: number; findings: AuditFinding[] };

function clampScore(value: number) { return Math.max(0, Math.min(100, Math.round(value))); }
function add(findings: AuditFinding[], severity: AuditFinding["severity"], code: string, message: string, page?: string) { findings.push({ severity, code, message, page }); }

export function runSeoAudit(draft: StudioV6Draft): StudioAuditResult {
  const findings: AuditFinding[] = []; let score = 100;
  if (!draft.seo.title || draft.seo.title.length < 20) { score -= 10; add(findings,"warning","seo-title","Use a descriptive title of roughly 20–60 characters."); }
  if (!draft.seo.description || draft.seo.description.length < 70) { score -= 10; add(findings,"warning","meta-description","Add a useful meta description that explains the business and intent."); }
  if (!draft.seo.ogImageUrl) { score -= 5; add(findings,"info","social-image","Add an Open Graph image for link previews."); }
  for (const page of draft.studioV6.pages.filter((item) => item.visible)) {
    if (!page.seo.title) { score -= 4; add(findings,"error","page-title","Page is missing an SEO title.",page.slug); }
    if (!page.seo.description) { score -= 3; add(findings,"warning","page-description","Page is missing an SEO description.",page.slug); }
    if (page.slug !== "/" && !page.seo.canonical) { score -= 1; add(findings,"info","canonical","Canonical URL will be generated from the production domain when connected.",page.slug); }
  }
  if (!draft.studioV6.domain.production) add(findings,"info","domain","Connect a production domain to finalize canonical URLs and sitemap hostnames.");
  return { type: "seo", score: clampScore(score), findings };
}

function hexToRgb(hex: string) { const value = hex.replace("#", ""); if (!/^[0-9a-f]{6}$/i.test(value)) return null; return { r: parseInt(value.slice(0,2),16), g: parseInt(value.slice(2,4),16), b: parseInt(value.slice(4,6),16) }; }
function luminance(hex: string) { const rgb = hexToRgb(hex); if (!rgb) return 0.5; const parts = [rgb.r,rgb.g,rgb.b].map((v) => { const s=v/255; return s<=.03928?s/12.92:Math.pow((s+.055)/1.055,2.4); }); return .2126*parts[0]+.7152*parts[1]+.0722*parts[2]; }
export function contrastRatio(a: string, b: string) { const l1=luminance(a), l2=luminance(b); return (Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05); }

export function runAccessibilityAudit(draft: StudioV6Draft, assets: Array<{ alt_text?: string; mime_type?: string }> = []): StudioAuditResult {
  const findings: AuditFinding[] = []; let score = 100;
  const contrast = contrastRatio(draft.brand.text, draft.brand.surface);
  if (contrast < 4.5) { score -= 20; add(findings,"error","contrast",`Body text contrast is ${contrast.toFixed(2)}:1; target at least 4.5:1.`); }
  const missingAlt = assets.filter((asset) => asset.mime_type?.startsWith("image/") && !asset.alt_text?.trim()).length;
  if (missingAlt) { score -= Math.min(25, missingAlt * 4); add(findings,"error","alt-text",`${missingAlt} uploaded image${missingAlt===1?" is":"s are"} missing alt text.`); }
  for (const page of draft.studioV6.pages) if (!page.sections.some((section) => section.type === "hero")) { score -= 2; add(findings,"warning","heading-structure","Page has no primary hero/heading section.",page.slug); }
  if (!draft.studioV6.accessibility.reducedMotion) { score -= 4; add(findings,"warning","reduced-motion","Enable reduced-motion fallbacks for animated layouts."); }
  return { type: "accessibility", score: clampScore(score), findings };
}

export function runPerformanceAudit(draft: StudioV6Draft, assets: Array<{ byte_size?: number; mime_type?: string }> = []): StudioAuditResult {
  const findings: AuditFinding[] = []; let score = 100;
  const large = assets.filter((asset) => Number(asset.byte_size || 0) > 1_500_000);
  if (large.length) { score -= Math.min(30, large.length * 6); add(findings,"warning","large-images",`${large.length} uploaded asset${large.length===1?" is":"s are"} larger than 1.5 MB. Generate responsive WebP/AVIF variants.`); }
  if (!draft.studioV6.optimization.lazyImages) { score -= 10; add(findings,"warning","lazy-loading","Enable lazy loading for below-the-fold images."); }
  if (!draft.studioV6.optimization.webp && !draft.studioV6.optimization.avif) { score -= 10; add(findings,"warning","modern-images","Enable WebP or AVIF output."); }
  const externalMedia = [draft.brand.logoUrl,draft.site.heroImageUrl,draft.seo.ogImageUrl,...draft.site.gallery].filter((url) => /^https?:\/\//.test(url));
  if (externalMedia.length) add(findings,"info","portable-assets",`${externalMedia.length} external media reference${externalMedia.length===1?" will":"s will"} be copied into the portable ZIP during export.`);
  const sectionCount = draft.studioV6.pages.reduce((sum,pageItem) => sum + pageItem.sections.length,0);
  if (sectionCount > 45) { score -= 5; add(findings,"info","page-weight","Large multi-page project: split heavy interactive features and load them on demand."); }
  return { type: "performance", score: clampScore(score), findings };
}

export function csvFromRows(rows: Array<Record<string, unknown>>) {
  const keys = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const quote = (value: unknown) => `"${String(value ?? "").replaceAll('"','""')}"`;
  return [keys.map(quote).join(","), ...rows.map((row) => keys.map((key) => quote(row[key])).join(","))].join("\n");
}

export function familyContentManager(family: StructuralFamily) {
  if (family === "property") return { moduleType: "property" as const, label: "Properties & agents" };
  if (family === "accommodation") return { moduleType: "room" as const, label: "Rooms & availability" };
  if (family === "restaurant") return { moduleType: "menu_item" as const, label: "Menu & reservations" };
  if (family === "education") return { moduleType: "course" as const, label: "Courses & admissions" };
  if (family === "healthcare") return { moduleType: "practitioner" as const, label: "Practitioners & appointments" };
  if (family === "institution") return { moduleType: "article" as const, label: "Articles & categories" };
  if (family === "commerce") return { moduleType: "product" as const, label: "Products & collections" };
  return { moduleType: "product" as const, label: "Structured content" };
}
