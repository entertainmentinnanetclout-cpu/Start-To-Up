import { AlertCircle, Database, LockKeyhole } from "lucide-react";
import type { Project } from "../lib/start-to-up-data";

export function DataState({
  loading,
  error,
  empty,
  children,
}: {
  loading: boolean;
  error: string | null;
  empty: boolean;
  children: React.ReactNode;
}) {
  if (loading)
    return (
      <div className="data-state" role="status">
        <Database /> Loading live platform data…
      </div>
    );
  if (error)
    return (
      <div className="data-state error" role="alert">
        <AlertCircle /> {error}
      </div>
    );
  if (empty)
    return (
      <div className="data-state">
        <Database />
        <strong>No records yet</strong>
        <span>
          This section is connected to Supabase and will populate when real members publish content.
        </span>
      </div>
    );
  return <>{children}</>;
}

export function AuthDeferred({ children }: { children?: React.ReactNode }) {
  return (
    <div className="auth-deferred">
      <LockKeyhole />
      <div>
        <strong>Account action unavailable</strong>
        <span>
          Authentication is intentionally excluded from this phase. The secure workflow is wired and
          will activate when auth is connected.
        </span>
      </div>
      {children}
    </div>
  );
}

export function LiveProjectCard({ project }: { project: Project }) {
  return (
    <article className="project-card compact">
      <div className="project-cover cover-blue">
        <span>{project.stage}</span>
        <div className="project-glyph">
          <span>{project.name.charAt(0)}</span>
        </div>
      </div>
      <div className="project-card-body">
        <span className="content-kicker">{project.visibility} PROJECT</span>
        <h2>{project.name}</h2>
        <p>{project.pitch || "The creator has not published a project pitch yet."}</p>
        <div className="skill-line">
          {project.technologies.map((technology) => (
            <span key={technology}>{technology}</span>
          ))}
        </div>
      </div>
    </article>
  );
}
