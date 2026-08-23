import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Building2,
  GraduationCap,
  Home,
  Sparkles,
} from "lucide-react";
import { EditorialShowcasePost } from "../components/editorial-showcase";
import { DataState } from "../components/live-data-ui";
import { useEditorialShowcases } from "../lib/start-to-up-data";

export const Route = createFileRoute("/ventures")({
  component: VenturesPage,
  head: () => ({
    meta: [
      { title: "Ventures & Products | Start To Up" },
      {
        name: "description",
        content: "Explore products and ventures built by Start To Up, including ResKonnect.",
      },
    ],
  }),
});

function VenturesPage() {
  const showcases = useEditorialShowcases();
  return (
    <div className="venture-page">
      <header className="venture-page-header shell-width">
        <Link to="/">
          <img src="/brand/start-to-up-logo-white.png" alt="Start To Up" />
        </Link>
        <Link to="/" className="venture-back">
          <ArrowLeft /> Company home
        </Link>
      </header>
      <main>
        <section className="venture-page-hero shell-width">
          <span>
            <Sparkles /> VENTURES &amp; PRODUCTS
          </span>
          <h1>We measure ambition by what makes it into the world.</h1>
          <p>
            Start To Up builds and supports purposeful digital ventures, each designed around a real
            problem, a defined community and a route to measurable impact.
          </p>
        </section>
        <section className="venture-live-preview shell-width">
          <div className="explore-section-label light">
            <span>EXPERIENCE BEFORE EXIT</span>
            <p>Open a curated key-page preview without leaving Start To Up.</p>
          </div>
          <DataState
            loading={showcases.loading}
            error={showcases.error}
            empty={!showcases.data.length}
          >
            {showcases.data.slice(0, 1).map((showcase) => (
              <EditorialShowcasePost compact key={showcase.id} showcase={showcase} />
            ))}
          </DataState>
        </section>
        <section className="venture-case shell-width">
          <div className="case-brand">
            <span>PORTFOLIO · 01</span>
            <img src="/brand/reskonnect-product-icon.png" alt="ResKonnect symbol" />
            <h2>RESKONNECT</h2>
            <small>LIVING · AI · OPPORTUNITY</small>
          </div>
          <div className="case-story">
            <span className="live-product-pill">
              <i /> LIVE PRODUCT
            </span>
            <h2>Connecting where people live to where their futures begin.</h2>
            <p>
              ResKonnect is a South African living, digital tools and youth-opportunity ecosystem.
              It helps students, parents, private tenants, landlords and partners move through
              accommodation discovery, application readiness and pathways to opportunity.
            </p>
            <div className="case-pillar-grid">
              <article>
                <Home />
                <strong>Living</strong>
                <p>Verified accommodation discovery, private rentals and property partnerships.</p>
              </article>
              <article>
                <Building2 />
                <strong>Digital tools</strong>
                <p>Application readiness, APS guidance and connected support journeys.</p>
              </article>
              <article>
                <GraduationCap />
                <strong>Opportunity</strong>
                <p>WIL support, career pathways and youth-development connections.</p>
              </article>
            </div>
            <div className="case-actions">
              <a
                href="https://www.reskonnect.org/"
                target="_blank"
                rel="noreferrer"
                className="button carousel-primary"
              >
                Visit live product <ArrowRight />
              </a>
              <a
                href="https://www.reskonnect.org/about"
                target="_blank"
                rel="noreferrer"
                className="button carousel-secondary"
              >
                About ResKonnect
              </a>
            </div>
          </div>
        </section>
        <section className="venture-standard shell-width">
          <BadgeCheck />
          <div>
            <span>THE START TO UP STANDARD</span>
            <h2>Real users. Real infrastructure. Real accountability.</h2>
            <p>
              Every venture should be more than a pitch: it should have a clear user, a responsible
              operating model, credible technology and a pathway to sustainable impact.
            </p>
          </div>
        </section>
        <section className="venture-page-cta shell-width">
          <span>YOUR VENTURE COULD BE NEXT</span>
          <h2>Let’s turn the concept into something people can experience.</h2>
          <a
            href="mailto:starttoscale@gmail.com?subject=Build%20a%20venture%20with%20Start%20To%20Up"
            className="button carousel-primary"
          >
            Build with us <ArrowRight />
          </a>
        </section>
      </main>
    </div>
  );
}
