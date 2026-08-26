export type StudioIntegrationProvider =
  | "github"
  | "vercel"
  | "supabase"
  | "lovable"
  | "stripe"
  | "resend"
  | "google_business"
  | "shopify"
  | "wordpress"
  | "crm_webhook";

export type StudioIntegrationField = {
  key: string;
  label: string;
  placeholder: string;
  secret?: boolean;
  help?: string;
};

export type StudioIntegrationGuide = {
  provider: StudioIntegrationProvider;
  name: string;
  purpose: string;
  officialUrl: string;
  docsUrl: string;
  credentialKind: "secret" | "public" | "mixed" | "handoff";
  fields: StudioIntegrationField[];
  steps: Array<{ title: string; detail: string; url?: string }>;
};

export const websiteStudioIntegrationGuides: StudioIntegrationGuide[] = [
  {
    provider: "github",
    name: "GitHub",
    purpose: "Sync the complete generated source project to a repository.",
    officialUrl: "https://github.com/settings/personal-access-tokens/new",
    docsUrl: "https://docs.github.com/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens",
    credentialKind: "secret",
    fields: [
      { key: "token", label: "Fine-grained access token", placeholder: "github_pat_…", secret: true, help: "Grant repository Contents read/write access only for the repository you want Website Studio to manage." },
      { key: "owner", label: "Repository owner", placeholder: "your-github-name" },
      { key: "repository", label: "Repository", placeholder: "my-business-website" },
      { key: "branch", label: "Branch", placeholder: "main" },
    ],
    steps: [
      { title: "Create a token", detail: "Open GitHub's fine-grained token screen and choose only the repository Website Studio should publish to.", url: "https://github.com/settings/personal-access-tokens/new" },
      { title: "Allow file updates", detail: "Under Repository permissions set Contents to Read and write. Nothing else is required for normal source publishing." },
      { title: "Paste and test", detail: "Paste the token here, enter the repository details, then press Test connection. Website Studio stores the secret encrypted server-side." },
    ],
  },
  {
    provider: "vercel",
    name: "Vercel",
    purpose: "Deploy previews, production builds and custom domains.",
    officialUrl: "https://vercel.com/account/settings/tokens",
    docsUrl: "https://vercel.com/docs/rest-api",
    credentialKind: "secret",
    fields: [
      { key: "token", label: "Vercel access token", placeholder: "Paste Vercel token", secret: true },
      { key: "teamId", label: "Team ID (optional)", placeholder: "team_…", help: "Leave blank for your personal Vercel account." },
      { key: "projectName", label: "Project name", placeholder: "my-business-site" },
    ],
    steps: [
      { title: "Create a Vercel token", detail: "Open Vercel Account Settings → Tokens and create a token for Website Studio.", url: "https://vercel.com/account/settings/tokens" },
      { title: "Choose where to deploy", detail: "If you use a Vercel team, copy its Team ID. Otherwise leave Team ID empty." },
      { title: "Connect and deploy", detail: "Paste the token, press Test connection, then Website Studio can deploy this project's generated source and manage domains." },
    ],
  },
  {
    provider: "supabase",
    name: "Supabase",
    purpose: "Connect a dedicated backend for forms, auth, CMS and custom application data.",
    officialUrl: "https://supabase.com/dashboard/projects",
    docsUrl: "https://supabase.com/docs/guides/getting-started",
    credentialKind: "public",
    fields: [
      { key: "url", label: "Project URL", placeholder: "https://xxxx.supabase.co" },
      { key: "publishableKey", label: "Publishable key", placeholder: "sb_publishable_…", help: "Use the browser-safe publishable key, never a service-role key." },
    ],
    steps: [
      { title: "Create or open a project", detail: "Open the Supabase dashboard and select the project your website should use.", url: "https://supabase.com/dashboard/projects" },
      { title: "Copy browser-safe details", detail: "From Project Settings → API copy the Project URL and Publishable key. Do not paste a service-role key." },
      { title: "Connect", detail: "Paste both values and test. Website Studio will place only browser-safe values in generated environment examples." },
    ],
  },
  {
    provider: "lovable",
    name: "Lovable",
    purpose: "Keep an optional advanced AI-development handoff while GitHub remains canonical source control.",
    officialUrl: "https://lovable.dev/",
    docsUrl: "https://docs.lovable.dev/",
    credentialKind: "handoff",
    fields: [
      { key: "projectId", label: "Lovable project ID", placeholder: "Project ID" },
      { key: "editorUrl", label: "Lovable editor URL", placeholder: "https://lovable.dev/projects/…" },
      { key: "previewUrl", label: "Lovable preview URL", placeholder: "https://…" },
    ],
    steps: [
      { title: "Create/open your Lovable project", detail: "Open Lovable and create a project for advanced AI-assisted changes.", url: "https://lovable.dev/" },
      { title: "Keep GitHub as the source of truth", detail: "Connect the same GitHub repository where Website Studio publishes your portable source." },
      { title: "Save the handoff links", detail: "Paste the project/editor/preview links here so your team can jump between Website Studio, GitHub and Lovable without losing context." },
    ],
  },
  {
    provider: "stripe",
    name: "Stripe",
    purpose: "Accept booking deposits and payments through hosted Stripe Checkout.",
    officialUrl: "https://dashboard.stripe.com/apikeys",
    docsUrl: "https://docs.stripe.com/keys",
    credentialKind: "secret",
    fields: [{ key: "token", label: "Stripe secret key", placeholder: "sk_test_… or sk_live_…", secret: true }],
    steps: [
      { title: "Open Stripe API keys", detail: "Use test mode first. Copy your Secret key from Developers → API keys.", url: "https://dashboard.stripe.com/apikeys" },
      { title: "Paste the secret key", detail: "Website Studio encrypts it server-side. It is never written to the browser, exported ZIP or GitHub repository." },
      { title: "Test a booking", detail: "After connection, enable a booking deposit and publish. Checkout uses Stripe-hosted payment pages and returns to your website." },
    ],
  },
  {
    provider: "resend",
    name: "Resend",
    purpose: "Send form notifications and customer autoresponders.",
    officialUrl: "https://resend.com/api-keys",
    docsUrl: "https://resend.com/docs/introduction",
    credentialKind: "secret",
    fields: [
      { key: "token", label: "Resend API key", placeholder: "re_…", secret: true },
      { key: "fromEmail", label: "Verified sender email", placeholder: "hello@yourdomain.co.za" },
    ],
    steps: [
      { title: "Verify a sending domain", detail: "In Resend add your domain and complete its DNS verification.", url: "https://resend.com/domains" },
      { title: "Create an API key", detail: "Create a Resend API key and copy it once.", url: "https://resend.com/api-keys" },
      { title: "Connect and enable messages", detail: "Paste the key and a verified From email, test the connection, then enable form autoresponders in Forms & CRM." },
    ],
  },
  {
    provider: "google_business",
    name: "Google Business Profile",
    purpose: "Import structured public business information after Google authorization is configured.",
    officialUrl: "https://console.cloud.google.com/apis/library/mybusinessbusinessinformation.googleapis.com",
    docsUrl: "https://developers.google.com/my-business",
    credentialKind: "mixed",
    fields: [
      { key: "clientId", label: "OAuth Client ID", placeholder: "…apps.googleusercontent.com" },
      { key: "clientSecret", label: "OAuth Client Secret", placeholder: "Client secret", secret: true },
    ],
    steps: [
      { title: "Enable the Business Profile API", detail: "Open Google Cloud and enable the Business Profile APIs for your project.", url: "https://console.cloud.google.com/apis/library/mybusinessbusinessinformation.googleapis.com" },
      { title: "Create OAuth credentials", detail: "Create a Web application OAuth client and add your Website Studio callback URL shown by the connector." },
      { title: "Connect your Google account", detail: "Save the client credentials, then authorize the Business Profile account you want to import from." },
    ],
  },
  {
    provider: "shopify",
    name: "Shopify",
    purpose: "Import products or connect an existing Shopify store.",
    officialUrl: "https://admin.shopify.com/",
    docsUrl: "https://shopify.dev/docs/api/admin-rest",
    credentialKind: "secret",
    fields: [
      { key: "storeDomain", label: "Store domain", placeholder: "your-store.myshopify.com" },
      { key: "token", label: "Admin API access token", placeholder: "shpat_…", secret: true },
    ],
    steps: [
      { title: "Open Shopify admin", detail: "Go to Settings → Apps and sales channels → Develop apps and create an app for Website Studio.", url: "https://admin.shopify.com/" },
      { title: "Allow only needed data", detail: "Grant read_products for imports. Add write permissions only if you later choose two-way sync." },
      { title: "Paste and test", detail: "Enter your .myshopify.com domain and Admin API token, then test before importing products." },
    ],
  },
  {
    provider: "wordpress",
    name: "WordPress",
    purpose: "Import posts/pages and optionally authenticate to a WordPress site.",
    officialUrl: "https://wordpress.org/documentation/article/application-passwords/",
    docsUrl: "https://developer.wordpress.org/rest-api/",
    credentialKind: "mixed",
    fields: [
      { key: "siteUrl", label: "WordPress site URL", placeholder: "https://example.com" },
      { key: "username", label: "WordPress username", placeholder: "editor" },
      { key: "token", label: "Application password", placeholder: "xxxx xxxx xxxx xxxx", secret: true },
    ],
    steps: [
      { title: "Confirm the REST API works", detail: "Open yoursite.com/wp-json/wp/v2/posts. Public imports may work without a credential." },
      { title: "Create an Application Password", detail: "For private/authenticated content, create an Application Password under your WordPress user profile.", url: "https://wordpress.org/documentation/article/application-passwords/" },
      { title: "Connect", detail: "Paste the site URL, username and application password, then test before importing." },
    ],
  },
  {
    provider: "crm_webhook",
    name: "CRM / Webhook",
    purpose: "Send new leads to your CRM, automation platform or custom webhook.",
    officialUrl: "https://zapier.com/apps/webhook/integrations",
    docsUrl: "https://help.zapier.com/hc/en-us/articles/8496288690317-Trigger-Zaps-from-webhooks",
    credentialKind: "mixed",
    fields: [
      { key: "webhookUrl", label: "Webhook URL", placeholder: "https://hooks.example.com/…" },
      { key: "token", label: "Bearer token (optional)", placeholder: "Optional secret", secret: true },
    ],
    steps: [
      { title: "Create a webhook receiver", detail: "Use your CRM, Zapier, Make or your own backend to create an HTTPS webhook URL.", url: "https://zapier.com/apps/webhook/integrations" },
      { title: "Copy the URL", detail: "Paste the HTTPS webhook URL. If the receiver needs Bearer authentication, add its secret token too." },
      { title: "Send a test lead", detail: "Test the connection, then submit a Website Studio form. New leads can be forwarded automatically while remaining in the built-in inbox." },
    ],
  },
];

export function integrationGuide(provider: StudioIntegrationProvider) {
  return websiteStudioIntegrationGuides.find((guide) => guide.provider === provider)!;
}
