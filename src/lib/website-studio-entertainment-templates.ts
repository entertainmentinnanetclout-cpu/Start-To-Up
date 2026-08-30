import { applyStudioTemplate, studioTemplates, type StudioTemplatePreset } from "./website-studio-template-catalog";
import { ensureStudioV6Draft, type StudioV6Draft, type StudioV6Page, type StudioV6Section } from "./website-studio-v6";
import { hasVisualContract } from "./website-studio-visual-contracts";

const uid = (value: string) => `ent-${value}`;
const responsive = {
  desktop: { fontScale: 1, spacingScale: 1, columns: 3, hidden: false, imageFit: "cover" as const, imagePosition: "50% 50%" },
  tablet: { fontScale: .94, spacingScale: .86, columns: 2, hidden: false, imageFit: "cover" as const, imagePosition: "50% 50%" },
  mobile: { fontScale: .88, spacingScale: .7, columns: 1, hidden: false, imageFit: "cover" as const, imagePosition: "50% 50%" },
};

function section(key: string, title: string, order: number, content: Record<string, unknown> = {}): StudioV6Section {
  return { id: uid(`section-${key}`), key, type: "custom", title, order, columns: 1, content, style: { paddingTop: 64, paddingBottom: 64, background: "", width: "contained", align: "left" }, responsive };
}
function page(slug: string, title: string, order: number, sections: StudioV6Section[], businessName: string): StudioV6Page {
  return { id: uid(`page-${slug || "home"}`), slug: slug || "/", title, type: slug === "about" ? "about" : slug === "contact" ? "contact" : "custom", order, visible: true, sections, seo: { title: `${title} | ${businessName}`, description: `${title} from ${businessName}.`, canonical: "", ogImageUrl: "", noIndex: false, schemaType: "WebPage" } };
}

export const entertainmentTemplates: StudioTemplatePreset[] = [
  {
    key: "rap-cut-producer",
    name: "Rap Cut — Producer",
    category: "events",
    family: "Music Producer",
    description: "Neon-black producer system for beats, placements, videos, sessions, merch, live streams and bookings.",
    tags: ["producer", "beats", "studio", "music", "merch", "streaming"],
    preview: { primary: "#7cff00", secondary: "#050705", accent: "#b7ff53", surface: "#0b0e0c", mood: "dark" },
    brand: { primary: "#7cff00", secondary: "#050705", accent: "#b7ff53", surface: "#0b0e0c", text: "#f7f9f2", fontFamily: "DM Sans", heroStyle: "split", navStyle: "dark", cardStyle: "glass", buttonStyle: "square", radius: 14, logoText: "RAP CUT THE JUICE" },
    site: {
      headline: "RAP CUT",
      tagline: "High quality beats, industry-ready sound, next-level visuals and live content. Let’s build something that hits different.",
      description: "Producer. Artist. Creative direction. Cut the noise. Keep the juice.",
      primaryCta: "LISTEN TO BEATS",
      secondaryCta: "BOOK A SESSION",
      announcement: "NEW BEATS · VIDEOS · MERCH · LIVE EVENTS",
      location: "South Africa",
      services: ["Music Production", "Mixing & Mastering", "Collaboration", "Creative Direction", "Bookings"],
      highlights: ["120M+ Streams", "250+ Placements", "10+ Years"],
      process: ["Choose a beat", "Preview the sound", "Book or license when payments launch"],
      testimonials: ["One of the hardest producers out right now. Every beat is crazy and original."],
      stats: [{ value: "120M+", label: "Streams" }, { value: "250+", label: "Placements" }, { value: "10+", label: "Years" }],
      showAnnouncement: false, showServices: true, showHighlights: true, showProcess: true, showTestimonials: true, showStats: true, showGallery: true, showContact: true,
    },
  },
  {
    key: "rap-cut-artist",
    name: "Rap Cut — Artist",
    category: "events",
    family: "Music Artist",
    description: "Premium artist system for releases, videos, performances, merch, fan capture, collaborations and bookings.",
    tags: ["artist", "musician", "performer", "music", "tour", "merch"],
    preview: { primary: "#7cff00", secondary: "#050705", accent: "#b7ff53", surface: "#0b0e0c", mood: "dark" },
    brand: { primary: "#7cff00", secondary: "#050705", accent: "#b7ff53", surface: "#0b0e0c", text: "#f7f9f2", fontFamily: "DM Sans", heroStyle: "split", navStyle: "dark", cardStyle: "glass", buttonStyle: "square", radius: 14, logoText: "RAP CUT THE JUICE" },
    site: {
      headline: "RAP CUT",
      tagline: "Artist. Storyteller. Game changer. Bringing raw energy, real music and unforgettable performances to every stage.",
      description: "Artist. Creator. Visionary. More than music — this is culture.",
      primaryCta: "LISTEN NOW",
      secondaryCta: "BOOK A SHOW",
      announcement: "NEW MUSIC · VIDEOS · TOUR DATES · EXCLUSIVE DROPS",
      location: "South Africa",
      services: ["Artist Development", "Songwriting", "Live Performances", "Brand Collaborations", "Creative Direction"],
      highlights: ["85M+ Streams", "120+ Shows", "6 Projects"],
      process: ["Discover the music", "Watch the visuals", "Join the next live moment"],
      testimonials: ["A rare energy and authenticity. This is not just music — it is a movement."],
      stats: [{ value: "85M+", label: "Streams" }, { value: "120+", label: "Shows" }, { value: "6", label: "Projects" }],
      showAnnouncement: false, showServices: true, showHighlights: true, showProcess: true, showTestimonials: true, showStats: true, showGallery: true, showContact: true,
    },
  },
];

export const entertainmentTemplateKeys = new Set(entertainmentTemplates.map((item) => item.key));
export function isEntertainmentTemplate(value: unknown): boolean { return entertainmentTemplateKeys.has(String(value || "")); }

export const publishedStudioTemplates: StudioTemplatePreset[] = [
  ...studioTemplates.filter((template) => hasVisualContract(template.key)),
  ...entertainmentTemplates,
];

export function applyEntertainmentPages(input: StudioV6Draft): StudioV6Draft {
  if (!isEntertainmentTemplate(input.templateKey)) return input;
  const next = structuredClone(input);
  const producer = String(next.templateKey) === "rap-cut-producer";
  const commonHome = [
    section("hero", "Hero", 0, { variant: producer ? "producer" : "artist" }),
    section("featured", producer ? "Featured Beats" : "Featured Tracks", 1),
    section("videos", "Music Videos & Clips", 2),
    section("services", "Services", 3),
    section("merch", "Merch", 4),
    section("events", "Live Events & Streams", 5),
    section("collaborators", "Testimonials & Collaborators", 6),
    section("newsletter", "Stay Updated", 7),
  ];
  const pages: StudioV6Page[] = producer ? [
    page("", "Home", 0, commonHome, next.businessName),
    page("beats", "Beats", 1, [section("beats-catalog", "Beat Catalogue", 0), section("licensing", "Beat Licensing", 1, { payments: "coming_soon" })], next.businessName),
    page("videos", "Videos", 2, [section("video-library", "Videos & Short Clips", 0), section("social-video", "YouTube & TikTok", 1)], next.businessName),
    page("services", "Services", 3, [section("producer-services", "Production Services", 0), section("sessions", "Book a Session", 1)], next.businessName),
    page("merch", "Merch", 4, [section("merch-catalog", "Merch Store", 0, { payments: "coming_soon" })], next.businessName),
    page("events", "Events", 5, [section("event-calendar", "Events & Live Streams", 0, { streaming: "coming_soon" })], next.businessName),
    page("about", "About", 6, [section("story", "The Story", 0), section("credits", "Credits & Collaborators", 1)], next.businessName),
    page("contact", "Contact", 7, [section("contact", "Bookings & Contact", 0), section("packages", "Website + Domain + Maintenance Packages", 1)], next.businessName),
  ] : [
    page("", "Home", 0, commonHome, next.businessName),
    page("music", "Music", 1, [section("releases", "Releases", 0), section("downloads", "Music Downloads & Sales", 1, { payments: "coming_soon" })], next.businessName),
    page("videos", "Videos", 2, [section("video-library", "Music Videos & Clips", 0), section("social-video", "YouTube & TikTok", 1)], next.businessName),
    page("events", "Events", 3, [section("event-calendar", "Tour Dates, Events & Streams", 0, { streaming: "coming_soon" })], next.businessName),
    page("merch", "Merch", 4, [section("merch-catalog", "Merch Store", 0, { payments: "coming_soon" })], next.businessName),
    page("about", "About", 5, [section("story", "Artist Story", 0), section("credits", "Collaborators & Press", 1)], next.businessName),
    page("contact", "Contact", 6, [section("contact", "Bookings & Contact", 0), section("packages", "Website + Domain + Maintenance Packages", 1)], next.businessName),
  ];
  next.studioV6.pages = pages;
  next.studioV6.activePageSlug = "/";
  (next.contact as any).tiktok ||= "https://www.tiktok.com/@heyyojuicewhattup?is_from_webapp=1&sender_device=pc";
  (next.contact as any).youtube ||= "";
  (next.contact as any).spotify ||= "";
  (next.contact as any).soundcloud ||= "";
  return next;
}

export function createEntertainmentDraft(template: StudioTemplatePreset): StudioV6Draft {
  return applyEntertainmentPages(ensureStudioV6Draft(applyStudioTemplate(template) as StudioV6Draft));
}
