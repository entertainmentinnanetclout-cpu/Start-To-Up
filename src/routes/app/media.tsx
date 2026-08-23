import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Bookmark,
  Captions,
  EyeOff,
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
import {
  type ProfessionalMediaItem,
  recordMediaSignal,
  useLiveStudioEvents,
  useProfessionalMediaFeed,
} from "../../lib/pro-network-data";
import "../../pro-network.css";

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
  const [hidden, setHidden] = useState<Set<string>>(() => new Set());
  const media = useProfessionalMediaFeed(audience ? [audience] : []);
  const liveEvents = useLiveStudioEvents();
  const visibleMedia = useMemo(() => media.data.filter((item) => !hidden.has(item.id)), [media.data, hidden]);

  return (
    <AppShell title="Media studio" eyebrow="WATCH · LEARN · DEMONSTRATE · COLLABORATE">
      <section className="media-command-bar pro-media-command">
        <div>
          <span>
            <Sparkles /> PERSONALIZED PROFESSIONAL DISCOVERY
          </span>
          <h2>A feed built to move real projects forward.</h2>
          <p>
            Build Reels, technical walkthroughs, product demonstrations, research, live sessions and
            collaboration calls—ranked around usefulness, expertise, watch quality and credible intent.
          </p>
        </div>
        <div className="pro-media-command-actions">
          <Link to="/app/create" className="button button-primary">
            <Video /> Publish media
          </Link>
          <Link to="/app/create" search={{ mode: "live" } as never} className="button button-secondary">
            <Radio /> Schedule live
          </Link>
        </div>
      </section>

      <nav className="media-audience-tabs pro-audience-tabs" aria-label="Personalize media feed">
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

      <div className="media-discovery-layout pro-media-layout">
        <section className="innovation-reel-feed pro-reel-feed" aria-label="Ranked innovation media">
          <DataState loading={media.loading} error={media.error} empty={!visibleMedia.length}>
            {visibleMedia.map((item, index) => (
              <InnovationReel
                key={item.id}
                item={item}
                priority={index === 0}
                onHide={() => setHidden((current) => new Set(current).add(item.id))}
              />
            ))}
          </DataState>
          {!media.loading && !media.error && !visibleMedia.length ? (
            <section className="pro-feed-reset">
              <Sparkles />
              <div>
                <strong>Your discovery lane is ready for a fresh signal.</strong>
                <span>Switch an audience above or publish a Build Reel to shape the network.</span>
              </div>
              <button onClick={() => setHidden(new Set())}>Restore hidden media</button>
            </section>
          ) : null}
        </section>

        <aside className="media-studio-rail pro-studio-rail">
          <article className="live-studio-card pro-live-card">
            <div className="live-studio-orbit">
              <Radio />
              <i />
              <i />
            </div>
            <span>START TO UP LIVE STUDIO</span>
            <h2>Demo the build while the project context stays one tap away.</h2>
            <ul>
              <li>
                <Video /> Product demos and technical walkthroughs
              </li>
              <li>
                <Users /> Collaboration rooms, reviews and expert panels
              </li>
              <li>
                <Captions /> Captions, replay and searchable context
              </li>
              <li>
                <MonitorPlay /> Screen sharing, prototypes and project links
              </li>
            </ul>
            {liveEvents.data.length ? (
              <div className="pro-live-event-list">
                {liveEvents.data.slice(0, 3).map((event) => (
                  <Link to="/app/sessions" key={event.id} className={event.status === "live" ? "is-live" : ""}>
                    <i />
                    <div>
                      <strong>{event.title}</strong>
                      <span>
                        {event.status === "live"
                          ? "LIVE NOW"
                          : new Intl.DateTimeFormat("en-ZA", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            }).format(new Date(event.starts_at))}
                      </span>
                    </div>
                    <ArrowRight />
                  </Link>
                ))}
              </div>
            ) : null}
            <Link to="/app/sessions" className="button button-primary">
              Open live studio <ArrowRight />
            </Link>
          </article>

          <article className="algorithm-card pro-algorithm-card">
            <span>DISCOVERY ENGINE</span>
            <h3>High-intent behavior beats empty virality.</h3>
            <p>
              Ranking learns from completion, rewatching, saves, shares, collaboration entry and topic
              affinity while actively reducing repeated creators, fast skips, hides and unsafe content.
            </p>
            <div className="pro-signal-grid">
              <span>Watch quality</span>
              <span>Collaboration intent</span>
              <span>Topic affinity</span>
              <span>Creator diversity</span>
              <span>Freshness</span>
              <span>Safety</span>
            </div>
            <small>Personalization uses signed-in interaction signals; professional relevance remains the baseline.</small>
          </article>
        </aside>
      </div>
    </AppShell>
  );
}

function InnovationReel({
  item,
  priority,
  onHide,
}: {
  item: ProfessionalMediaItem;
  priority: boolean;
  onHide: () => void;
}) {
  const [storyOpen, setStoryOpen] = useState(false);
  const [shared, setShared] = useState(false);
  const [supported, setSupported] = useState(false);
  const [saved, setSaved] = useState(false);
  const articleRef = useRef<HTMLElement>(null);
  const watchedMilestones = useRef(new Set<number>());
  const completed = useRef(false);
  const impressed = useRef(false);

  const internalDestination =
    item.destination_url === "/app/create" || item.destination_url === "/app/collaboration"
      ? item.destination_url
      : null;

  useEffect(() => {
    const node = articleRef.current;
    if (!node || impressed.current || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.6)) {
          impressed.current = true;
          void recordMediaSignal(item.id, "impression", { audience_tags: item.audience_tags }).catch(() => undefined);
          observer.disconnect();
        }
      },
      { threshold: [0.6] },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [item.id, item.audience_tags]);

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

  function openStory() {
    setStoryOpen(true);
    void recordMediaSignal(item.id, completed.current ? "rewatch" : "play", {
      media_kind: item.media_kind,
    }).catch(() => undefined);
  }

  function onProgress(video: HTMLVideoElement) {
    if (!video.duration || !Number.isFinite(video.duration)) return;
    const progress = video.currentTime / video.duration;
    for (const milestone of [0.25, 0.5, 0.75]) {
      if (progress >= milestone && !watchedMilestones.current.has(milestone * 100)) {
        watchedMilestones.current.add(milestone * 100);
        void recordMediaSignal(item.id, "watch", {
          progress: Number(progress.toFixed(3)),
          watch_seconds: Math.round(video.currentTime),
          duration_seconds: Math.round(video.duration),
        }).catch(() => undefined);
      }
    }
  }

  function onComplete(video: HTMLVideoElement) {
    completed.current = true;
    void recordMediaSignal(item.id, "complete", {
      progress: 1,
      duration_seconds: Math.round(video.duration || item.duration_seconds || 0),
    }).catch(() => undefined);
  }

  async function shareStory() {
    const shareData = { title: item.title, text: item.caption, url: window.location.href };
    if (navigator.share) await navigator.share(shareData);
    else await navigator.clipboard.writeText(window.location.href);
    setShared(true);
    void recordMediaSignal(item.id, "share", { source: "media_feed" }).catch(() => undefined);
    window.setTimeout(() => setShared(false), 1800);
  }

  function toggleSupport() {
    const next = !supported;
    setSupported(next);
    if (next) void recordMediaSignal(item.id, "support", { source: "media_feed" }).catch(() => undefined);
  }

  function toggleSave() {
    const next = !saved;
    setSaved(next);
    if (next) void recordMediaSignal(item.id, "save", { source: "media_feed" }).catch(() => undefined);
  }

  function hideStory() {
    void recordMediaSignal(item.id, "hide", { source: "media_feed" }).catch(() => undefined);
    onHide();
  }

  return (
    <article ref={articleRef} className={`innovation-reel pro-innovation-reel${priority ? " priority-reel" : ""}`}>
      <div className="innovation-reel-media pro-reel-media">
        <img src={item.poster_url} alt="" loading={priority ? "eager" : "lazy"} />
        <div className="reel-media-gradient" />
        <button type="button" className="pro-main-play" aria-label={`Open ${item.title}`} onClick={openStory}>
          <Play />
        </button>
        <div className={`reel-kind ${item.stream_state === "live" ? "is-live" : ""}`}>
          {item.stream_state === "live" ? <Radio /> : <Video />} {item.stream_state === "live" ? "LIVE" : item.media_kind.replaceAll("_", " ")}
        </div>
        <div className="reel-copy pro-reel-copy">
          <header>
            <div className="reel-avatar">{item.author_name.slice(0, 2).toUpperCase()}</div>
            <div>
              <strong>
                {item.author_name} {item.credibility_score >= 0.7 ? <BadgeCheck /> : null}
              </strong>
              <span>
                {item.author_handle} · {item.author_role}
              </span>
            </div>
          </header>
          <h2>{item.title}</h2>
          <p>{item.caption}</p>
          <div className="reel-topics">
            {item.topic_tags.slice(0, 5).map((tag) => (
              <span key={tag}>#{tag.replaceAll(" ", "")}</span>
            ))}
          </div>
          {internalDestination ? (
            <Link
              to={internalDestination}
              className="reel-cta"
              onClick={() => void recordMediaSignal(item.id, "collaboration_enter", { destination: internalDestination }).catch(() => undefined)}
            >
              {item.call_to_action} <ArrowRight />
            </Link>
          ) : item.destination_url ? (
            <a href={item.destination_url} target="_blank" rel="noreferrer" className="reel-cta">
              {item.call_to_action} <ArrowRight />
            </a>
          ) : null}
        </div>
        <nav className="reel-actions pro-reel-actions" aria-label="Media actions">
          <button type="button" className={supported ? "active" : ""} onClick={toggleSupport}>
            <Heart />
            <span>{supported ? "Supported" : "Support"}</span>
          </button>
          <button type="button" className={saved ? "active" : ""} onClick={toggleSave}>
            <Bookmark />
            <span>{saved ? "Saved" : "Save"}</span>
          </button>
          <Link
            to="/app/collaboration"
            onClick={() => void recordMediaSignal(item.id, "collaboration_enter", { source: "discuss" }).catch(() => undefined)}
          >
            <MessageCircle />
            <span>Discuss</span>
          </Link>
          <button type="button" onClick={() => void shareStory()}>
            <Share2 />
            <span>{shared ? "Copied" : "Share"}</span>
          </button>
          <button type="button" onClick={hideStory}>
            <EyeOff />
            <span>Hide</span>
          </button>
        </nav>
      </div>

      {storyOpen ? (
        <div className="motion-story-overlay pro-story-overlay" role="dialog" aria-modal="true" aria-label={item.title}>
          <button type="button" className="motion-story-backdrop" aria-label="Close media" onClick={() => setStoryOpen(false)} />
          <section className="motion-story-player pro-story-player">
            <button type="button" className="pro-story-close" aria-label="Close media" onClick={() => setStoryOpen(false)}>
              <X />
            </button>
            <div className="motion-story-visual pro-story-visual">
              {item.playback_url ? (
                <video
                  src={item.playback_url}
                  poster={item.poster_url}
                  controls
                  playsInline
                  autoPlay
                  preload="metadata"
                  onPlay={() => {
                    if (completed.current) void recordMediaSignal(item.id, "rewatch", { source: "player" }).catch(() => undefined);
                  }}
                  onTimeUpdate={(event) => onProgress(event.currentTarget)}
                  onEnded={(event) => onComplete(event.currentTarget)}
                >
                  {item.captions_url ? <track kind="captions" src={item.captions_url} default /> : null}
                </video>
              ) : (
                <>
                  <img src={item.poster_url} alt="" />
                  <div className="reel-media-gradient" />
                  <span>
                    <Play /> PRODUCT STORY
                  </span>
                </>
              )}
            </div>
            <div className="motion-story-copy pro-story-copy">
              <span>
                {item.stream_state === "live" ? "LIVE" : item.media_kind.replaceAll("_", " ")} · {item.author_name}
              </span>
              <h2>{item.title}</h2>
              <p>{item.caption}</p>
              <div className="reel-topics">
                {item.topic_tags.map((tag) => (
                  <span key={tag}>#{tag.replaceAll(" ", "")}</span>
                ))}
              </div>
              <div className="motion-story-actions">
                {item.allow_collaboration ? (
                  <Link
                    to="/app/collaboration"
                    className="button button-primary"
                    onClick={() => void recordMediaSignal(item.id, "collaboration_enter", { source: "player" }).catch(() => undefined)}
                  >
                    Enter collaboration <ArrowRight />
                  </Link>
                ) : null}
                <button type="button" className="button button-secondary" onClick={() => void shareStory()}>
                  <Share2 /> {shared ? "Link copied" : "Share"}
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </article>
  );
}
