import { supabase } from "../integrations/supabase/client";

export type StudioProviderKey = "github" | "vercel" | "supabase" | "lovable" | "stripe" | "resend" | "google_business" | "crm_webhook";

export type StudioProviderDefinition = {
  key: StudioProviderKey;
  name: string;
  purpose: string;
  credentialLabel: string;
  credentialPlaceholder: string;
  credentialSecret: boolean;
  fields?: Array<{ key: string; label: string; placeholder: string }>;
  steps: [string, string, string];
  setupUrl: string;
  docsUrl: string;
};

export const studioProviders: StudioProviderDefinition[] = [
  {
    key: "github", name: "GitHub", purpose: "Create or update repositories and keep every generated website under version control.",
    credentialLabel: "Fine-grained personal access token", credentialPlaceholder: "github_pat_…", credentialSecret: true,
    steps: ["Open GitHub token settings and create a fine-grained token.", "Give it access only to the repositories you want Website Studio to manage, with Contents read/write permission.", "Copy the token once, paste it here and choose Test & connect."],
    setupUrl: "https://github.com/settings/personal-access-tokens/new", docsUrl: "https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens",
  },
  {
    key: "vercel", name: "Vercel", purpose: "Deploy generated projects, create previews and connect production domains.",
    credentialLabel: "Vercel access token", credentialPlaceholder: "Paste your Vercel token", credentialSecret: true,
    fields: [{ key: "teamId", label: "Team ID (optional)", placeholder: "team_…" }],
    steps: ["Open Vercel Account Settings and create a new token.", "Copy the token. If you deploy through a team, copy its Team ID too.", "Paste the token here, add the Team ID if needed, then Test & connect."],
    setupUrl: "https://vercel.com/account/settings/tokens", docsUrl: "https://vercel.com/docs/rest-api",
  },
  {
    key: "supabase", name: "Supabase", purpose: "Use a dedicated Supabase project for forms, auth, storage, databases and app functionality.",
    credentialLabel: "Publishable key", credentialPlaceholder: "sb_publishable_…", credentialSecret: false,
    fields: [{ key: "url", label: "Project URL", placeholder: "https://your-project.supabase.co" }],
    steps: ["Open your Supabase project and go to Project Settings → API.", "Copy the Project URL and the publishable key. Never paste a service-role key here.", "Paste both values and Test & connect. Website Studio will verify the public API."],
    setupUrl: "https://supabase.com/dashboard/projects", docsUrl: "https://supabase.com/docs/guides/api/api-keys",
  },
  {
    key: "lovable", name: "Lovable", purpose: "Keep an optional Lovable editing workspace linked while GitHub remains the canonical source repository.",
    credentialLabel: "Project ID", credentialPlaceholder: "Lovable project ID", credentialSecret: false,
    fields: [{ key: "editorUrl", label: "Editor URL", placeholder: "https://lovable.dev/projects/…" }, { key: "previewUrl", label: "Preview URL", placeholder: "https://….lovable.app" }],
    steps: ["Open or create the project in Lovable.", "Copy its project ID/editor URL and, if available, its preview URL.", "Paste the details here and connect. Website Studio keeps GitHub as the portable source of truth."],
    setupUrl: "https://lovable.dev", docsUrl: "https://docs.lovable.dev/",
  },
  {
    key: "stripe", name: "Stripe", purpose: "Collect deposits and payments for appointments, bookings, reservations, applications or orders.",
    credentialLabel: "Stripe secret key", credentialPlaceholder: "sk_live_… or sk_test_…", credentialSecret: true,
    steps: ["Open Stripe Developers → API keys.", "Copy the secret key for Test mode first; switch to Live only when you are ready to charge real customers.", "Paste the key here and Test & connect. The secret stays server-side."],
    setupUrl: "https://dashboard.stripe.com/apikeys", docsUrl: "https://docs.stripe.com/keys",
  },
  {
    key: "resend", name: "Resend", purpose: "Send form notifications, booking confirmations and autoresponder emails.",
    credentialLabel: "Resend API key", credentialPlaceholder: "re_…", credentialSecret: true,
    fields: [{ key: "fromEmail", label: "Verified sender email", placeholder: "hello@yourdomain.co.za" }],
    steps: ["Open Resend API Keys and create a key.", "Verify your sending domain in Resend, then choose a sender email on that domain.", "Paste the key and sender email here, then Test & connect."],
    setupUrl: "https://resend.com/api-keys", docsUrl: "https://resend.com/docs/dashboard/api-keys/introduction",
  },
  {
    key: "google_business", name: "Google Business Profile", purpose: "Import authorized business profile information such as name, location and business details.",
    credentialLabel: "OAuth access token", credentialPlaceholder: "Paste an authorized Google OAuth token", credentialSecret: true,
    steps: ["Open Google Cloud and enable the Business Profile APIs for your project.", "Create OAuth consent/client credentials and authorize the Google account that manages the business profile.", "Paste the resulting access token here and Test & connect. Only authorized profile data will be imported."],
    setupUrl: "https://console.cloud.google.com/apis/library/mybusinessaccountmanagement.googleapis.com", docsUrl: "https://developers.google.com/my-business/content/oauth-overview",
  },
  {
    key: "crm_webhook", name: "CRM / Webhook", purpose: "Forward qualified Website Studio leads to a CRM or automation platform using a webhook.",
    credentialLabel: "Bearer secret (optional)", credentialPlaceholder: "Optional webhook secret", credentialSecret: true,
    fields: [{ key: "webhookUrl", label: "Webhook URL", placeholder: "https://your-crm.example/webhook" }],
    steps: ["Create an incoming webhook in your CRM or automation tool.", "Copy its HTTPS webhook URL and any bearer secret the provider gives you.", "Paste the URL and optional secret here, then Test & connect before enabling lead forwarding."],
    setupUrl: "https://zapier.com/apps/webhook/integrations", docsUrl: "https://zapier.com/help/create/code-webhooks/trigger-zaps-from-webhooks",
  },
];

export type ProviderConnectionStatus = {
  provider: StudioProviderKey;
  status: "disconnected" | "ready" | "connected" | "error";
  credentialHint?: string;
  externalUrl?: string;
  publicConfig?: Record<string, unknown>;
  lastCheckedAt?: string;
  message?: string;
};

export async function connectStudioProvider(projectId: string, provider: StudioProviderKey, credential: string, publicConfig: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("website-studio-provider-connect", { body: { action: "connect", projectId, provider, credential, publicConfig } });
  if (error) throw error;
  return data as ProviderConnectionStatus;
}

export async function testStudioProvider(projectId: string, provider: StudioProviderKey, credential: string, publicConfig: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("website-studio-provider-connect", { body: { action: "test", projectId, provider, credential, publicConfig } });
  if (error) throw error;
  return data as ProviderConnectionStatus;
}

export async function disconnectStudioProvider(projectId: string, provider: StudioProviderKey) {
  const { data, error } = await supabase.functions.invoke("website-studio-provider-connect", { body: { action: "disconnect", projectId, provider } });
  if (error) throw error;
  return data as ProviderConnectionStatus;
}

export async function listStudioProviderStatuses(projectId: string): Promise<ProviderConnectionStatus[]> {
  const { data, error } = await supabase.functions.invoke("website-studio-provider-connect", { body: { action: "status", projectId } });
  if (error) throw error;
  return Array.isArray(data?.connections) ? data.connections : [];
}
