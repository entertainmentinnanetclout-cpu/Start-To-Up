// @lovable.dev/vite-tanstack-config already includes the TanStack Start, React,
// Tailwind and Nitro plugins. Keep the hosting preset explicit because the
// shared config otherwise uses a Cloudflare-oriented default during builds.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  nitro: {
    preset: "vercel",
  },
});
