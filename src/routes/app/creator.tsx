import { Link, createFileRoute } from "@tanstack/react-router";
import { BarChart3, Eye, Heart, MessageCircle, Play, RefreshCw, Share2, Sparkles, UserPlus, Users, Video } from "lucide-react";
import { AppShell } from "../../components/app-shell";
import { DataState } from "../../components/live-data-ui";
import { useCreatorAnalytics, useRecommendationState } from "../../lib/media-v2-data";
import "../../media-v2.css";

export const Route = createFileRoute("/app/creator")({ component: CreatorDashboard });

const metrics = [
  ["impressions", "Impressions", Eye], ["plays", "Plays", Play], ["completions", "Completions", Video],
  ["rewatches", "Rewatches", RefreshCw], ["saves", "Saves", Heart], ["shares", "Shares", Share2],
  ["comments", "Comments", MessageCircle], ["collaboration_entries", "Collab entries", Users], ["followers", "Followers", UserPlus],
] as const;

function CreatorDashboard() {
  const analytics = useCreatorAnalytics();
  const recommendation = useRecommendationState();
  const completionRate = analytics.data.plays ? Math.round((analytics.data.completions ?? 0) / analytics.data.plays * 100) : 0;
  const collabRate = analytics.data.plays ? Math.round((analytics.data.collaboration_entries ?? 0) / analytics.data.plays * 1000) / 10 : 0;

  return (
    <AppShell title="Creator studio" eyebrow="MEDIA ANALYTICS · AUDIENCE INTELLIGENCE · CONVERSION" action={<Link to="/app/create" className="button button-primary"><Video /> Publish media</Link>}>
      <section className="v2-command creator-command">
        <div><span><Sparkles /> CREATOR INTELLIGENCE</span><h2>Measure whether content creates action, not only attention.</h2><p>Track watch quality, audience depth, project discussion, collaboration entry and follower growth from one professional dashboard.</p></div>
        <div className="creator-scorecard"><strong>{completionRate}%</strong><span>completion rate</span><strong>{collabRate}%</strong><span>collaboration conversion</span></div>
      </section>

      <DataState loading={analytics.loading} error={analytics.error} empty={false}>
        <section className="creator-metric-grid">
          {metrics.map(([key, label, Icon]) => <article key={key}><Icon /><span>{label}</span><strong>{Number(analytics.data[key] ?? 0).toLocaleString()}</strong></article>)}
        </section>

        <section className="creator-deep-grid">
          <article className="creator-panel">
            <span>WATCH QUALITY</span><h3>{Number(analytics.data.avg_progress ?? 0).toFixed(1)}% average progress</h3>
            <div className="creator-progress"><i style={{ width: `${Math.min(100, Number(analytics.data.avg_progress ?? 0))}%` }} /></div>
            <p>Recommendation V2 uses completion, rewatch and sustained watch depth as stronger quality signals than raw impressions.</p>
          </article>
          <article className="creator-panel">
            <span>DISCOVERY PROFILE</span><h3>{recommendation.data.cohort.replaceAll("_", " ")}</h3>
            <p>Your own interaction model remains separate from your creator analytics. It controls what you discover, while this dashboard measures how your work performs.</p>
            <div className="v2-affinity-list">{recommendation.data.topics.slice(0, 6).map((topic) => <i key={topic.topic}>#{topic.topic} <b>{Number(topic.score).toFixed(1)}</b></i>)}</div>
          </article>
          <article className="creator-panel">
            <span>PROJECT OUTCOMES</span><h3>{Number(analytics.data.collaboration_entries ?? 0)} collaboration entries</h3>
            <p>Use Build Reels and live demonstrations to route serious viewers into project rooms where discussion, tasks, files and decisions continue inside the network.</p>
            <Link to="/app/collaboration">Open collaboration rooms →</Link>
          </article>
        </section>
      </DataState>
    </AppShell>
  );
}
