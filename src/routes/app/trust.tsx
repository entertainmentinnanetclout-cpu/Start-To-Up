import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, FileWarning, KeyRound, ShieldCheck } from "lucide-react";
import { AppShell } from "../../components/app-shell";
import { AuthDeferred, DataState } from "../../components/live-data-ui";
import { usePrivateTrustData, useSessionState } from "../../lib/start-to-up-data";

export const Route = createFileRoute("/app/trust")({ component: TrustPage });
function TrustPage() {
  const { session, loading } = useSessionState();
  const records = usePrivateTrustData(session?.user.id);
  if (!loading && !session)
    return (
      <AppShell title="Trust centre" eyebrow="PROTECTION · EVIDENCE · ACCOUNTABILITY">
        <AuthDeferred />
      </AppShell>
    );
  return (
    <AppShell title="Trust centre" eyebrow="PROTECTION · EVIDENCE · ACCOUNTABILITY">
      <div className="trust-grid">
        <Link to="/app/trust" className="trust-card">
          <KeyRound />
          <h2>Protected access</h2>
          <strong>{records.data.accessRequests.length}</strong>
          <p>Confidentiality acceptances, decisions, expiry and revocation history.</p>
        </Link>
        <Link to="/app/trust" className="trust-card">
          <ShieldCheck />
          <h2>Evidence Vault</h2>
          <strong>{records.data.evidence.length}</strong>
          <p>Private evidence history—not a patent or ownership certificate.</p>
        </Link>
        <Link to="/app/trust" className="trust-card">
          <BadgeCheck />
          <h2>Verification</h2>
          <strong>{records.data.verification.length}</strong>
          <p>Identity, investor and organization review requests.</p>
        </Link>
        <Link to="/app/moderation" className="trust-card">
          <FileWarning />
          <h2>Reports</h2>
          <strong>{records.data.reports.length}</strong>
          <p>Content and IP misuse cases with human review and appeal.</p>
        </Link>
      </div>
      <DataState
        loading={records.loading}
        error={records.error}
        empty={
          !records.data.accessRequests.length &&
          !records.data.evidence.length &&
          !records.data.verification.length &&
          !records.data.reports.length
        }
      >
        <div className="trust-list">
          {records.data.accessRequests.map((item) => (
            <article className="trust-row" key={item.id}>
              <KeyRound />
              <div>
                <strong>Protected project access</strong>
                <span>
                  {item.status} · {new Date(item.created_at).toLocaleString()}
                </span>
              </div>
            </article>
          ))}
          {records.data.evidence.map((item) => (
            <article className="trust-row" key={item.id}>
              <ShieldCheck />
              <div>
                <strong>{item.event_type}</strong>
                <span>{new Date(item.created_at).toLocaleString()}</span>
              </div>
            </article>
          ))}
        </div>
      </DataState>
    </AppShell>
  );
}
