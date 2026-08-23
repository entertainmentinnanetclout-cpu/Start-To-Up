import { createFileRoute } from "@tanstack/react-router";
import { Filter, MapPin, Search, SlidersHorizontal, TrendingUp } from "lucide-react";
import { AppShell } from "../../components/app-shell";
import { ProjectCard, demoProjects } from "../../components/social-ui";

export const Route = createFileRoute("/app/explore")({ component: Explore });

const categories = [
  "For You",
  "Trending",
  "Under 35",
  "Student Innovators",
  "TVET & Artisans",
  "Research",
  "Seeking Investment",
];

function Explore() {
  return (
    <AppShell
      title="Explore innovation"
      eyebrow="DISCOVER WHAT'S NEXT"
      action={
        <button className="filter-button">
          <SlidersHorizontal size={17} /> Filters
        </button>
      }
    >
      <section className="explore-hero">
        <div>
          <span className="content-kicker">DISCOVERY ENGINE</span>
          <h2>Find people solving the problems you care about.</h2>
        </div>
        <label>
          <Search />
          <input placeholder="Search projects, skills, sectors or people" />
        </label>
      </section>
      <div className="category-scroll">
        {categories.map((category, index) => (
          <button className={index === 0 ? "active" : ""} key={category}>
            {category}
          </button>
        ))}
      </div>
      <div className="explore-toolbar">
        <div>
          <TrendingUp size={18} />
          <strong>Trending across South Africa</strong>
          <span>Updated from the innovation network</span>
        </div>
        <button>
          <MapPin size={16} /> Near Pretoria
        </button>
        <button>
          <Filter size={16} /> All sectors
        </button>
      </div>
      <div className="project-grid">
        {demoProjects.map((project) => (
          <ProjectCard key={project.name} project={project} compact />
        ))}
      </div>
      <section className="collection-banner">
        <div>
          <span className="content-kicker">CURATED COLLECTION</span>
          <h2>Innovators under 35 to watch</h2>
          <p>
            Emerging builders creating measurable progress across technology, science and industry.
          </p>
        </div>
        <button>Explore the collection</button>
      </section>
    </AppShell>
  );
}
