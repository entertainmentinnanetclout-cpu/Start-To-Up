import type { WebsiteStudioDraft } from "./website-studio";
import { renderEntertainmentShell, entertainmentCss } from "./website-studio-entertainment-renderer";
import { renderWebsiteStudioHtml, renderWebsiteStudioShell, websiteStudioCss } from "./website-studio-visual-contracts";

const esc = (value: unknown) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

export function renderStudioShell(draft: WebsiteStudioDraft): string {
  return renderEntertainmentShell(draft) || renderWebsiteStudioShell(draft);
}

export function renderStudioCss(draft: WebsiteStudioDraft): string {
  const entertainment = entertainmentCss(draft);
  return entertainment || websiteStudioCss(draft);
}

export function renderStudioHtml(draft: WebsiteStudioDraft): string {
  const entertainment = renderEntertainmentShell(draft);
  if (!entertainment) return renderWebsiteStudioHtml(draft);
  return `<!doctype html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>${esc(draft.seo.title)}</title><meta name="description" content="${esc(draft.seo.description)}"/><style>${entertainmentCss(draft)}</style></head><body>${entertainment}</body></html>`;
}
