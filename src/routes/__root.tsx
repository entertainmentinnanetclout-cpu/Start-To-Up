import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import uxSpeedCss from "../ux-speed.css?url";
import startupAuthorityCss from "../startup-authority.css?url";
import mobilePolishCss from "../mobile-polish.css?url";
import websiteStudioV2Css from "../website-studio-v2.css?url";
import websiteStudioProHardeningCss from "../website-studio-v6-pro-hardening.css?url";
import startupOsCss from "../startup-os.css?url";
import startupOsPhase1Css from "../startup-os-phase1.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

const primaryDomain = "https://www.start-to-up.co.za";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">The page you're looking for doesn't exist or has been moved.</p>
        <div className="mt-6">
          <Link preload="intent" to="/" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">Go home</Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">We couldn't open this view</h1>
        <p className="mt-2 text-sm text-muted-foreground">The network is still available. Retry this view or return to the main experience.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">Retry view</button>
          <a href="/" className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent">Go to home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  ssr: false,
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "Start To Up | Startup Operating Company & Innovation Network" },
      { name: "description", content: "Start To Up helps founders, developers, entrepreneurs, innovators, investors and institutions validate, build, launch, operate and scale startups through practical company-building systems and a professional innovation network." },
      { name: "author", content: "Start To Up Innovation Group" },
      { name: "theme-color", content: "#071449" },
      { property: "og:title", content: "Start To Up | Build the company, not just the idea." },
      { property: "og:description", content: "Startup strategy, product, operations, founder knowledge, collaboration and growth infrastructure in one professional ecosystem." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: primaryDomain },
      { property: "og:image", content: `${primaryDomain}/brand/start-to-up-og-image.png` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Start To Up" },
      { name: "twitter:description", content: "A startup operating company and professional innovation network for serious builders and capital partners." },
      { name: "twitter:image", content: `${primaryDomain}/brand/start-to-up-og-image.png` },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "stylesheet", href: uxSpeedCss },
      { rel: "stylesheet", href: startupAuthorityCss },
      { rel: "stylesheet", href: mobilePolishCss },
      { rel: "stylesheet", href: websiteStudioV2Css },
      { rel: "stylesheet", href: websiteStudioProHardeningCss },
      { rel: "stylesheet", href: startupOsCss },
      { rel: "stylesheet", href: startupOsPhase1Css },
      { rel: "canonical", href: primaryDomain },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/brand/apple-touch-icon.png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "preconnect", href: "https://clawrgsnnmzmcxutiodg.supabase.co" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return <html lang="en"><head><HeadContent /></head><body>{children}<Scripts /></body></html>;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return <QueryClientProvider client={queryClient}><Outlet /></QueryClientProvider>;
}