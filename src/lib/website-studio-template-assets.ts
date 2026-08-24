import { normalizeWebsiteDraft, type WebsiteStudioDraft } from "./website-studio";

export type VisualContractMediaSlot = {
  id: string;
  label: string;
  path: string;
  aspect: string;
  alt: string;
};

export type VisualContractAssetPack = {
  templateKey: string;
  preview: string;
  referenceFilename: string;
  logo: VisualContractMediaSlot;
  hero?: VisualContractMediaSlot;
  gallery: VisualContractMediaSlot[];
};

const root = (key: string) => `/website-studio/templates/${key}`;
const slot = (key: string, id: string, label: string, file: string, aspect: string, alt = label): VisualContractMediaSlot => ({
  id, label, path: `${root(key)}/${file}`, aspect, alt,
});

function pack(key: string, referenceFilename: string, logoAspect: string, hero: [string, string] | null, gallery: Array<[string, string]>): VisualContractAssetPack {
  return {
    templateKey: key,
    preview: `${root(key)}/preview.png`,
    referenceFilename,
    logo: slot(key, "logo", "Template logo", "logo.png", logoAspect, `${key.replaceAll("-", " ")} logo`),
    ...(hero ? { hero: slot(key, "hero", "Hero image", "hero.png", hero[1], hero[0]) } : {}),
    gallery: gallery.map(([label, aspect], index) => slot(key, `gallery-${index + 1}`, label, `gallery-${String(index + 1).padStart(2, "0")}.png`, aspect)),
  };
}

export const visualContractAssetPacks: Record<string, VisualContractAssetPack> = {
  "newsroom-pro": pack("newsroom-pro", "Codex Image Aug 23, 2026, 05_29_30 PM.png", "6.2:1", ["US Capitol lead story", "1.97:1"], [["Court building", "1.67:1"],["City skyline at sunset", "1.67:1"],["Rural highway", "1.67:1"],["Students in a classroom", "1.67:1"],["Shipping port", "2:1"],["Solar energy building", "2:1"],["Community news scene", "2:1"]]),
  edulaunch: pack("edulaunch", "Codex Image Aug 23, 2026, 05_29_19 PM.png", "4.7:1", ["Students walking on campus", "2.49:1"], [["Data science programme", "2.15:1"],["Business analytics programme", "2.19:1"],["Psychology programme", "2.22:1"],["Computer science programme", "2.22:1"],["MBA programme", "2.22:1"],["Digital marketing programme", "2.19:1"],["Faculty expert", "1.8:1"],["Student life", "2.7:1"],["Modern campus", "3.88:1"]]),
  "medica-clinic": pack("medica-clinic", "Codex Image Aug 23, 2026, 05_29_15 PM.png", "5.7:1", ["Doctor consulting with a patient", "2.26:1"], [["Dr James Walker", "0.69:1"],["Clinic reception", "1.14:1"]]),
  "atelier-mode": pack("atelier-mode", "Codex Image Aug 23, 2026, 05_29_08 PM.png", "7.35:1", ["Summer collection campaign", "2.15:1"], [["Dresses category", "1.08:1"],["Tops category", "1.08:1"],["Bottoms category", "1.08:1"],["Outerwear category", "1.08:1"],["Accessories category", "1.08:1"],["Shoes category", "1.08:1"],["Linen wrap dress", "0.75:1"],["Satin slip dress", "0.76:1"],["Shell top", "0.76:1"],["Structured tote", "0.76:1"],["The Tailored Edit", "1.67:1"],["Natural light lookbook", "1.67:1"]]),
  "table-flame": pack("table-flame", "Codex Image Aug 23, 2026, 05_29_02 PM.png", "6.84:1", ["Live-fire signature dish", "2.07:1"], [["Charred octopus", "1.66:1"],["Wagyu flat iron steak", "1.66:1"],["Seared scallops", "1.66:1"],["Grilled prawns", "1.66:1"],["Chocolate tart", "1.66:1"],["Chef cooking over live fire", "4:1"],["Restaurant interior", "3.32:1"],["Dish from our table", "3.3:1"],["Cocktail bar", "3.32:1"],["Outdoor dining", "3.32:1"]]),
  "habitat-property": pack("habitat-property", "Codex Image Aug 23, 2026, 05_28_43 PM.png", "3.88:1", ["Modern luxury home", "1.61:1"], [["Featured villa interior", "1.54:1"],["Two-bedroom apartment", "2.29:1"],["Three-bedroom villa", "2.34:1"],["Apartment development", "2.3:1"],["Four-bedroom apartment", "2.31:1"],["Whitefield neighbourhood", "2.1:1"],["Koregaon Park neighbourhood", "2.08:1"],["Bandra West neighbourhood", "2.14:1"],["Aarav Sharma", "1:1"],["Neha Iyer", "1:1"],["Rohan Mehta", "1:1"],["Priya Nair", "1:1"]]),
  "studio-north": pack("studio-north", "Codex Image Aug 23, 2026, 05_28_38 PM.png", "4.89:1", ["Be Seen campaign portrait", "1.07:1"], [["ROZ mobile experience", "0.61:1"],["ROZ product identity", "1.61:1"],["Next Practice campaign", "1.58:1"],["Be Seen campaign", "1.59:1"],["NXT Practice tote", "1.12:1"],["ROZ street poster", "1.12:1"],["ROZ mobile campaign", "1.12:1"],["Think Forward identity", "1.12:1"],["Studio architecture", "1.8:1"]]),
  "neon-foundry": pack("neon-foundry", "Codex Image Aug 23, 2026, 05_28_32 PM.png", "2.5:1", null, []),
  "pulse-saas": pack("pulse-saas", "Codex Image Aug 23, 2026, 05_28_22 PM.png", "4.33:1", ["Pulse SaaS analytics dashboard", "1.85:1"], []),
  "campus-living": pack("campus-living", "Codex Image Aug 23, 2026, 05_27_19 PM.png", "4.65:1", ["Students socialising in campus housing", "1.96:1"], [["Campus residence exterior", "1.57:1"],["Shared games room", "1.55:1"],["Private room", "1.61:1"],["Shared room", "1.61:1"],["Studio room", "1.64:1"],["Two-bedroom apartment", "1.69:1"]]),
};

export function getVisualContractAssetPack(templateKey: unknown) {
  return visualContractAssetPacks[String(templateKey || "")];
}

export function applyVisualContractMediaDefaults(input: WebsiteStudioDraft): WebsiteStudioDraft {
  const assets = getVisualContractAssetPack(input.templateKey);
  if (!assets) return input;
  const site = { ...input.site };
  const brand = { ...input.brand };
  if (!brand.logoUrl) brand.logoUrl = assets.logo.path;
  if (!site.heroImageUrl && assets.hero) site.heroImageUrl = assets.hero.path;
  if (!site.gallery.length && assets.gallery.length) site.gallery = assets.gallery.map((item) => item.path);
  return normalizeWebsiteDraft({ ...input, brand, site });
}
