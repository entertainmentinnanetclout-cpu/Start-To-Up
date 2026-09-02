export type OperatingPersona = "founder" | "developer" | "investor" | "institution" | "professional";
export type CompanyStage = "idea" | "validation" | "building" | "launching" | "revenue" | "scaling";

export type OperatingPreferences = {
  persona: OperatingPersona;
  stage: CompanyStage;
  completedAt: string;
};

export type RecentWorkItem = {
  path: string;
  label: string;
  visitedAt: string;
};

export type SavedView = {
  id: string;
  name: string;
  path: string;
  createdAt: string;
};

export type OperatingRoute = {
  path: string;
  label: string;
  group: "Build" | "Grow" | "Operate" | "Capital" | "Network" | "Core";
  description: string;
  keywords: string[];
};

const PREF_KEY = "start-to-up-operating-preferences";
const RECENT_KEY = "start-to-up-recent-work";
const SAVED_VIEW_KEY = "start-to-up-saved-views";

export const personaOptions: Array<{ value: OperatingPersona; label: string; description: string }> = [
  { value: "founder", label: "Founder / operator", description: "Build, sell, operate and finance a company." },
  { value: "developer", label: "Developer / builder", description: "Ship products, websites, integrations and collaborations." },
  { value: "investor", label: "Investor", description: "Discover ventures, diligence opportunities and manage a watchlist." },
  { value: "institution", label: "Institution", description: "Run programmes, partnerships, organisations and verified opportunities." },
  { value: "professional", label: "Professional", description: "Offer expertise, collaborate and grow a trusted network." },
];

export const stageOptions: Array<{ value: CompanyStage; label: string; description: string }> = [
  { value: "idea", label: "Idea", description: "Clarify the problem, customer and opportunity." },
  { value: "validation", label: "Validation", description: "Collect evidence before investing heavily." },
  { value: "building", label: "Building", description: "Turn validated demand into a working product or service." },
  { value: "launching", label: "Launching", description: "Go live, acquire users and establish operating rhythm." },
  { value: "revenue", label: "Revenue", description: "Build a repeatable sales and delivery engine." },
  { value: "scaling", label: "Scaling", description: "Strengthen systems, capital, team and market expansion." },
];

export const journeyStages: Array<{ stage: CompanyStage; label: string; path: string; verb: string }> = [
  { stage: "idea", label: "Clarify", path: "/app/startup-os", verb: "Define the company foundation" },
  { stage: "validation", label: "Validate", path: "/app/validate", verb: "Prove demand with evidence" },
  { stage: "building", label: "Build", path: "/app/website-studio-templates", verb: "Create the product and launch surface" },
  { stage: "launching", label: "Launch", path: "/app/growth", verb: "Acquire the first meaningful users" },
  { stage: "revenue", label: "Sell", path: "/app/revenue", verb: "Turn demand into repeatable revenue" },
  { stage: "scaling", label: "Scale", path: "/app/operations", verb: "Operate, fund and expand with control" },
];

export const operatingRoutes: OperatingRoute[] = [
  { path: "/app/home", label: "Today", group: "Core", description: "What needs your attention now.", keywords: ["home", "today", "dashboard", "command"] },
  { path: "/app/work", label: "Work", group: "Core", description: "Launch every company workflow from one place.", keywords: ["work", "tools", "modules"] },
  { path: "/app/create", label: "Create", group: "Core", description: "Create a project, update, campaign or operating record.", keywords: ["create", "new", "project"] },
  { path: "/app/inbox", label: "Inbox", group: "Core", description: "Messages, reviews, actions and company activity.", keywords: ["inbox", "messages", "notifications", "approvals"] },
  { path: "/app/profile", label: "Me", group: "Core", description: "Your identity, profile and account.", keywords: ["profile", "account", "me"] },
  { path: "/app/website-studio-templates", label: "Website templates", group: "Build", description: "Start from a premium business template.", keywords: ["website", "template", "site", "design"] },
  { path: "/app/website-studio-v6", label: "Website Studio", group: "Build", description: "Design, integrate, export and deploy a production website.", keywords: ["website", "studio", "builder", "editor", "deploy"] },
  { path: "/app/integrations", label: "Integrations", group: "Build", description: "Connect company-owned services and data providers.", keywords: ["integrations", "github", "vercel", "supabase", "api"] },
  { path: "/app/collaboration", label: "Collaboration rooms", group: "Build", description: "Build projects with controlled team access.", keywords: ["collaboration", "room", "team", "developer"] },
  { path: "/app/validate", label: "Validate & research", group: "Grow", description: "Validate ideas, markets, companies and customer evidence.", keywords: ["validate", "research", "market", "tam", "customer"] },
  { path: "/app/revenue", label: "Revenue OS", group: "Grow", description: "CRM, pipeline, proposals, quotes and invoices.", keywords: ["revenue", "crm", "lead", "invoice", "quote", "sales"] },
  { path: "/app/growth", label: "Growth", group: "Grow", description: "Campaigns, content, SEO, experiments and attribution.", keywords: ["growth", "marketing", "campaign", "seo", "content"] },
  { path: "/app/intelligence", label: "Intelligence", group: "Grow", description: "Company intelligence, next actions and controlled automation.", keywords: ["intelligence", "assistant", "ai", "automation", "company"] },
  { path: "/app/operations", label: "Operations", group: "Operate", description: "OKRs, risks, hiring, vendors, meetings and renewals.", keywords: ["operations", "okr", "risk", "team", "vendors"] },
  { path: "/app/compliance", label: "Legal & compliance", group: "Operate", description: "Contracts, signatures, due diligence and compliance readiness.", keywords: ["legal", "compliance", "contract", "signature", "tender"] },
  { path: "/app/startup-os", label: "Company foundation", group: "Operate", description: "Shared company profile, members, verification and tasks.", keywords: ["startup", "company", "workspace", "foundation"] },
  { path: "/app/funding", label: "Funding & investors", group: "Capital", description: "Funding readiness, investor CRM, pitch, data room and cap table.", keywords: ["funding", "investor", "pitch", "capital", "valuation"] },
  { path: "/app/watchlist", label: "Investor watchlist", group: "Capital", description: "Private venture diligence and tracking.", keywords: ["watchlist", "investor", "venture", "diligence"] },
  { path: "/app/opportunities", label: "Opportunities", group: "Network", description: "Partnerships, suppliers, pilots and programmes.", keywords: ["opportunity", "partnership", "pilot", "supplier", "programme"] },
  { path: "/app/network", label: "Network", group: "Network", description: "People, ventures, builders and institutions.", keywords: ["network", "people", "ventures", "institutions"] },
  { path: "/app/messages", label: "Messages", group: "Network", description: "Private participant-only project conversations.", keywords: ["messages", "conversation", "chat"] },
  { path: "/app/organizations", label: "Organizations", group: "Network", description: "Institution and company spaces.", keywords: ["organizations", "institutions", "companies"] },
  { path: "/app/trust", label: "Trust centre", group: "Network", description: "Verification, reporting and protection.", keywords: ["trust", "verification", "safety", "report"] },
  { path: "/app/media", label: "Media", group: "Network", description: "Professional media and discovery.", keywords: ["media", "video", "feed", "reels"] },
  { path: "/app/sessions", label: "Live studio", group: "Network", description: "Live sessions, co-streams and pitches.", keywords: ["live", "sessions", "stream", "pitch"] },
  { path: "/app/creator", label: "Creator studio", group: "Network", description: "Media performance and audience insight.", keywords: ["creator", "analytics", "audience"] },
  { path: "/app/programs", label: "Programs", group: "Network", description: "Programmes and scheduled ecosystem activity.", keywords: ["programs", "programmes", "events"] },
];

export const workGroups = (["Build", "Grow", "Operate", "Capital", "Network"] as const).map((group) => ({
  group,
  routes: operatingRoutes.filter((route) => route.group === group),
}));

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try { return JSON.parse(value) as T; } catch { return fallback; }
}

export function readOperatingPreferences(): OperatingPreferences | null {
  if (typeof window === "undefined") return null;
  const stored = safeParse<OperatingPreferences | null>(window.localStorage.getItem(PREF_KEY), null);
  if (!stored || !personaOptions.some((item) => item.value === stored.persona) || !stageOptions.some((item) => item.value === stored.stage)) return null;
  return stored;
}

export function saveOperatingPreferences(persona: OperatingPersona, stage: CompanyStage) {
  if (typeof window === "undefined") return;
  const next: OperatingPreferences = { persona, stage, completedAt: new Date().toISOString() };
  window.localStorage.setItem(PREF_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("start-to-up:operating-preferences", { detail: next }));
  return next;
}

export function suggestedRoutePaths(preferences: OperatingPreferences | null): string[] {
  const persona = preferences?.persona || "founder";
  const stage = preferences?.stage || "launching";
  const byPersona: Record<OperatingPersona, string[]> = {
    founder: [],
    developer: ["/app/website-studio-v6", "/app/collaboration", "/app/integrations", "/app/network"],
    investor: ["/app/watchlist", "/app/funding", "/app/opportunities", "/app/intelligence"],
    institution: ["/app/organizations", "/app/programs", "/app/opportunities", "/app/trust"],
    professional: ["/app/network", "/app/collaboration", "/app/opportunities", "/app/messages"],
  };
  if (persona !== "founder") return byPersona[persona];
  const byStage: Record<CompanyStage, string[]> = {
    idea: ["/app/startup-os", "/app/validate", "/app/intelligence", "/app/network"],
    validation: ["/app/validate", "/app/intelligence", "/app/collaboration", "/app/startup-os"],
    building: ["/app/website-studio-v6", "/app/integrations", "/app/collaboration", "/app/operations"],
    launching: ["/app/growth", "/app/revenue", "/app/website-studio-v6", "/app/intelligence"],
    revenue: ["/app/revenue", "/app/growth", "/app/operations", "/app/compliance"],
    scaling: ["/app/operations", "/app/funding", "/app/revenue", "/app/compliance"],
  };
  return byStage[stage];
}

export function routeLabel(path: string) {
  const exact = operatingRoutes.find((route) => route.path === path);
  if (exact) return exact.label;
  const partial = operatingRoutes.find((route) => path.startsWith(route.path));
  return partial?.label || "Start To Up";
}

export function recordRecentWork(path: string, label?: string) {
  if (typeof window === "undefined") return;
  if (["/app/home", "/app/work", "/app/create", "/app/inbox", "/app/profile"].includes(path)) return;
  const current = safeParse<RecentWorkItem[]>(window.localStorage.getItem(RECENT_KEY), []);
  const next: RecentWorkItem[] = [
    { path, label: label || routeLabel(path), visitedAt: new Date().toISOString() },
    ...current.filter((item) => item.path !== path),
  ].slice(0, 12);
  window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("start-to-up:recent-work", { detail: next }));
}

export function readRecentWork(): RecentWorkItem[] {
  if (typeof window === "undefined") return [];
  return safeParse<RecentWorkItem[]>(window.localStorage.getItem(RECENT_KEY), []).filter((item) => Boolean(item.path && item.label && item.visitedAt));
}

export function readSavedViews(): SavedView[] {
  if (typeof window === "undefined") return [];
  return safeParse<SavedView[]>(window.localStorage.getItem(SAVED_VIEW_KEY), []).filter((item) => Boolean(item.id && item.name && item.path));
}

export function saveCurrentView(name: string, path: string): SavedView | null {
  if (typeof window === "undefined") return null;
  const clean = name.trim();
  if (!clean || !path.startsWith("/app/")) return null;
  const item: SavedView = { id: `view-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, name: clean, path, createdAt: new Date().toISOString() };
  const next = [item, ...readSavedViews().filter((existing) => existing.path !== path || existing.name !== clean)].slice(0, 20);
  window.localStorage.setItem(SAVED_VIEW_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("start-to-up:saved-views", { detail: next }));
  return item;
}

export function removeSavedView(id: string) {
  if (typeof window === "undefined") return;
  const next = readSavedViews().filter((item) => item.id !== id);
  window.localStorage.setItem(SAVED_VIEW_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("start-to-up:saved-views", { detail: next }));
}

export function relativeWorkTime(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(diff) || diff < 0) return "recently";
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(value).toLocaleDateString();
}
