import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BadgeCheck, Bookmark, ChevronDown, ChevronUp, EyeOff, Heart, MessageCircle, Radio,
  Send, Share2, Sparkles, UserPlus, Users, Video, WalletCards, X,
} from "lucide-react";
import { AppShell } from "../../components/app-shell";
import { DataState } from "../../components/live-data-ui";
import { recordMediaSignal, type ProfessionalMediaItem } from "../../lib/pro-network-data";
import {
  addMediaComment, markMediaNotificationOpen, threadComments, toggleCreatorFollow,
  toggleInvestorWatchlist, useInvestorWatchlist, useMediaComments, useMediaNotifications,
  useRankedMediaFeedV2, useRecommendationState,
} from "../../lib/media-v2-data";
import "../../media-v2.css";

export const Route = createFileRoute("/app/media")({ component: MediaV2Page });

const audiences = [
  ["For you", ""], ["Developers", "developers"], ["Entrepreneurs", "entrepreneurs"],
  ["Innovators", "innovators"], ["Investors", "investors"], ["Institutions", "institutions"],
] as const;

function MediaV2Page() {
  const [audience, setAudience] = useState("");
  const [hidden, setHidden] = useState<Set<string>>(() => new Set());
  const feed = useRankedMediaFeedV2(audience ? [audience] : []);
  const recommendations = useRecommendationState();
  const watchlist = useInvestorWatchlist();
  const notifications = useMediaNotifications();
  const watchIds = useMemo(() => new Set(watchlist.data.map((item) => item.project_id)), [watchlist.data]);
  const items = useMemo(() => feed.data.filter((item) => !hidden.has(item.id)), [feed.data, hidden]);

  return (
    <AppShell
      title="Media V2"
      eyebrow="VERTICAL DISCOVERY · LIVE · PROJECT INTELLIGENCE"
      action={<Link to="/app/creator" className="button button-secondary"><Sparkles /> Creator studio</Link>}
    >
      <section className="v2-command">
        <div>
          <span><Sparkles /> RECOMMENDATION V2</span>
          <h2>Professional discovery that learns from what moves you to act.</h2>
          <p>Autoplay, creator affinity, threaded discussion, live rooms, watchlists and notification signals now shape each signed-in feed.</p>
        </div>
        <div className="v2-command-actions">
          <Link to="/app/sessions" className="button button-primary"><Radio /> Live studio</Link>
          <Link to="/app/watchlist" className="button button-secondary"><WalletCards /> Investor watchlist</Link>
        </div>
      </section>

      {notifications.data.length ? (
        <section className="v2-notification-strip" aria-label="Recommended updates">
          <strong>Recommended for you</strong>
          <div>
            {notifications.data.slice(0, 4).map((item) => (
              <button key={item.id} onClick={() => void markMediaNotificationOpen(item.id, item.media_id).then(() => notifications.refresh())}>
                <span>{item.reason.replaceAll("_", " ")}</span>
                <b>{item.media?.title ?? "New project update"}</b>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <nav className="v2-audience-tabs" aria-label="Media audience">
        {audiences.map(([label, value]) => (
          <button key={label} className={audience === value ? "active" : ""} onClick={() => setAudience(value)}>{label}</button>
        ))}
        <span className="v2-cohort">Cohort: {recommendations.data.cohort.replaceAll("_", " ")}</span>
      </nav>

      <div className="v2-media-layout">
        <section className="v2-vertical-feed" aria-label="Vertical professional media feed">
          <DataState loading={feed.loading} error={feed.error} empty={!items.length}>
            {items.map((item, index) => (
              <VerticalMediaCard
                key={item.id}
                item={item}
                priority={index < 2}
                watched={Boolean(item.project_id && watchIds.has(item.project_id))}
                onWatchlistChange={() => void watchlist.refresh()}
                onHide={() => setHidden((current) => new Set(current).add(item.id))}
              />
            ))}
          </DataState>
          {!feed.loading && !items.length ? (
            <div className="v2-empty"><Sparkles /><h3>Your lane is ready for new signals.</h3><button onClick={() => setHidden(new Set())}>Restore hidden media</button></div>
          ) : null}
        </section>

        <aside className="v2-intelligence-rail">
          <article>
            <span>YOUR FEED MODEL</span>
            <h3>{recommendations.data.cohort.replaceAll("_", " ")}</h3>
            <p>Exploration {Math.round(recommendations.data.exploration_rate * 100)}% · notification influence {Math.round(recommendations.data.notification_weight * 100)}%</p>
            <div className="v2-affinity-list">
              {recommendations.data.topics.slice(0, 6).map((topic) => <i key={topic.topic}>#{topic.topic} <b>{Number(topic.score).toFixed(1)}</b></i>)}
            </div>
          </article>
          <article>
            <span>MEDIA OPERATING SYSTEM</span>
            <h3>Watch → discuss → collaborate → diligence.</h3>
            <p>Every high-intent action feeds the ranking engine and can move directly into a project room, live room or investor watchlist.</p>
            <Link to="/app/collaboration">Open collaboration rooms →</Link>
          </article>
        </aside>
      </div>
    </AppShell>
  );
}

function VerticalMediaCard({
  item, priority, watched, onWatchlistChange, onHide,
}: {
  item: ProfessionalMediaItem; priority: boolean; watched: boolean; onWatchlistChange: () => void; onHide: () => void;
}) {
  const cardRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const milestones = useRef(new Set<number>());
  const impressed = useRef(false);
  const [muted, setMuted] = useState(true);
  const [supported, setSupported] = useState(false);
  const [saved, setSaved] = useState(false);
  const [following, setFollowing] = useState(false);
  const [watching, setWatching] = useState(watched);
  const [commentsOpen, setCommentsOpen] = useState(false);

  useEffect(() => setWatching(watched), [watched]);

  useEffect(() => {
    const node = cardRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      const video = videoRef.current;
      if (entry?.isIntersecting && entry.intersectionRatio >= 0.62) {
        if (!impressed.current) {
          impressed.current = true;
          void recordMediaSignal(item.id, "impression", { source: "vertical_v2", audience_tags: item.audience_tags }).catch(() => undefined);
        }
        if (video) void video.play().catch(() => undefined);
      } else if (video) video.pause();
    }, { threshold: [0.2, 0.62, 0.9] });
    observer.observe(node);
    return () => observer.disconnect();
  }, [item.id, item.audience_tags]);

  function progress(video: HTMLVideoElement) {
    if (!video.duration || !Number.isFinite(video.duration)) return;
    const ratio = video.currentTime / video.duration;
    for (const marker of [25, 50, 75]) {
      if (ratio * 100 >= marker && !milestones.current.has(marker)) {
        milestones.current.add(marker);
        void recordMediaSignal(item.id, "watch", { source: "vertical_v2", progress: Number(ratio.toFixed(3)), watch_seconds: Math.round(video.currentTime), duration_seconds: Math.round(video.duration) }).catch(() => undefined);
      }
    }
  }

  async function share() {
    const payload = { title: item.title, text: item.caption, url: window.location.href };
    if (navigator.share) await navigator.share(payload); else await navigator.clipboard.writeText(window.location.href);
    void recordMediaSignal(item.id, "share", { source: "vertical_v2" }).catch(() => undefined);
  }

  return (
    <article ref={cardRef} className="v2-reel" data-kind={item.stream_state}>
      <div className="v2-reel-visual">
        {item.playback_url ? (
          <video
            ref={videoRef} src={item.playback_url} poster={item.poster_url} muted={muted} loop playsInline preload={priority ? "auto" : "metadata"}
            onClick={(event) => event.currentTarget.paused ? void event.currentTarget.play() : event.currentTarget.pause()}
            onPlay={() => void recordMediaSignal(item.id, "play", { source: "vertical_v2" }).catch(() => undefined)}
            onTimeUpdate={(event) => progress(event.currentTarget)}
            onEnded={(event) => void recordMediaSignal(item.id, "complete", { source: "vertical_v2", progress: 1, duration_seconds: Math.round(event.currentTarget.duration || item.duration_seconds || 0) }).catch(() => undefined)}
          >{item.captions_url ? <track kind="captions" src={item.captions_url} default /> : null}</video>
        ) : <img src={item.poster_url} alt="" loading={priority ? "eager" : "lazy"} />}
        <div className="v2-reel-gradient" />
        <button className="v2-sound" onClick={() => setMuted((value) => !value)}>{muted ? "Sound off" : "Sound on"}</button>
        <span className={`v2-kind ${item.stream_state === "live" ? "live" : ""}`}>{item.stream_state === "live" ? <Radio /> : <Video />} {item.stream_state === "live" ? "LIVE" : item.media_kind.replaceAll("_", " ")}</span>

        <div className="v2-reel-copy">
          <div className="v2-author-row">
            <i>{item.author_name.slice(0, 2).toUpperCase()}</i>
            <div><strong>{item.author_name} {item.credibility_score >= 0.7 ? <BadgeCheck /> : null}</strong><span>{item.author_handle} · {item.author_role}</span></div>
            {item.creator_id ? <button className={following ? "active" : ""} onClick={() => void toggleCreatorFollow(item.creator_id!).then((value) => { setFollowing(value); if (value) void recordMediaSignal(item.id, "follow", { source: "vertical_v2" }); })}><UserPlus /> {following ? "Following" : "Follow"}</button> : null}
          </div>
          <h2>{item.title}</h2>
          <p>{item.caption}</p>
          <div className="v2-tags">{item.topic_tags.slice(0, 5).map((tag) => <span key={tag}>#{tag.replaceAll(" ", "")}</span>)}</div>
          <div className="v2-project-actions">
            {item.allow_collaboration ? <Link to="/app/collaboration" onClick={() => void recordMediaSignal(item.id, "collaboration_enter", { source: "vertical_v2" })}>Open project room</Link> : null}
            {item.project_id ? <button className={watching ? "active" : ""} onClick={() => void toggleInvestorWatchlist(item.project_id!, item.id).then((value) => { setWatching(value); onWatchlistChange(); if (value) void recordMediaSignal(item.id, "save", { source: "investor_watchlist" }); })}><WalletCards /> {watching ? "Watching" : "Investor watch"}</button> : null}
          </div>
        </div>

        <nav className="v2-action-rail" aria-label="Media actions">
          <button className={supported ? "active" : ""} onClick={() => { setSupported((v) => !v); if (!supported) void recordMediaSignal(item.id, "support", { source: "vertical_v2" }); }}><Heart /><span>Support</span></button>
          <button className={saved ? "active" : ""} onClick={() => { setSaved((v) => !v); if (!saved) void recordMediaSignal(item.id, "save", { source: "vertical_v2" }); }}><Bookmark /><span>Save</span></button>
          <button onClick={() => setCommentsOpen(true)}><MessageCircle /><span>Discuss</span></button>
          <button onClick={() => void share()}><Share2 /><span>Share</span></button>
          <button onClick={() => { void recordMediaSignal(item.id, "hide", { source: "vertical_v2" }); onHide(); }}><EyeOff /><span>Hide</span></button>
        </nav>
      </div>
      {commentsOpen ? <CommentDrawer media={item} onClose={() => setCommentsOpen(false)} /> : null}
    </article>
  );
}

function CommentDrawer({ media, onClose }: { media: ProfessionalMediaItem; onClose: () => void }) {
  const comments = useMediaComments(media.id);
  const threaded = threadComments(comments.data);
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function submit() {
    if (!body.trim()) return;
    setSending(true);
    try { await addMediaComment(media.id, body, replyTo); setBody(""); setReplyTo(null); await comments.refresh(); }
    finally { setSending(false); }
  }

  return (
    <aside className="v2-comment-drawer" aria-label={`Discussion for ${media.title}`}>
      <header><div><span>PROJECT DISCUSSION</span><h3>{media.title}</h3></div><button onClick={onClose}><X /></button></header>
      <div className="v2-comment-list">
        {threaded.map(({ root, replies }) => (
          <article key={root.id}>
            <div className="v2-comment"><i>{(root.author?.display_name ?? root.author?.username ?? "M").slice(0, 2).toUpperCase()}</i><div><strong>{root.author?.display_name ?? root.author?.username ?? "Member"}</strong><p>{root.body}</p><button onClick={() => setReplyTo(root.id)}>Reply</button></div></div>
            {replies.map((reply) => <div className="v2-comment reply" key={reply.id}><i>{(reply.author?.display_name ?? reply.author?.username ?? "M").slice(0, 2).toUpperCase()}</i><div><strong>{reply.author?.display_name ?? reply.author?.username ?? "Member"}</strong><p>{reply.body}</p></div></div>)}
          </article>
        ))}
        {!comments.loading && !threaded.length ? <div className="v2-no-comments"><Users /><p>Start the technical or commercial discussion around this build.</p></div> : null}
      </div>
      <footer>
        {replyTo ? <button className="v2-replying" onClick={() => setReplyTo(null)}>Replying to thread <X /></button> : null}
        <textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Add evidence, feedback, a question or collaboration insight…" />
        <button disabled={sending || !body.trim()} onClick={() => void submit()}><Send /> {sending ? "Sending" : "Post"}</button>
      </footer>
    </aside>
  );
}
