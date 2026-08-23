import { createFileRoute } from "@tanstack/react-router";
import { BriefcaseBusiness, MapPin } from "lucide-react";
import { AppShell } from "../../components/app-shell";
import { AuthDeferred, DataState } from "../../components/live-data-ui";
import { usePublicTrustData, useSessionState } from "../../lib/start-to-up-data";

export const Route = createFileRoute("/app/collaboration")({ component: CollaborationPage });
function CollaborationPage() {
  const trust = usePublicTrustData();
  const { session } = useSessionState();
  return (
    <AppShell title="Collaboration board" eyebrow="BUILD TOGETHER">
      <div className="phase-two-intro">
        <BriefcaseBusiness />
        <div>
          <h2>Open, structured project requirements</h2>
          <p>
            Applications preserve role, contribution and compensation disclosures. Attribution never
            automatically creates equity or legal ownership.
          </p>
        </div>
      </div>
      <DataState
        loading={trust.loading}
        error={trust.error}
        empty={!trust.data.collaborations.length}
      >
        <div className="trust-grid">
          {trust.data.collaborations.map((item) => (
            <article className="trust-card" key={item.id}>
              <span className="status-pill">{item.status}</span>
              <h2>{item.requirement}</h2>
              <p>{item.description || "No additional description supplied."}</p>
              <div className="skill-line">
                {item.skills.map((skill) => (
                  <span key={skill}>{skill}</span>
                ))}
              </div>
              <small>
                <MapPin /> {item.is_remote ? "Remote" : item.location || "Flexible"}
              </small>
              <button disabled={!session}>Apply to collaborate</button>
            </article>
          ))}
        </div>
      </DataState>
      {!session ? <AuthDeferred /> : null}
    </AppShell>
  );
}
