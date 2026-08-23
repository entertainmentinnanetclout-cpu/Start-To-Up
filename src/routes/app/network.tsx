import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { AppShell } from "../../components/app-shell";
import { DataState } from "../../components/live-data-ui";
import { useProfiles } from "../../lib/start-to-up-data";

export const Route = createFileRoute("/app/network")({ component: NetworkPage });
function NetworkPage() {
  const profiles = useProfiles();
  return (
    <AppShell title="Innovation network" eyebrow="REAL MEMBER DIRECTORY">
      <DataState loading={profiles.loading} error={profiles.error} empty={!profiles.data.length}>
        <div className="network-grid">
          {profiles.data.map((profile) => (
            <article className="network-card" key={profile.id}>
              <div className="avatar avatar-gradient">
                {profile.display_name.slice(0, 2).toUpperCase()}
              </div>
              <h2>{profile.display_name}</h2>
              <p>{profile.bio || "No professional biography published."}</p>
              <small>
                {[profile.city, profile.country].filter(Boolean).join(", ") || "Location private"}
              </small>
              <div className="skill-line">
                <span>{profile.is_verified ? "Verified" : "Unverified"}</span>
                {profile.open_to_collaboration ? <span>Open to collaborate</span> : null}
              </div>
            </article>
          ))}
        </div>
      </DataState>
      <section className="collaboration-board">
        <div>
          <span className="content-kicker">OPEN COLLABORATIONS</span>
          <h2>Find projects looking for contributors</h2>
        </div>
        <Link to="/app/collaboration" className="button button-primary">
          Open board <ArrowUpRight />
        </Link>
      </section>
    </AppShell>
  );
}
