import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Captions,
  Heart,
  MessageCircle,
  MonitorPlay,
  Play,
  Radio,
  Share2,
  Sparkles,
  Users,
  Video,
  X,
} from "lucide-react";
import { AppShell } from "../../components/app-shell";
import { DataState } from "../../components/live-data-ui";
import { type NetworkMediaItem, useRankedMediaFeed } from "../../lib/start-to-up-data";

export const Route = createFileRoute("/app/media")({ component: MediaPage });

const audiences = [
  ["For you", ""],
  ["Developers", "developers"],
  ["Entrepreneurs", "entrepreneurs"],
  ["Innovators", "innovators"],
  ["Investors", "investors"],
  ["Institutions", "institutions"],
] as const;

function MediaPage() {
  const [audience, setAudience] = useState("");
  const media = useRankedMediaFeed(audience ? [audience] : []);
  return (
    <AppShell title="Innovation media" eyebrow="WATCH · LEARN · BUILD TOGETHER">
      <section className="media-command-bar">
        <div>
          <span>
            <Sparkles /> SIGNAL-RANKED DISCOVERY
          </span>
          <h2>Your feed should move your work forward.</h2>
          <p>
            Product walkthroughs, build reels, research demonstrations, collaboration calls and
            expert streams—ranked for quality, relevance, freshness and collaboration potential.
          </p>
        </div>
        <Link to="/app/create" className="button button-primary">
          <Video /> Publish build media
        </Link>
      </section>
      <nav className="media-audience-tabs" aria-label="Personalize media feed">
        {audiences.map(([label, value]) => (
          <button
            key={label}
            className={audience === value ? "active" : ""}
            onClick={() => setAudience(value)}
          >
            {label}
          </button>
        ))}
      </nav>
      <div className="media-discovery-layout">
        <section className="innovation-reel-feed" aria-label="Ranked innovation media">
          <DataState loading={media.loading} error={media.error} empty={!media.data.length}>
            {media.data.map((item, index) => (
              <InnovationReel key={item.id} item={item} priority={index === 0} />
            ))}
          </DataState>
        </section>
        <aside className="media-studio-rail">
          <article className="live-studio-card">
            <div className="live-studio-orbit">
              <Radio />
              <i />
              <i />
            </div>
            <span>START TO UP LIVE STUDIO</span>
            <h2>Host the room. Demonstrate the build. Keep the conversation connected.</h2>
            <ul>
              <li>
                <Video /> Product demos and technical walkthroughs
              </li>
              <li>
                <Users /> Collaboration rooms and expert panels
              </li>
              <li>
                <Captions /> Captions, replay and searchable chapters
              </li>
              <li>
                <MonitorPlay /> Screen sharing and project context
              </li>
            </ul>
            <Link to="/app/sessions" className="button button-primary">
              Explore sessions <ArrowRight />
            </Link>
          </article>
          <article className="algorithm-card">
            <span>WHY THIS FEED IS DIFFERENT</span>
            <h3>Professional relevance beats empty virality.</h3>
            <p>
              Ranking rewards credible demonstrations, useful knowledge, audience relevance and
              clear opportunities to collaborate. Popularity alone cannot dominate discovery.
            </p>
            <div>
              <i style={{ width: "40%" }} />
              <span>Quality</span>
            </div>
            <div>
              <i style={{ width: "25%" }} />
              <span>Collaboration value</span>
            </div>
            <div>
              <i style={{ width: "20%" }} />
              <span>Audience relevance</span>
            </div>
            <div>
              <i style={{ width: "15%" }} />
              <span>Freshness</span>
            </div>
          </article>
        </aside>
      </div>
    </AppShell>
  );
}

function InnovationReel({ item, priority }: { item: NetworkMediaItem; priority: boolean }) {
  const [storyOpen, setStoryOpen] = useState(false);
  const [shared, setShared] = useState(false);
  const internalDestination =
    item.destination_url === "/app/create" || item.destination_url === "/app/collaboration"
      ? item.destination_url
      : null;

  useEffect(() => {
    if (!storyOpen) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setStoryOpen(false);
    };
    document.addEventListener("keydown", close);
    document.body.classList.add("preview-locked");
    return () => {
      document.removeEventListener("keydown", close);
      document.body.classList.remove("preview-locked");
    };
  }, [storyOpen]);

  async function shareStory() {
    const shareData = { title: item.title, text: item.caption, url: window.location.href };
    if (navigator.share) await navigator.share(shareData);
    else await navigator.clipboard.writeText(window.location.href);
    setShared(true);
    window.setTimeout(() => setShared(false), 1800);
  }

  return (
    <article className={`innovation-reel${priority ? " priority-reel" : ""}`}>
      <div className="innovation-reel-media">
        <img src={item.poster_url} alt="" loading={priority ? "eager" : "lazy"} />
        <div className="reel-media-gradient" />
        <div className="reel-motion-lines">
          <i />
          <i />
          <i />
        </div>
        <button type="button" aria-label={`Open ${item.title}`} onClick={() => setStoryOpen(true)}>
          <Play />
        </button>
        <div className="reel-kind">
          <Video /> {item.media_kind.replaceAll("_", " ")}
        </div>
        <div className="reel-copy">
          <header>
            <div className="reel-avatar">{item.author_name.slice(0, 2).toUpperCase()}</div>
            <div>
              <strong>
                {item.author_name} <BadgeCheck />
              </strong>
              <span>
                {item.author_handle} · {item.author_role}
              </span>
            </div>
          </header>
          <h2>{item.title}</h2>
          <p>{item.caption}</p>
          <div className="reel-topics">
            {item.topic_tags.map((tag) => (
              <span key={tag}>#{tag.replaceAll(" ", "")}</span>
            ))}
          </div>
          {internalDestination ? (
            <Link to={internalDestination} className="reel-cta">
              {item.call_to_action} <ArrowRight />
            </Link>
          ) : item.destination_url ? (
            <a href={item.destination_url} target="_blank" rel="noreferrer" className="reel-cta">
              {item.call_to_action} <ArrowRight />
            </a>
          ) : null}
        </div>
        <nav className="reel-actions" aria-label="Media actions">
          <button type="button" onClick={() => setStoryOpen(true)}>
            <Heart />
            <span>View</span>
          </button>
          <Link to="/app/collaboration">
            <MessageCircle />
            <span>Discuss</span>
          </Link>
          <Link to="/app/collaboration">
            <Users />
            <span>Build</span>
          </Link>
          <button type="button" onClick={() => void shareStory()}>
            <Share2 />
            <span>{shared ? "Copied" : "Share"}</span>
          </button>
        </nav>
      </div>
      {storyOpen ? (
        <div
          className="motion-story-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={item.title}
        >
          <button
            type="button"
            className="motion-story-backdrop"
            aria-label="Close media story"
            onClick={() => setStoryOpen(false)}
          />
          <section className="motion-story-player">
            <button
              type="button"
              aria-label="Close media story"
              onClick={() => setStoryOpen(false)}
            >
              <X />
            </button>
            <div className="motion-story-visual">
              <img src={item.poster_url} alt="" />
              <div className="reel-media-gradient" />
              <div className="reel-motion-lines">
                <i />
                <i />
                <i />
              </div>
              <span>
                <Play /> MOTION STORY
              </span>
            </div>
            <div className="motion-story-copy">
              <span>
                {item.media_kind.replaceAll("_", " ")} · {item.author_name}
              </span>
              <h2>{item.title}</h2>
              <p>{item.caption}</p>
              <div className="reel-topics">
                {item.topic_tags.map((tag) => (
                  <span key={tag}>#{tag.replaceAll(" ", "")}</span>
                ))}
              </div>
              <div className="motion-story-actions">
                <Link to="/app/collaboration" className="button button-primary">
                  Enter collaboration <ArrowRight />
                </Link>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => void shareStory()}
                >
                  <Share2 /> {shared ? "Link copied" : "Share story"}
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </article>
  );
}
