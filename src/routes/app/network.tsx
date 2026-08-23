import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight, BriefcaseBusiness, MessageCircle, Search, Users } from "lucide-react";
import { AppShell } from "../../components/app-shell";

export const Route = createFileRoute("/app/network")({ component: NetworkPage });

const people = [
  {
    name: "Kabelo Radebe",
    role: "Embedded Systems Engineer",
    place: "Pretoria",
    match: "92%",
    skills: ["Hardware", "IoT", "Prototyping"],
  },
  {
    name: "Sibongile Dlamini",
    role: "UX Researcher",
    place: "Johannesburg",
    match: "89%",
    skills: ["Research", "Accessibility", "Product"],
  },
  {
    name: "Tshepo Nkosi",
    role: "Mechanical Technician",
    place: "Centurion",
    match: "87%",
    skills: ["Fabrication", "CAD", "Testing"],
  },
  {
    name: "Lindiwe Mthembu",
    role: "Early-stage Investor",
    place: "Cape Town",
    match: "83%",
    skills: ["Climate", "Health", "Youth ventures"],
  },
];

function NetworkPage() {
  return (
    <AppShell title="Your network" eyebrow="COLLABORATION MATCHES">
      <div className="network-tabs">
        <button className="active">Recommended</button>
        <button>
          Connections <span>18</span>
        </button>
        <button>
          Requests <span>3</span>
        </button>
        <button>
          Messages <span>5</span>
        </button>
      </div>
      <label className="network-search">
        <Search />
        <input placeholder="Search skills, people or organisations" />
      </label>
      <div className="network-grid">
        {people.map(({ name, role, place, match, skills }) => (
          <article className="network-card" key={name}>
            <div className="network-card-top">
              <div className="avatar avatar-gradient">
                {name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")}
              </div>
              <span>{match} match</span>
            </div>
            <h2>{name}</h2>
            <p>{role}</p>
            <small>{place}</small>
            <div className="skill-line">
              {skills.map((skill) => (
                <span key={skill}>{skill}</span>
              ))}
            </div>
            <div className="network-actions">
              <button>
                <Users /> Connect
              </button>
              <button aria-label={`Message ${name}`}>
                <MessageCircle />
              </button>
            </div>
          </article>
        ))}
      </div>
      <section className="collaboration-board">
        <div>
          <BriefcaseBusiness />
          <span className="content-kicker">OPEN COLLABORATIONS</span>
          <h2>Projects actively looking for your skills</h2>
        </div>
        <button>
          View collaboration board <ArrowUpRight />
        </button>
      </section>
    </AppShell>
  );
}
