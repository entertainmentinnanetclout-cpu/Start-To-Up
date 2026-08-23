import { createFileRoute } from "@tanstack/react-router";
import { Play, Radio, Video } from "lucide-react";
import { AppShell } from "../../components/app-shell";
import { DataState } from "../../components/live-data-ui";
import { usePhaseThreeData } from "../../lib/start-to-up-data";

export const Route = createFileRoute("/app/media")({ component: MediaPage });
function MediaPage() {
  const phase = usePhaseThreeData();
  return (
    <AppShell title="Build media" eyebrow="REELS · LIVE · REPLAYS">
      <div className="phase-two-intro">
        <Video />
        <div>
          <h2>Innovation media, not general entertainment</h2>
          <p>
            Prototype demonstrations, research results, testing, technical processes and expert
            replays appear here from live Supabase records.
          </p>
        </div>
      </div>
      <section className="content-heading">
        <div>
          <h2>
            <Radio /> Live and scheduled
          </h2>
          <p>Protected join links are never exposed in the public directory.</p>
        </div>
      </section>
      <DataState loading={phase.loading} error={phase.error} empty={!phase.data.events.length}>
        <div className="trust-grid">
          {phase.data.events.map((event) => (
            <article className="trust-card" key={event.id}>
              <span className="status-pill">{event.status}</span>
              <h2>{event.title}</h2>
              <p>{event.summary}</p>
              <small>{new Date(event.starts_at).toLocaleString()}</small>
            </article>
          ))}
        </div>
      </DataState>
      <section className="content-heading phase-section">
        <div>
          <h2>
            <Play /> Published media
          </h2>
          <p>Build Reels, project video, research demonstrations and webinar replays.</p>
        </div>
      </section>
      <DataState loading={phase.loading} error={phase.error} empty={!phase.data.media.length}>
        <div className="trust-grid">
          {phase.data.media.map((media) => (
            <article className="trust-card" key={media.id}>
              <Play />
              <span className="status-pill">{media.kind.replaceAll("_", " ")}</span>
              <h2>{media.title}</h2>
              <p>{media.caption || "No caption supplied."}</p>
              <small>
                {media.language_code.toUpperCase()} ·{" "}
                {media.duration_seconds ? `${media.duration_seconds}s` : "Duration pending"}
              </small>
            </article>
          ))}
        </div>
      </DataState>
    </AppShell>
  );
}
