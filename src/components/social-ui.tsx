import { Bookmark, Ellipsis, Heart, MessageCircle, Share2, ShieldCheck, Users } from "lucide-react";

export type DemoProject = {
  name: string;
  owner: string;
  identity: string;
  stage: string;
  sector: string;
  summary: string;
  color: string;
  progress: number;
};

export const demoProjects: [DemoProject, DemoProject, DemoProject] = [
  {
    name: "SolarSense Monitor",
    owner: "Naledi Khumalo",
    identity: "Engineer",
    stage: "Prototype",
    sector: "Clean Energy",
    summary:
      "A low-cost solar performance monitor built for township households and small businesses.",
    color: "blue",
    progress: 64,
  },
  {
    name: "AquaGuard",
    owner: "Thabo Mokoena",
    identity: "Technician",
    stage: "Testing",
    sector: "Water Technology",
    summary: "An early-warning sensor for detecting leaks in community water infrastructure.",
    color: "teal",
    progress: 78,
  },
  {
    name: "CropSight AI",
    owner: "Lerato Molefe",
    identity: "Researcher",
    stage: "Pilot",
    sector: "Agritech",
    summary:
      "Phone-based crop diagnostics designed for emerging farmers with limited connectivity.",
    color: "amber",
    progress: 86,
  },
];

export function ProjectCard({
  project = demoProjects[0],
  compact = false,
}: {
  project?: DemoProject;
  compact?: boolean;
}) {
  return (
    <article className={`project-card ${compact ? "compact" : ""}`}>
      <div className={`project-cover cover-${project.color}`}>
        <span>{project.sector}</span>
        <div className="project-glyph">
          <span>{project.name.charAt(0)}</span>
        </div>
        <button aria-label={`More options for ${project.name}`}>
          <Ellipsis />
        </button>
      </div>
      <div className="project-card-body">
        <div className="project-owner">
          <div className={`avatar avatar-${project.color}`}>
            {project.owner
              .split(" ")
              .map((part) => part[0])
              .join("")}
          </div>
          <div>
            <strong>{project.owner}</strong>
            <span>{project.identity} · South Africa</span>
          </div>
          <ShieldCheck size={17} />
        </div>
        <div className="project-meta">
          <span>{project.stage}</span>
          <span>Build update</span>
        </div>
        <h2>{project.name}</h2>
        <p>{project.summary}</p>
        <div className="project-progress">
          <div>
            <span>Build progress</span>
            <strong>{project.progress}%</strong>
          </div>
          <div className="progress-line">
            <span style={{ width: `${project.progress}%` }} />
          </div>
        </div>
        <div className="project-actions">
          <button>
            <Heart /> <span>Support</span>
          </button>
          <button>
            <MessageCircle /> <span>Feedback</span>
          </button>
          <button>
            <Users /> <span>Collaborate</span>
          </button>
          <button aria-label="Save project">
            <Bookmark />
          </button>
          <button aria-label="Share project">
            <Share2 />
          </button>
        </div>
      </div>
    </article>
  );
}
