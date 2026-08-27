import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, BadgeCheck, FileCheck2, Mail, Phone, ShieldCheck, Sparkles } from "lucide-react";

export const Route = createFileRoute("/company")({
  component: CompanyPage,
  head: () => ({
    meta: [
      { title: "Company & Verification | Start To Up" },
      {
        name: "description",
        content:
          "Start To Up Innovation Group (Pty) Ltd is a registered South African private company, registered for income tax and certified as a B-BBEE Level 1 Contributor.",
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
            <Sparkles /> COMPANY &amp; VERIFICATION
          </span>
          <h1>Built close to the problem. Structured to operate professionally.</h1>
          <p>
            Start To Up Innovation Group (Pty) Ltd develops ventures, digital products and practical
            growth systems for founders, innovators, businesses and institutions.
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
            <span className="section-label">VERIFIED COMPANY STATUS</span>
            <h2>Registered, tax registered and procurement-ready.</h2>
            <p className="founder-statement">
              “Start To Up exists to give serious ideas a clearer path—from uncertainty and
              isolation to visibility, collaboration and measurable growth.”
            </p>
            <p>
              Start To Up Innovation Group (Pty) Ltd is registered in South Africa as a private
              company. The verification record below is based on company documents supplied directly
              to Start To Up and is kept separate from sensitive tax and director information.
            </p>

            <div className="registration-status">
              <BadgeCheck />
              <div>
                <strong>CIPC-registered private company</strong>
                <span>Registration number 2026/672029/07 • Status: In Business.</span>
              </div>
            </div>

            <div className="registration-status">
              <ShieldCheck />
              <div>
                <strong>SARS income-tax registration confirmed</strong>
                <span>Income-tax registration is confirmed by an official SARS Notice of Registration. The taxpayer reference number is not published.</span>
              </div>
            </div>

            <div className="registration-status">
              <BadgeCheck />
              <div>
                <strong>B-BBEE Level 1 Contributor</strong>
                <span>135% procurement recognition on the supplied certificate.</span>
              </div>
            </div>

            <div className="registration-status">
              <FileCheck2 />
              <div>
                <strong>Verification documents controlled</strong>
                <span>Supporting documents can be supplied for legitimate procurement, partnership or due-diligence requests without exposing sensitive personal or tax identifiers publicly.</span>
              </div>
            </div>

            <p>
              Official regulator and public-body logos are only displayed where published licence terms
              or written authorisation expressly allow the intended third-party use. Start To Up uses its
              own verification indicators where such permission has not been established.
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
