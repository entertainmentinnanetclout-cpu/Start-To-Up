import { Link, useRouterState } from "@tanstack/react-router";
import { LockKeyhole, Sparkles } from "lucide-react";
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
      <div className="network-loading" role="status" aria-label="Loading network experience">
        <Sparkles />
        <div>
          <i />
          <i />
          <i />
        </div>
      </div>
    );
  if (error)
    return (
      <div className="network-notice" role="status" data-error={Boolean(error)}>
        <Sparkles /> This experience is refreshing. Continue exploring the network.
      </div>
    );
  if (empty) return null;
  return <>{children}</>;
}

export function AuthDeferred({ children }: { children?: React.ReactNode }) {
  const path = useRouterState({ select: (state) => state.location.href });
  function rememberReturn() {
    if (typeof window === "undefined") return;
    const safePath = path.startsWith("/") && !path.startsWith("//") ? path : "/app/home";
    window.localStorage.setItem("start-to-up-auth-return", safePath);
  }
  return (
    <div className="auth-deferred">
      <LockKeyhole />
      <div>
        <strong>Sign in to continue</strong>
        <span>
          This capability is protected by your Start To Up account. After authentication, you return
          to the same workspace and your saved session state is restored.
        </span>
      </div>
      <Link to="/auth" className="button button-primary" onClick={rememberReturn}>
        Sign in securely
      </Link>
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
        {project.pitch ? <p>{project.pitch}</p> : null}
        <div className="skill-line">
          {project.technologies.map((technology) => (
            <span key={technology}>{technology}</span>
          ))}
        </div>
      </div>
    </article>
  );
}
