import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, FlaskConical, Plus, Radio, ShieldCheck, Sparkles } from "lucide-react";
import { AppShell } from "../../components/app-shell";
import { ProjectCard, demoProjects } from "../../components/social-ui";

export const Route = createFileRoute("/app/home")({ component: HomeFeed });

function HomeFeed() {
  return (
    <AppShell title="Your innovation feed" eyebrow="GOOD MORNING, BUILDER">
      <div className="app-grid feed-layout">
        <section className="feed-column">
          <div className="feed-tabs">
            <button className="active">For you</button>
            <button>Following</button>
            <button>Near you</button>
          </div>
          <div className="composer-card">
            <div className="avatar avatar-indigo">AD</div>
            <Link to="/app/create">What are you building today?</Link>
            <button>
              <Plus size={18} /> Create
            </button>
          </div>
          <div className="stories-row" aria-label="Build Reels">
            <div className="story create-story">
              <Plus />
              <span>Add update</span>
            </div>
            {demoProjects.map((project) => (
              <div className="story" key={project.name}>
                <div className={`story-ring cover-${project.color}`}>
                  <span>{project.name.charAt(0)}</span>
                </div>
                <span>{project.name.split(" ")[0]}</span>
              </div>
            ))}
          </div>
          <ProjectCard project={demoProjects[0]} />
          <article className="insight-post">
            <div className="project-owner">
              <div className="avatar avatar-teal">PM</div>
              <div>
                <strong>Prof. Palesa Maseko</strong>
                <span>Researcher · Future Materials Lab</span>
              </div>
              <ShieldCheck size={17} />
            </div>
            <span className="content-kicker">RESEARCH · MATERIALS SCIENCE</span>
            <h2>We are looking for a fabrication partner to test a biodegradable composite.</h2>
            <p>
              The initial material has passed tensile testing. The next milestone requires
              small-batch fabrication and field validation.
            </p>
            <div className="insight-actions">
              <button>
                <FlaskConical /> View research
              </button>
              <button>
                <Sparkles /> I can help
              </button>
            </div>
          </article>
        </section>
        <aside className="right-rail">
          <div className="rail-card live-card">
            <div className="rail-title">
              <span>
                <Radio size={17} /> Upcoming session
              </span>
              <small>Today · 18:00</small>
            </div>
            <h3>Protecting your innovation before public disclosure</h3>
            <p>With patent attorney Dr. M. Naidoo</p>
            <button>Set reminder</button>
          </div>
          <div className="rail-card">
            <div className="rail-title">
              <span>Recommended collaborators</span>
              <Link to="/app/network">See all</Link>
            </div>
            {[
              { name: "Sibongile Dlamini", role: "UX Researcher", match: "92% match" },
              { name: "Kabelo Radebe", role: "Embedded Engineer", match: "88% match" },
              { name: "Amahle Zondo", role: "Product Designer", match: "84% match" },
            ].map((person) => (
              <div className="person-row" key={person.name}>
                <div className="avatar avatar-soft">
                  {person.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")}
                </div>
                <div>
                  <strong>{person.name}</strong>
                  <span>{person.role}</span>
                </div>
                <small>{person.match}</small>
              </div>
            ))}
            <Link to="/app/network" className="rail-link">
              Open collaboration network <ArrowRight size={15} />
            </Link>
          </div>
          <div className="rail-card opportunity-card">
            <span className="content-kicker">OPPORTUNITY</span>
            <h3>Youth Innovation Challenge</h3>
            <p>Applications for prototype-stage South African ventures.</p>
            <div>
              <span>Closes 14 Sep</span>
              <strong>R250K support</strong>
            </div>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
