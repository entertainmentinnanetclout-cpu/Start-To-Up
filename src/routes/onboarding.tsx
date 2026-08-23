import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, LockKeyhole, ShieldCheck } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/onboarding")({ component: OnboardingPage });

const identities = [
  "Innovator",
  "Founder",
  "Developer",
  "Engineer",
  "Technician",
  "Researcher",
  "Designer",
  "Student Innovator",
  "Mentor",
  "Investor",
  "Institution",
];

function OnboardingPage() {
  const [selected, setSelected] = useState<string[]>(["Innovator"]);
  const [accepted, setAccepted] = useState(false);
  function toggleIdentity(identity: string) {
    setSelected((current) =>
      current.includes(identity)
        ? current.filter((item) => item !== identity)
        : [...current, identity],
    );
  }
  return (
    <div className="onboarding-page">
      <header>
        <Link to="/">
          <img src="/brand/start-to-up-logo-primary.png" alt="Start To Up" />
        </Link>
        <span>Step 1 of 10</span>
        <button>Save and exit</button>
      </header>
      <div className="onboarding-progress">
        <span style={{ width: "10%" }} />
      </div>
      <main className="onboarding-main">
        <aside>
          <span className="content-kicker">YOUR INNOVATION PASSPORT</span>
          <h1>How do you contribute to innovation?</h1>
          <p>Select every identity that describes your current work. You can update these later.</p>
          <div className="onboarding-security">
            <ShieldCheck />
            <div>
              <strong>Why we ask</strong>
              <span>
                Your identities improve project, collaborator and opportunity recommendations.
              </span>
            </div>
          </div>
        </aside>
        <section>
          <div className="identity-grid">
            {identities.map((identity) => (
              <button
                className={selected.includes(identity) ? "selected" : ""}
                key={identity}
                onClick={() => toggleIdentity(identity)}
              >
                <span>{identity.slice(0, 2).toUpperCase()}</span>
                <strong>{identity}</strong>
                {selected.includes(identity) ? <Check /> : null}
              </button>
            ))}
          </div>
          <label className="commitment-check">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(event) => setAccepted(event.target.checked)}
            />
            <span>
              <strong>I am joining for genuine innovation and professional collaboration.</strong>I
              understand that unrelated lifestyle content, plagiarism, fraudulent investment
              activity and misuse of protected work are prohibited.
            </span>
          </label>
        </section>
      </main>
      <footer>
        <Link to="/auth" className="button button-ghost">
          <ArrowLeft /> Back
        </Link>
        <div>
          <LockKeyhole /> Your selections remain private until you complete onboarding.
        </div>
        <Link
          to="/app/home"
          className={`button button-primary ${!accepted ? "disabled" : ""}`}
          aria-disabled={!accepted}
        >
          Continue <ArrowRight />
        </Link>
      </footer>
    </div>
  );
}
