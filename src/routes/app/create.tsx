import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  FileText,
  FlaskConical,
  Handshake,
  Image,
  Lightbulb,
  ListChecks,
  LockKeyhole,
  Video,
} from "lucide-react";
import { AppShell } from "../../components/app-shell";

export const Route = createFileRoute("/app/create")({ component: CreateHub });

const types = [
  { icon: FileText, title: "Post", text: "Share an innovation insight or update", color: "indigo" },
  {
    icon: Video,
    title: "Build Reel",
    text: "Demonstrate your prototype or process",
    color: "blue",
  },
  { icon: Lightbulb, title: "Project", text: "Create a permanent project profile", color: "amber" },
  {
    icon: ListChecks,
    title: "Progress Update",
    text: "Add a milestone to your Build Journey",
    color: "teal",
  },
  {
    icon: FlaskConical,
    title: "Research",
    text: "Share findings or request a research partner",
    color: "violet",
  },
  {
    icon: Handshake,
    title: "Collaboration",
    text: "Find the skills or support your project needs",
    color: "navy",
  },
];

function CreateHub() {
  return (
    <AppShell title="Create" eyebrow="MOVE YOUR WORK FORWARD">
      <section className="create-intro">
        <div>
          <h2>What are you sharing?</h2>
          <p>Every contribution on Start To Up is connected to genuine innovation.</p>
        </div>
        <div className="privacy-pill">
          <LockKeyhole size={16} /> New projects begin private
        </div>
      </section>
      <div className="create-grid">
        {types.map(({ icon: Icon, title, text, color }) => (
          <button className="create-type" key={title}>
            <span className={`create-icon icon-${color}`}>
              <Icon />
            </span>
            <div>
              <strong>{title}</strong>
              <p>{text}</p>
            </div>
            <ArrowRight />
          </button>
        ))}
      </div>
      <section className="draft-card">
        <div className="draft-art">
          <Image />
        </div>
        <div>
          <span className="content-kicker">CONTINUE DRAFT</span>
          <h3>Community water monitoring sensor</h3>
          <p>Project identity complete · Problem and solution still required</p>
          <div className="progress-line">
            <span style={{ width: "34%" }} />
          </div>
        </div>
        <button>Continue</button>
      </section>
    </AppShell>
  );
}
