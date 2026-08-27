import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, BadgeCheck, Mail, Phone, Sparkles } from "lucide-react";

export const Route = createFileRoute("/company")({
  component: CompanyPage,
  head: () => ({
    meta: [
      { title: "Company & Founder | Start To Up" },
      {
        name: "description",
        content:
          "Meet Start To Up Innovation Group, a registered South African company with tax registration and a B-BBEE certificate on file, and founder Ayanda Lawrence Msizi Dube.",
      },
    ],
  }),
});

function CompanyPage() {
  return (
    <div className="company-page">
      <header className="venture-page-header shell-width">
        <Link to="/">
          <img src="/brand/start-to-up-logo-white.png" alt="Start To Up" />
        </Link>
        <Link to="/" className="venture-back">
          <ArrowLeft /> Company home
        </Link>
      </header>
      <main>
        <section className="company-page-hero shell-width">
          <span>
            <Sparkles /> COMPANY &amp; LEADERSHIP
          </span>
          <h1>Built close to the problem. Designed for measurable progress.</h1>
          <p>
            Start To Up Innovation Group develops ventures, digital products and practical growth
            systems for founders, innovators, businesses and institutions.
          </p>
        </section>
        <section className="company-founder-card shell-width">
          <div className="founder-portrait-wrap">
            <img src="/brand/founder-ayanda-dube.webp" alt="Ayanda Lawrence Msizi Dube" />
            <div>
              <span>FOUNDER &amp; DIRECTOR</span>
              <strong>Ayanda Lawrence Msizi Dube</strong>
            </div>
          </div>
          <div className="founder-copy">
            <span className="section-label">FOUNDER-LED BY DESIGN</span>
            <h2>Creating the infrastructure serious ideas need.</h2>
            <p className="founder-statement">
              “Start To Up exists to give serious ideas a clearer path—from uncertainty and
              isolation to visibility, collaboration and measurable growth.”
            </p>
            <p>
              Ayanda Lawrence Msizi Dube combines practical startup building, digital product
              development and ecosystem thinking. Start To Up begins lean, works with specialist
              delivery partners where required and grows alongside the ventures it supports.
            </p>
            <div className="registration-status">
              <BadgeCheck />
              <div>
                <strong>Registered South African company</strong>
                <span>Company registration is complete and the business is operating as a registered entity.</span>
              </div>
            </div>
            <div className="registration-status">
              <BadgeCheck />
              <div>
                <strong>Tax registered</strong>
                <span>The company is registered for South African tax administration. This statement does not imply a separate tax-compliance certification.</span>
              </div>
            </div>
            <div className="registration-status">
              <BadgeCheck />
              <div>
                <strong>B-BBEE certificate on file</strong>
                <span>Current verification documentation is available for legitimate due-diligence and procurement requests.</span>
              </div>
            </div>
            <p>
              Regulator and public-body logos are only displayed where their published terms or written
              permission expressly allow third-party use. Verification documents can be supplied directly
              where appropriate.
            </p>
          </div>
        </section>
        <section className="company-contact-band shell-width">
          <div>
            <span>START A CONVERSATION</span>
            <h2>Build, partner or grow with us.</h2>
          </div>
          <div>
            <a href="mailto:starttoscale@gmail.com">
              <Mail /> starttoscale@gmail.com
            </a>
            <a href="tel:+27751995752">
              <Phone /> 075 199 5752
            </a>
            <a
              className="button carousel-primary"
              href="mailto:starttoscale@gmail.com?subject=Start%20To%20Up%20enquiry"
            >
              Contact the company <ArrowRight />
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
