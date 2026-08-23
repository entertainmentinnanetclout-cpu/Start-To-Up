import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, Building2 } from "lucide-react";
import { AppShell } from "../../components/app-shell";
import { DataState } from "../../components/live-data-ui";
import { usePhaseThreeData } from "../../lib/start-to-up-data";

export const Route = createFileRoute("/app/programs")({ component: ProgramsPage });
function ProgramsPage() {
  const phase = usePhaseThreeData();
  return (
    <AppShell title="Ecosystem programs" eyebrow="CONSENT-AWARE DEVELOPMENT">
      <div className="phase-two-intro">
        <BarChart3 />
        <div>
          <h2>Programs measure progress without exposing people</h2>
          <p>
            Institutions and government partners receive aggregate reporting only where participants
            explicitly consent. Private profiles and project details are excluded.
          </p>
        </div>
      </div>
      <DataState loading={phase.loading} error={phase.error} empty={!phase.data.programs.length}>
        <div className="trust-grid">
          {phase.data.programs.map((program) => (
            <article className="trust-card" key={program.id}>
              <Building2 />
              <span className="status-pill">{program.status}</span>
              <h2>{program.title}</h2>
              <p>{program.description}</p>
              <small>
                {program.public_metrics_enabled
                  ? "Public aggregate metrics enabled"
                  : "Metrics restricted"}
              </small>
            </article>
          ))}
        </div>
      </DataState>
    </AppShell>
  );
}
