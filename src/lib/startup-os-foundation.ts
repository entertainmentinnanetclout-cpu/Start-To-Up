import { supabase } from "../integrations/supabase/client";

const db = supabase as any;

export type StartupWorkspace = {
  organization_id: string;
  slug: string;
  name: string;
  role: "owner" | "admin" | "editor" | "member" | "viewer";
  is_verified: boolean;
};

export type StartupWorkspaceSnapshot = {
  profile: Record<string, any> | null;
  members: Array<Record<string, any>>;
  verifications: Array<Record<string, any>>;
  metrics: Array<Record<string, any>>;
  tasks: Array<Record<string, any>>;
  integrations: Array<Record<string, any>>;
  flags: Array<{ flag_key: string; enabled: boolean }>;
  activity: Array<Record<string, any>>;
};

export type StartupOsProviderKey =
  | "github"
  | "vercel"
  | "supabase"
  | "lovable"
  | "stripe"
  | "resend"
  | "google_business"
  | "google_analytics"
  | "search_console"
  | "meta"
  | "google_places"
  | "semrush"
  | "crm_webhook";

export type StartupOsProvider = {
  key: StartupOsProviderKey;
  name: string;
  purpose: string;
  credentialLabel: string;
  credentialPlaceholder: string;
  secret: boolean;
  fields?: Array<{ key: string; label: string; placeholder: string }>;
  steps: [string, string, string];
  setupUrl: string;
  docsUrl: string;
  cost: string;
  module: string;
};

export const startupOsProviders: StartupOsProvider[] = [
  {
    key: "github",
    name: "GitHub",
    purpose: "Store source code, generated websites and product repositories under version control.",
    credentialLabel: "Fine-grained personal access token",
    credentialPlaceholder: "github_pat_…",
    secret: true,
    steps: [
      "Open GitHub token settings and create a fine-grained token.",
      "Limit it to the repositories you want Start To Up to manage and grant only the permissions you need.",
      "Copy the token once, paste it here, then choose Test & connect.",
    ],
    setupUrl: "https://github.com/settings/personal-access-tokens/new",
    docsUrl: "https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens",
    cost: "GitHub has free and paid account tiers. Creating an API token itself has no separate fee.",
    module: "Build & Launch",
  },
  {
    key: "vercel",
    name: "Vercel",
    purpose: "Deploy projects, generate preview URLs and connect production domains.",
    credentialLabel: "Vercel access token",
    credentialPlaceholder: "Paste your Vercel token",
    secret: true,
    fields: [{ key: "teamId", label: "Team ID (optional)", placeholder: "team_…" }],
    steps: [
      "Open Vercel Account Settings and create a token.",
      "Copy the token. If you use a team, copy the Team ID too.",
      "Paste the values here and choose Test & connect.",
    ],
    setupUrl: "https://vercel.com/account/settings/tokens",
    docsUrl: "https://vercel.com/docs/rest-api",
    cost: "Vercel offers free and paid plans. Deployment usage can become billable as your projects scale.",
    module: "Build & Launch",
  },
  {
    key: "supabase",
    name: "Supabase",
    purpose: "Connect a company-owned backend for databases, auth, storage and application functions.",
    credentialLabel: "Publishable key",
    credentialPlaceholder: "sb_publishable_…",
    secret: false,
    fields: [{ key: "url", label: "Project URL", placeholder: "https://your-project.supabase.co" }],
    steps: [
      "Open your Supabase project and go to Project Settings → API.",
      "Copy the Project URL and publishable key. Never paste a service-role key into this field.",
      "Paste both values and choose Test & connect.",
    ],
    setupUrl: "https://supabase.com/dashboard/projects",
    docsUrl: "https://supabase.com/docs/guides/api/api-keys",
    cost: "Supabase has a free tier and paid plans. Database, storage and function usage can be billable.",
    module: "Platform",
  },
  {
    key: "lovable",
    name: "Lovable",
    purpose: "Link an optional Lovable workspace while keeping portable project source under your control.",
    credentialLabel: "Project ID",
    credentialPlaceholder: "Lovable project ID",
    secret: false,
    fields: [
      { key: "editorUrl", label: "Editor URL", placeholder: "https://lovable.dev/projects/…" },
      { key: "previewUrl", label: "Preview URL", placeholder: "https://….lovable.app" },
    ],
    steps: [
      "Open or create your project in Lovable.",
      "Copy its project ID or editor URL and optional preview URL.",
      "Paste the details here and connect the workspace.",
    ],
    setupUrl: "https://lovable.dev",
    docsUrl: "https://docs.lovable.dev/",
    cost: "Lovable account limits and pricing are controlled by Lovable.",
    module: "Build & Launch",
  },
  {
    key: "stripe",
    name: "Stripe",
    purpose: "Accept deposits and payments for bookings, services, applications and orders.",
    credentialLabel: "Stripe secret key",
    credentialPlaceholder: "sk_test_… or sk_live_…",
    secret: true,
    steps: [
      "Open Stripe Developers → API keys.",
      "Start with a Test-mode secret key. Switch to Live only when you are ready for real payments.",
      "Paste the key here and choose Test & connect. The key stays server-side.",
    ],
    setupUrl: "https://dashboard.stripe.com/apikeys",
    docsUrl: "https://docs.stripe.com/keys",
    cost: "Stripe charges payment-processing fees. Testing with test-mode keys does not create real charges.",
    module: "Revenue",
  },
  {
    key: "resend",
    name: "Resend",
    purpose: "Send form notifications, booking confirmations, transactional emails and autoresponders.",
    credentialLabel: "Resend API key",
    credentialPlaceholder: "re_…",
    secret: true,
    fields: [{ key: "fromEmail", label: "Verified sender email", placeholder: "hello@yourdomain.co.za" }],
    steps: [
      "Open Resend API Keys and create a key.",
      "Verify your sending domain and choose a sender email on that domain.",
      "Paste the key and sender email here, then Test & connect.",
    ],
    setupUrl: "https://resend.com/api-keys",
    docsUrl: "https://resend.com/docs/dashboard/api-keys/introduction",
    cost: "Resend offers limited free usage and paid email-volume plans.",
    module: "Sales & CRM",
  },
  {
    key: "google_business",
    name: "Google Business Profile",
    purpose: "Import and manage owner-authorised business profile information.",
    credentialLabel: "OAuth access token",
    credentialPlaceholder: "Paste an authorised Google OAuth token",
    secret: true,
    steps: [
      "Open Google Cloud and enable the Business Profile APIs for your project.",
      "Create OAuth credentials and authorise the Google account that manages the business profile.",
      "Paste the authorised token here and Test & connect.",
    ],
    setupUrl: "https://console.cloud.google.com/apis/library/mybusinessaccountmanagement.googleapis.com",
    docsUrl: "https://developers.google.com/my-business/content/oauth-overview",
    cost: "Google Cloud may require billing/account verification even when an API itself has no direct per-call fee.",
    module: "Company Intelligence",
  },
  {
    key: "google_analytics",
    name: "Google Analytics",
    purpose: "Use owner-verified traffic, acquisition and conversion data in company dashboards.",
    credentialLabel: "OAuth access token",
    credentialPlaceholder: "Google OAuth access token",
    secret: true,
    fields: [{ key: "propertyId", label: "GA4 property ID", placeholder: "123456789" }],
    steps: [
      "Open Google Cloud, create OAuth credentials and enable Google Analytics Data API.",
      "Authorise the Google account with access to the GA4 property and copy the property ID.",
      "Paste the authorised token and property ID here, then Test & connect.",
    ],
    setupUrl: "https://console.cloud.google.com/apis/library/analyticsdata.googleapis.com",
    docsUrl: "https://developers.google.com/analytics/devguides/reporting/data/v1",
    cost: "The normal Analytics Data API is quota-limited rather than billed per request; Google account/product charges may still apply separately.",
    module: "Growth",
  },
  {
    key: "search_console",
    name: "Google Search Console",
    purpose: "Import verified clicks, impressions, queries and search-performance data for sites the owner controls.",
    credentialLabel: "OAuth access token",
    credentialPlaceholder: "Google OAuth access token",
    secret: true,
    fields: [{ key: "siteUrl", label: "Verified site URL", placeholder: "https://example.co.za/" }],
    steps: [
      "Open Google Cloud and enable the Search Console API.",
      "Create OAuth credentials and authorise the Google account that owns or can access the Search Console property.",
      "Paste the authorised token and exact property URL, then Test & connect.",
    ],
    setupUrl: "https://console.cloud.google.com/apis/library/searchconsole.googleapis.com",
    docsUrl: "https://developers.google.com/webmaster-tools/v1/how-tos/authorizing",
    cost: "Google Search Console API use is quota-limited and normally has no per-request API charge.",
    module: "SEO & Growth",
  },
  {
    key: "meta",
    name: "Meta",
    purpose: "Connect owner-authorised Meta assets for verified advertising and business performance data.",
    credentialLabel: "Meta user/system access token",
    credentialPlaceholder: "EAAB…",
    secret: true,
    fields: [{ key: "adAccountId", label: "Ad account ID (optional)", placeholder: "act_123456789" }],
    steps: [
      "Open Meta for Developers and create/select your app.",
      "Authorise the business account and request only the permissions required for the feature you enable.",
      "Paste the resulting access token here and Test & connect.",
    ],
    setupUrl: "https://developers.facebook.com/apps/",
    docsUrl: "https://developers.facebook.com/docs/marketing-apis/",
    cost: "Meta API access itself is not the same as ad spend. Advertising campaigns incur their own media costs.",
    module: "Marketing & Growth",
  },
  {
    key: "google_places",
    name: "Google Places",
    purpose: "Discover businesses by category/location and detect public business details for Company Intelligence.",
    credentialLabel: "Google Maps Platform API key",
    credentialPlaceholder: "AIza…",
    secret: true,
    steps: [
      "Open Google Cloud and enable Places API (New) for your project.",
      "Create a restricted API key and restrict it to Places API and your server/backend where possible.",
      "Paste the key here. Start To Up saves it securely; live Company Intelligence searches will use your account quota.",
    ],
    setupUrl: "https://console.cloud.google.com/google/maps-apis/apis/places-backend.googleapis.com",
    docsUrl: "https://developers.google.com/maps/documentation/places/web-service/get-api-key",
    cost: "Usage can be billable and Google may require a billing prepayment/account verification. Start To Up will show usage warnings before billable searches.",
    module: "Company Intelligence",
  },
  {
    key: "semrush",
    name: "Semrush",
    purpose: "Add advanced keyword, competitor, backlink and traffic-intelligence data when your Semrush plan includes API access.",
    credentialLabel: "Semrush API key",
    credentialPlaceholder: "Paste your Semrush API key",
    secret: true,
    steps: [
      "Open your Semrush account and confirm that your subscription includes API access/units.",
      "Copy the API key from the Semrush API area.",
      "Paste the key here. Start To Up will show unit-cost warnings before requesting paid datasets.",
    ],
    setupUrl: "https://www.semrush.com/api-documentation/",
    docsUrl: "https://developer.semrush.com/",
    cost: "Semrush API access and API units are paid and depend on your Semrush subscription/package.",
    module: "Company Intelligence",
  },
  {
    key: "crm_webhook",
    name: "CRM / Webhook",
    purpose: "Forward leads, forms or workflow events to another CRM or automation service.",
    credentialLabel: "Bearer secret (optional)",
    credentialPlaceholder: "Optional webhook secret",
    secret: true,
    fields: [{ key: "webhookUrl", label: "Webhook URL", placeholder: "https://your-crm.example/webhook" }],
    steps: [
      "Create an incoming webhook in your CRM or automation platform.",
      "Copy the HTTPS webhook URL and optional bearer secret.",
      "Paste the URL and secret here, then Test & connect.",
    ],
    setupUrl: "https://zapier.com/apps/webhook/integrations",
    docsUrl: "https://zapier.com/help/create/code-webhooks/trigger-zaps-from-webhooks",
    cost: "Your CRM/automation provider may charge for workflows, tasks or webhook usage.",
    module: "Sales & CRM",
  },
];

export async function listStartupWorkspaces(): Promise<StartupWorkspace[]> {
  const { data, error } = await db.rpc("my_startup_workspaces");
  if (error) throw error;
  return (data || []) as StartupWorkspace[];
}

export async function createStartupWorkspace(name: string) {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 54) || `company-${Date.now()}`;
  const { data, error } = await db.rpc("create_startup_workspace", { workspace_name: name.trim(), workspace_slug: `${slug}-${Math.random().toString(36).slice(2, 6)}` });
  if (error) throw error;
  return String(data);
}

export async function loadWorkspaceSnapshot(organizationId: string): Promise<StartupWorkspaceSnapshot> {
  const [profile, members, verifications, metrics, tasks, integrations, flags, activity] = await Promise.all([
    db.from("company_profiles").select("*").eq("organization_id", organizationId).maybeSingle(),
    db.from("organization_members").select("organization_id,user_id,workspace_role,joined_at,last_active_at").eq("organization_id", organizationId),
    db.from("company_verification_records").select("id,kind,status,public_label,public_detail,metadata,verified_at").eq("organization_id", organizationId),
    db.from("company_metrics").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(30),
    db.from("workspace_tasks").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(30),
    db.from("startup_os_integrations").select("provider,status,config,external_url,credential_hint,last_checked_at,last_error").eq("organization_id", organizationId),
    db.rpc("current_feature_flags", { org_id: organizationId }),
    db.from("workspace_activities").select("id,action,summary,entity_type,created_at").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(20),
  ]);
  for (const result of [profile, members, verifications, metrics, tasks, integrations, flags, activity]) if (result.error) throw result.error;
  return {
    profile: profile.data || null,
    members: members.data || [],
    verifications: verifications.data || [],
    metrics: metrics.data || [],
    tasks: tasks.data || [],
    integrations: integrations.data || [],
    flags: flags.data || [],
    activity: activity.data || [],
  };
}

export async function saveCompanyProfile(organizationId: string, values: Record<string, unknown>) {
  const allowed = ["trading_name","legal_name","registration_number","business_type","industry","description","website","email","phone","address_line","city","province","country","postal_code","brand_config"];
  const payload: Record<string, unknown> = { organization_id: organizationId, updated_at: new Date().toISOString() };
  for (const key of allowed) if (key in values) payload[key] = values[key];
  const { data, error } = await db.from("company_profiles").upsert(payload, { onConflict: "organization_id" }).select("*").single();
  if (error) throw error;
  await db.from("workspace_activities").insert({ organization_id: organizationId, actor_id: (await supabase.auth.getUser()).data.user?.id, action: "company.profile.updated", summary: "Company profile updated" });
  return data;
}

export async function createWorkspaceTask(organizationId: string, title: string) {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error("Authentication required");
  const { data, error } = await db.from("workspace_tasks").insert({ organization_id: organizationId, title: title.trim(), created_by: user.id }).select("*").single();
  if (error) throw error;
  return data;
}

export async function recordSessionActivity() {
  if (typeof window === "undefined") return;
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return;
  let sessionId = window.localStorage.getItem("start-to-up-session-device-id");
  if (!sessionId) {
    sessionId = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem("start-to-up-session-device-id", sessionId);
  }
  const label = /Mobi|Android/i.test(navigator.userAgent) ? "Mobile browser" : /iPad|Tablet/i.test(navigator.userAgent) ? "Tablet browser" : "Desktop browser";
  await db.from("user_session_activity").upsert({ user_id: user.id, session_fingerprint: sessionId, device_label: label, last_seen_at: new Date().toISOString(), metadata: { timezone: Intl.DateTimeFormat().resolvedOptions().timeZone } }, { onConflict: "user_id,session_fingerprint" });
}

export async function invokeStartupIntegration(action: "status" | "test" | "connect" | "disconnect", organizationId: string, provider?: StartupOsProviderKey, credential?: string, publicConfig?: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("startup-os-provider-connect", { body: { action, organizationId, provider, credential: credential || "", publicConfig: publicConfig || {} } });
  if (error) throw error;
  return data;
}
