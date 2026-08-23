import { createFileRoute } from "@tanstack/react-router";
import { FileWarning, Scale } from "lucide-react";
import { AppShell } from "../../components/app-shell";
import { GuestReportForm } from "../../components/guest-action-form";
import { AuthDeferred } from "../../components/live-data-ui";
import { submitContentReport } from "../../lib/start-to-up-data";

export const Route = createFileRoute("/app/moderation")({ component: ModerationPage });
function ModerationPage() {
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
      <div className="trust-grid moderation-grid">
        <article className="trust-card">
          <FileWarning />
          <h2>Content report</h2>
          <p>Report irrelevant, fraudulent, abusive or unsafe platform activity.</p>
          <GuestReportForm
            onSubmit={(subjectId, category, description, email, captchaToken) =>
              submitContentReport("content", subjectId, category, description, email, captchaToken)
            }
          />
        </article>
        <article className="trust-card">
          <Scale />
          <h2>IP misuse report</h2>
          <p>
            Legal/IP claims require a permanent identity, evidence, original dates and a good-faith
            declaration.
          </p>
          <AuthDeferred />
        </article>
      </div>
    </AppShell>
  );
}
