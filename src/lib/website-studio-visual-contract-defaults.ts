import { normalizeWebsiteDraft, type WebsiteStudioDraft } from "./website-studio";

const defaults: Record<string, { previousHeadline: string; headline: string; previousTagline: string; tagline: string; primaryCta?: string; secondaryCta?: string }> = {
  "newsroom-pro": {
    previousHeadline: "Stories with context. Information with weight.",
    headline: "Inside the budget fight shaping Congress this summer",
    previousTagline: "A publication-style experience for editorial teams, media brands and information-led organisations.",
    tagline: "As appropriation talks stall, lawmakers face hard choices on spending, debt, and border security.",
    primaryCta: "Donate",
  },
  edulaunch: {
    previousHeadline: "Learning designed to move people forward.",
    headline: "Launch your future with purpose",
    previousTagline: "Present programmes, applications, outcomes and student support in a clear modern education experience.",
    tagline: "Career-focused programmes. Experienced faculty. Real-world learning. Your future starts here.",
    primaryCta: "Explore Programmes",
    secondaryCta: "Book a Campus Tour",
  },
  "medica-clinic": {
    previousHeadline: "Professional care made easier to access.",
    headline: "Compassionate care for a healthier you",
    previousTagline: "A clear healthcare website for services, appointments, patient information and trusted contact.",
    tagline: "Quality, patient-centred care for you and your family. Your health is our priority.",
    primaryCta: "Book an Appointment",
    secondaryCta: "Explore Services",
  },
  "atelier-mode": {
    previousHeadline: "A collection with a point of view.",
    headline: "Summer Refined",
    previousTagline: "Editorial commerce for fashion, accessories and brands where visual identity leads the sale.",
    tagline: "Timeless silhouettes. Thoughtful details. Discover the new summer collection.",
    primaryCta: "Shop the Collection",
  },
  "table-flame": {
    previousHeadline: "Food worth planning your day around.",
    headline: "FLAVOR IGNITED. MEMORIES SERVED.",
    previousTagline: "A hospitality-led restaurant experience for menus, reservations, private events and loyal customers.",
    tagline: "A culinary experience where live fire cooking meets seasonal ingredients and heartfelt hospitality.",
    primaryCta: "BOOK YOUR TABLE",
  },
  "habitat-property": {
    previousHeadline: "Property discovery without the friction.",
    headline: "Find a home that fits your life.",
    previousTagline: "A premium real-estate experience for listings, enquiries, developments and trusted property services.",
    tagline: "Search thousands of verified properties across top neighborhoods.",
    primaryCta: "Search Properties",
  },
  "studio-north": {
    previousHeadline: "Ideas made impossible to ignore.",
    headline: "Ideas that move culture.",
    previousTagline: "A sharp agency site for strategy, design, campaigns and creative work that needs presence.",
    tagline: "A creative agency and design studio working at the intersection of strategy, design and storytelling.",
    primaryCta: "View our work",
  },
  "neon-foundry": {
    previousHeadline: "Ship faster. Operate with confidence.",
    headline: "Build systems that build faster.",
    previousTagline: "A technical product site that makes complex infrastructure feel clear, credible and ready to scale.",
    tagline: "Neon Foundry is the API platform for build automation, observability, and delivery. Designed for speed. Built for developers.",
    primaryCta: "Start building",
    secondaryCta: "Read the docs",
  },
  "pulse-saas": {
    previousHeadline: "Software people understand in seconds.",
    headline: "The AI platform that turns data into decisions",
    previousTagline: "Show the problem, product and proof with a premium SaaS experience built to convert.",
    tagline: "Pulse SaaS helps teams monitor, analyze, and act on insights in real time—so you can ship faster and grow smarter.",
    primaryCta: "Start free trial",
    secondaryCta: "Book a demo",
  },
  "campus-living": {
    previousHeadline: "A better place to live, study and belong.",
    headline: "More Than a Room. It’s Your Campus Home.",
    previousTagline: "Show rooms, amenities, location and application steps in one student-friendly experience.",
    tagline: "Modern student housing near campus with comfortable rooms, great amenities, and a vibrant community.",
    primaryCta: "Explore Rooms",
    secondaryCta: "Schedule a Tour",
  },
};

export function applyVisualContractDefaults(input: WebsiteStudioDraft): WebsiteStudioDraft {
  const key = String(input.templateKey || "");
  const contract = defaults[key];
  if (!contract) return input;
  const site = { ...input.site };
  if (!site.headline || site.headline === contract.previousHeadline) site.headline = contract.headline;
  if (!site.tagline || site.tagline === contract.previousTagline) site.tagline = contract.tagline;
  if (contract.primaryCta && (!site.primaryCta || site.primaryCta === "Get Started" || site.primaryCta === "Get Started Today" || site.primaryCta === "Enquire Now")) site.primaryCta = contract.primaryCta;
  if (contract.secondaryCta && (!site.secondaryCta || site.secondaryCta === "Explore Services" || site.secondaryCta === "Learn More")) site.secondaryCta = contract.secondaryCta;
  return normalizeWebsiteDraft({ ...input, site });
}
