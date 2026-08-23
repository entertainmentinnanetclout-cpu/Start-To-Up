import { useEffect, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  ExternalLink,
  Globe2,
  Heart,
  Maximize2,
  MessageCircle,
  MonitorPlay,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import type { EditorialProductShowcase } from "../lib/start-to-up-data";

type PreviewPage = {
  label: string;
  title: string;
  description: string;
  accent?: string;
};

function previewPages(showcase: EditorialProductShowcase): PreviewPage[] {
  if (!Array.isArray(showcase.preview_pages)) return [];
  return showcase.preview_pages.filter(
    (page): page is PreviewPage =>
      page !== null &&
      typeof page === "object" &&
      "label" in page &&
      "title" in page &&
      "description" in page,
  );
}

export function EditorialShowcasePost({
  showcase,
  compact = false,
}: {
  showcase: EditorialProductShowcase;
  compact?: boolean;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const pages = previewPages(showcase);

  useEffect(() => {
    if (!previewOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreviewOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.classList.add("preview-locked");
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("preview-locked");
    };
  }, [previewOpen]);

  return (
    <>
      <article className={`editorial-post${compact ? " editorial-post-compact" : ""}`}>
        <header className="editorial-author">
          <div className="editorial-author-logo">
            {showcase.logo_url ? <img src={showcase.logo_url} alt="" /> : showcase.product_name[0]}
          </div>
          <div>
            <strong>
              {showcase.author_name} <BadgeCheck aria-label="Verified venture" />
            </strong>
            <span>
              {showcase.author_handle} · Published by {showcase.published_by}
            </span>
          </div>
          <span className="editorial-update-pill">PUBLIC BUILD UPDATE</span>
        </header>

        <div className="editorial-cover">
          {showcase.cover_url && <img src={showcase.cover_url} alt="" />}
          <div className="editorial-cover-shade" />
          <div className="editorial-cover-copy">
            <span>
              <Sparkles /> VENTURE SHOWCASE
            </span>
            <h2>{showcase.headline}</h2>
            <button type="button" onClick={() => setPreviewOpen(true)}>
              <MonitorPlay /> Preview the product <Maximize2 />
            </button>
          </div>
          <div className="editorial-mini-browser" aria-hidden="true">
            <div className="mini-browser-bar">
              <i /> <i /> <i /> <span>reskonnect.org</span>
            </div>
            <div className="mini-browser-content">
              <img src={showcase.logo_url || ""} alt="" />
              <strong>Your stay. Your studies. Your future. Connected.</strong>
              <div>
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        </div>

        <div className="editorial-post-body">
          {!compact && <p>{showcase.post_caption}</p>}
          <div className="editorial-tags">
            {showcase.product_tags.map((tag) => (
              <span key={tag}>#{tag.replaceAll(" ", "")}</span>
            ))}
          </div>
          <div className="editorial-collaboration">
            <div>
              <BriefcaseBusiness />
              <span>OPEN FOR COLLABORATION</span>
            </div>
            <strong>Companies and specialists offering related services are invited.</strong>
            {!compact && <p>{showcase.collaboration_brief}</p>}
            <div className="collaboration-service-row">
              {showcase.collaboration_services.slice(0, compact ? 3 : 6).map((service) => (
                <span key={service}>{service}</span>
              ))}
            </div>
          </div>
          <div className="editorial-actions">
            <button type="button" onClick={() => setPreviewOpen(true)}>
              <Globe2 /> Preview
            </button>
            <a href={showcase.website_url || "#"} target="_blank" rel="noreferrer">
              Visit live product <ExternalLink />
            </a>
            <a
              href={`mailto:starttoscale@gmail.com?subject=${encodeURIComponent(`${showcase.product_name} collaboration`)}`}
            >
              Collaborate <ArrowRight />
            </a>
          </div>
          {!compact && (
            <footer className="editorial-social-proof" aria-label="Available post actions">
              <span>
                <Heart /> Support
              </span>
              <span>
                <MessageCircle /> Give feedback
              </span>
              <span>
                <Users /> Collaborate
              </span>
            </footer>
          )}
        </div>
      </article>

      {previewOpen && (
        <div
          className="product-preview-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={`${showcase.product_name} product preview`}
        >
          <button
            className="product-preview-backdrop"
            type="button"
            aria-label="Close preview"
            onClick={() => setPreviewOpen(false)}
          />
          <section className="product-preview-modal">
            <header>
              <div>
                <img src={showcase.logo_url || ""} alt="" />
                <div>
                  <span>INTERACTIVE PRODUCT PREVIEW</span>
                  <strong>{showcase.product_name}</strong>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                aria-label="Close preview"
              >
                <X />
              </button>
            </header>
            <div className="preview-browser-shell">
              <div className="preview-browser-toolbar">
                <i />
                <i />
                <i />
                <span>
                  <Globe2 /> {showcase.website_url?.replace(/^https?:\/\//, "")}
                </span>
              </div>
              <div className="preview-page-grid">
                {pages.map((page, index) => (
                  <article
                    className={`preview-page-card accent-${page.accent || "blue"}`}
                    key={page.label}
                  >
                    <div className="preview-page-chrome">
                      <span>0{index + 1}</span>
                      <small>{page.label}</small>
                    </div>
                    <div className="preview-page-visual">
                      <img src={showcase.logo_url || ""} alt="" />
                      <i />
                      <i />
                      <i />
                    </div>
                    <h3>{page.title}</h3>
                    <p>{page.description}</p>
                  </article>
                ))}
              </div>
            </div>
            <footer>
              <p>
                This is a curated key-page preview. Open the live product for its complete
                functionality and current information.
              </p>
              <a
                href={showcase.website_url || "#"}
                target="_blank"
                rel="noreferrer"
                className="button button-primary"
              >
                Continue to {showcase.product_name} <ExternalLink />
              </a>
            </footer>
          </section>
        </div>
      )}
    </>
  );
}
