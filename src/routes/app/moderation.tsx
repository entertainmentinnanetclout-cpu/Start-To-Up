import { createFileRoute } from "@tanstack/react-router";
import { FileWarning, Scale } from "lucide-react";
import { AppShell } from "../../components/app-shell";
import { AuthDeferred } from "../../components/live-data-ui";
import { useSessionState } from "../../lib/start-to-up-data";

export const Route = createFileRoute("/app/moderation")({ component: ModerationPage });
function ModerationPage() {
  const { session, loading } = useSessionState();
  return (
    <AppShell title="Safety and reports" eyebrow="HUMAN-REVIEWED ACCOUNTABILITY">
      <div className="phase-two-intro">
        <Scale />
        <div>
          <h2>Transparent reporting and appeal workflows</h2>
          <p>
            Content and IP misuse reports preserve evidence and status history. Permanent bans and
            IP ownership decisions require human review.
          </p>
        </div>
      </div>
      {!loading && !session ? (
        <AuthDeferred />
      ) : (
        <div className="trust-grid">
          <article className="trust-card">
            <FileWarning />
            <h2>Content report</h2>
            <p>Report irrelevant, fraudulent, abusive or unsafe platform activity.</p>
            <button>Start report</button>
          </article>
          <article className="trust-card">
            <Scale />
            <h2>IP misuse report</h2>
            <p>
              Submit original project dates, evidence, registration information and a good-faith
              declaration.
            </p>
            <button>Start IP report</button>
          </article>
        </div>
      )}
    </AppShell>
  );
}
