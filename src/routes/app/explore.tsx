import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { AppShell } from "../../components/app-shell";
import { DataState, LiveProjectCard } from "../../components/live-data-ui";
import { useProjects } from "../../lib/start-to-up-data";

export const Route = createFileRoute("/app/explore")({ component: Explore });
function Explore() {
  const projects = useProjects();
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
