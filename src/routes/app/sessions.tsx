import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Video } from "lucide-react";
import { AppShell } from "../../components/app-shell";
import { AuthDeferred, DataState } from "../../components/live-data-ui";
import { usePublicTrustData, useSessionState } from "../../lib/start-to-up-data";

export const Route = createFileRoute("/app/sessions")({ component: SessionsPage });
function SessionsPage() {
  const trust = usePublicTrustData();
  const { session } = useSessionState();
  return (
    <AppShell title="Expert sessions" eyebrow="SEMINARS · WEBINARS · KNOWLEDGE">
      <div className="phase-two-intro">
        <Video />
        <div>
          <h2>Learn from experienced builders</h2>
          <p>
            Phase 2 supports scheduled sessions and protected external meeting links. Native
            livestreaming remains Phase 3.
          </p>
        </div>
      </div>
      <DataState loading={trust.loading} error={trust.error} empty={!trust.data.sessions.length}>
        <div className="trust-grid">
          {trust.data.sessions.map((item) => (
            <article className="trust-card" key={item.id}>
              <CalendarDays />
              <span className="status-pill">{item.status}</span>
              <h2>{item.title}</h2>
              <p>{item.summary}</p>
              <small>{new Date(item.starts_at).toLocaleString()}</small>
              <button disabled={!session}>Request registration</button>
            </article>
          ))}
        </div>
      </DataState>
      {!session ? <AuthDeferred /> : null}
    </AppShell>
  );
}
