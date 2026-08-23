import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  Building2,
  Code2,
  Landmark,
  Lightbulb,
  Rocket,
  Search,
  TrendingUp,
  Users,
} from "lucide-react";
import { AppShell } from "../../components/app-shell";
import { EditorialShowcasePost } from "../../components/editorial-showcase";
import { DataState } from "../../components/live-data-ui";
import { useEditorialShowcases } from "../../lib/start-to-up-data";

export const Route = createFileRoute("/app/network")({ component: NetworkPage });

const pathways = [
  {
    icon: Code2,
    title: "Developers",
    text: "Share builds, join technical workstreams and find products that need your stack.",
    signal: "BUILD & CONTRIBUTE",
  },
  {
    icon: Rocket,
    title: "Entrepreneurs",
    text: "Validate ventures, form delivery teams and turn opportunities into structured execution.",
    signal: "LAUNCH & GROW",
  },
  {
    icon: Lightbulb,
    title: "Innovators",
    text: "Show prototypes, document progress and connect research or invention to real users.",
    signal: "PROVE & COLLABORATE",
  },
  {
    icon: TrendingUp,
    title: "Investors",
    text: "Discover venture evidence, follow progress and enter focused founder conversations.",
    signal: "DISCOVER & SUPPORT",
  },
  {
    icon: Landmark,
    title: "Institutions",
    text: "Find solutions, experts and delivery partners for innovation and development programmes.",
    signal: "PARTNER & SCALE",
  },
] as const;

function NetworkPage() {
  const showcases = useEditorialShowcases();
  return (
    <AppShell title="People, products and opportunity" eyebrow="THE INNOVATION NETWORK">
      <section className="network-discovery-hero">
        <div>
          <span>DISCOVERY WITH PURPOSE</span>
          <h2>Find the person, product or institution that moves the work forward.</h2>
        </div>
        <label>
          <Search />
          <input
            placeholder="Search people, skills, ventures or institutions"
            aria-label="Search the innovation network"
          />
        </label>
      </section>
      <section className="network-pathway-grid">
        {pathways.map(({ icon: Icon, title, text, signal }) => (
          <article key={title}>
            <div>
              <Icon />
            </div>
            <span>{signal}</span>
            <h2>{title}</h2>
            <p>{text}</p>
            <ArrowRight />
          </article>
        ))}
      </section>
      <section className="network-workflow-banner">
        <div>
          <Users />
          <span>DISCOVER</span>
        </div>
        <i />
        <div>
          <Building2 />
          <span>OPEN PROJECT</span>
        </div>
        <i />
        <div>
          <Code2 />
          <span>ENTER ROOM</span>
        </div>
        <i />
        <div>
          <Rocket />
          <span>SHIP TOGETHER</span>
        </div>
      </section>
      <section className="network-featured-build">
        <div className="explore-section-label">
          <span>FEATURED BUILD & COLLABORATION</span>
          <p>See how a real product uses the network.</p>
        </div>
        <DataState
          loading={showcases.loading}
          error={showcases.error}
          empty={!showcases.data.length}
        >
          {showcases.data.slice(0, 1).map((showcase) => (
            <EditorialShowcasePost compact showcase={showcase} key={showcase.id} />
          ))}
        </DataState>
      </section>
      <section className="collaboration-board">
        <div>
          <span className="content-kicker">COLLABORATION ROOMS</span>
          <h2>Move from discovery into structured project work.</h2>
        </div>
        <Link to="/app/collaboration" className="button button-primary">
          Open rooms <ArrowRight />
        </Link>
      </section>
    </AppShell>
  );
}
