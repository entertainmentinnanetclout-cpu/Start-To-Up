import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { AppShell } from "../../components/app-shell";
import { EditorialShowcasePost } from "../../components/editorial-showcase";
import { DataState, LiveProjectCard } from "../../components/live-data-ui";
import { useEditorialShowcases, useProjects } from "../../lib/start-to-up-data";

export const Route = createFileRoute("/app/explore")({ component: Explore });
function Explore() {
  const projects = useProjects();
  const showcases = useEditorialShowcases();
  return (
    <AppShell title="Explore innovation" eyebrow="REAL PROJECTS · LIVE DATA">
      <section className="explore-hero">
        <div>
          <span className="content-kicker">DISCOVERY ENGINE</span>
          <h2>Find work published by the innovation network.</h2>
        </div>
        <label>
          <Search />
          <input placeholder="Search will be activated with indexed discovery" disabled />
        </label>
      </section>
      <section className="explore-showcase-section">
        <div className="explore-section-label">
          <span>FEATURED PRODUCTS</span>
          <p>Preview key product experiences before opening the live website.</p>
        </div>
        <DataState
          loading={showcases.loading}
          error={showcases.error}
          empty={!showcases.data.length}
        >
          <div className="explore-showcase-grid">
            {showcases.data.map((showcase) => (
              <EditorialShowcasePost compact key={showcase.id} showcase={showcase} />
            ))}
          </div>
        </DataState>
      </section>
      <div className="explore-section-label">
        <span>NETWORK PROJECTS</span>
        <p>Projects published by innovators across the network.</p>
      </div>
      <DataState loading={projects.loading} error={projects.error} empty={!projects.data.length}>
        <div className="project-grid">
          {projects.data.map((project) => (
            <LiveProjectCard key={project.id} project={project} />
          ))}
        </div>
      </DataState>
    </AppShell>
  );
}
