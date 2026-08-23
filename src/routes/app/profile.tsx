import { createFileRoute } from "@tanstack/react-router";
import { BadgeCheck, Edit3, Eye, Link2, MapPin, Plus, ShieldCheck } from "lucide-react";
import { AppShell } from "../../components/app-shell";
import { ProjectCard, demoProjects } from "../../components/social-ui";

export const Route = createFileRoute("/app/profile")({ component: ProfilePage });

function ProfilePage() {
  return (
    <AppShell
      title="Innovation Passport"
      eyebrow="YOUR PROFESSIONAL BUILD RECORD"
      action={
        <button className="filter-button">
          <Edit3 size={16} /> Edit profile
        </button>
      }
    >
      <section className="profile-card">
        <div className="profile-cover">
          <div className="profile-pattern" />
        </div>
        <div className="profile-main">
          <div className="profile-avatar">AD</div>
          <div className="profile-identity">
            <div>
              <h2>
                Ayanda Dube <BadgeCheck />
              </h2>
              <span>@ayandabuilds</span>
            </div>
            <p>Founder · Product Builder · Innovation Ecosystem Developer</p>
            <div className="profile-details">
              <span>
                <MapPin /> Pretoria, South Africa
              </span>
              <span>
                <Link2 /> Portfolio
              </span>
              <span>
                <ShieldCheck /> Identity verified
              </span>
            </div>
          </div>
          <button>
            <Plus /> Available to collaborate
          </button>
        </div>
        <div className="profile-stats">
          <div>
            <strong>3</strong>
            <span>Projects</span>
          </div>
          <div>
            <strong>12</strong>
            <span>Contributions</span>
          </div>
          <div>
            <strong>486</strong>
            <span>Followers</span>
          </div>
          <div>
            <strong>21</strong>
            <span>Milestones</span>
          </div>
          <div>
            <strong>94%</strong>
            <span>Passport strength</span>
          </div>
        </div>
      </section>
      <div className="profile-tabs">
        <button className="active">Projects</button>
        <button>Posts</button>
        <button>Build Reels</button>
        <button>Journey</button>
        <button>Contributions</button>
        <button>Research</button>
        <button>About</button>
      </div>
      <div className="profile-content">
        <section>
          <div className="content-heading">
            <div>
              <h2>Featured project</h2>
              <p>Your most important work, presented with evidence and progress.</p>
            </div>
            <button>
              <Eye /> Preview public profile
            </button>
          </div>
          <ProjectCard project={demoProjects[2]} />
        </section>
        <aside className="passport-card">
          <span className="content-kicker">PASSPORT STRENGTH</span>
          <div className="passport-score">
            <strong>94</strong>
            <span>/100</span>
          </div>
          <div className="passport-ring">
            <i />
          </div>
          <ul>
            <li className="done">Identity completed</li>
            <li className="done">Skills demonstrated</li>
            <li className="done">Projects documented</li>
            <li>Request two recommendations</li>
          </ul>
          <button>Strengthen passport</button>
        </aside>
      </div>
    </AppShell>
  );
}
