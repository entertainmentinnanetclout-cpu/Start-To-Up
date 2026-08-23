import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Plus } from "lucide-react";
import { AppShell } from "../../components/app-shell";
import { EditorialShowcasePost } from "../../components/editorial-showcase";
import { DataState, LiveProjectCard } from "../../components/live-data-ui";
import { useEditorialShowcases, useProjects, usePublicTrustData } from "../../lib/start-to-up-data";

export const Route = createFileRoute("/app/home")({ component: HomeFeed });

function HomeFeed() {
  const projects = useProjects();
  const showcases = useEditorialShowcases();
  const trust = usePublicTrustData();
  return (
    <AppShell title="Your innovation feed" eyebrow="LIVE FROM THE NETWORK">
      <div className="app-grid feed-layout">
        <section className="feed-column">
          <div className="composer-card">
            <div className="avatar avatar-indigo">ST</div>
            <Link to="/app/create">Share a genuine innovation update</Link>
            <button>
              <Plus size={18} /> Create
            </button>
          </div>
          <DataState
            loading={showcases.loading}
            error={showcases.error}
            empty={!showcases.data.length}
          >
            <div className="editorial-feed-stack">
              {showcases.data.map((showcase) => (
                <EditorialShowcasePost key={showcase.id} showcase={showcase} />
              ))}
            </div>
          </DataState>
          <DataState
            loading={projects.loading}
            error={projects.error}
            empty={!projects.data.length}
          >
            <div className="project-grid">
              {projects.data.map((project) => (
                <LiveProjectCard key={project.id} project={project} />
              ))}
            </div>
          </DataState>
        </section>
        <aside className="right-rail">
          <div className="rail-card">
            <div className="rail-title">
              <span>Open collaborations</span>
              <Link to="/app/collaboration">See all</Link>
            </div>
            <DataState
              loading={trust.loading}
              error={trust.error}
              empty={!trust.data.collaborations.length}
            >
              {trust.data.collaborations.slice(0, 4).map((item) => (
                <div className="person-row" key={item.id}>
                  <div>
                    <strong>{item.requirement}</strong>
                    <span>{item.is_remote ? "Remote" : item.location || "Location flexible"}</span>
                  </div>
                </div>
              ))}
            </DataState>
            <Link to="/app/collaboration" className="rail-link">
              Open collaboration board <ArrowRight size={15} />
            </Link>
          </div>
          <div className="rail-card">
            <div className="rail-title">
              <span>Expert sessions</span>
              <Link to="/app/sessions">Directory</Link>
            </div>
            <DataState
              loading={trust.loading}
              error={trust.error}
              empty={!trust.data.sessions.length}
            >
              {trust.data.sessions.slice(0, 3).map((session) => (
                <div className="person-row" key={session.id}>
                  <div>
                    <strong>{session.title}</strong>
                    <span>{new Date(session.starts_at).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </DataState>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
