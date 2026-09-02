import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, CheckCircle2, CircleAlert, Inbox, ListTodo, MessageCircle, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../../components/app-shell";
import { AuthDeferred } from "../../components/live-data-ui";
import { usePrivateTrustData, useSessionState } from "../../lib/start-to-up-data";
import { listStartupWorkspaces, loadWorkspaceSnapshot, type StartupWorkspaceSnapshot } from "../../lib/startup-os-foundation";

export const Route = createFileRoute("/app/inbox")({ component: InboxPage });

type Filter = "all" | "messages" | "actions" | "reviews" | "activity";
type InboxItem = {
  id: string;
  kind: Exclude<Filter, "all">;
  title: string;
  detail: string;
  time: string;
  path: string;
  priority?: boolean;
};

const emptySnapshot: StartupWorkspaceSnapshot = { profile: null, members: [], verifications: [], metrics: [], tasks: [], integrations: [], flags: [], activity: [] };

function InboxPage() {
  const session = useSessionState();
  const trust = usePrivateTrustData(session.session?.user.id);
  const [snapshot, setSnapshot] = useState<StartupWorkspaceSnapshot>(emptySnapshot);
  const [loadingWorkspace, setLoadingWorkspace] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    let alive = true;
    async function load() {
      if (!session.session || session.session.user.is_anonymous) { if (alive) setLoadingWorkspace(false); return; }
      setLoadingWorkspace(true);
      try {
        const workspaces = await listStartupWorkspaces();
        const stored = window.localStorage.getItem("start-to-up-active-workspace") || "";
        const id = workspaces.some((workspace) => workspace.organization_id === stored) ? stored : workspaces[0]?.organization_id || "";
        if (id) {
          window.localStorage.setItem("start-to-up-active-workspace", id);
          const next = await loadWorkspaceSnapshot(id);
          if (alive) setSnapshot(next);
        } else if (alive) setSnapshot(emptySnapshot);
      } catch { if (alive) setSnapshot(emptySnapshot); }
      finally { if (alive) setLoadingWorkspace(false); }
    }
    void load();
    return () => { alive = false; };
  }, [session.session]);

  const items = useMemo<InboxItem[]>(() => {
    const next: InboxItem[] = [];
    for (const conversation of trust.data.conversations || []) {
      next.push({
        id: `conversation-${conversation.id}`,
        kind: "messages",
        title: conversation.subject || "Project conversation",
        detail: "Private participant-only conversation",
        time: conversation.created_at || "",
        path: "/app/messages",
      });
    }
    for (const task of snapshot.tasks.filter((item) => !["done", "cancelled"].includes(String(item.status || "").toLowerCase()))) {
      const priority = ["high", "urgent", "critical"].includes(String(task.priority || "").toLowerCase());
      const needsReview = /review|approve|approval|sign|verify|check|decision/i.test(String(task.title || ""));
      next.push({
        id: `task-${task.id}`,
        kind: needsReview ? "reviews" : "actions",
        title: String(task.title || "Company action"),
        detail: `${String(task.priority || "normal")} priority · ${String(task.status || "open").replaceAll("_", " ")}`,
        time: task.updated_at || task.created_at || "",
        path: needsReview ? "/app/compliance" : "/app/operations",
        priority,
      });
    }
    for (const activity of snapshot.activity) {
      next.push({
        id: `activity-${activity.id}`,
        kind: "activity",
        title: activity.summary || String(activity.action || "Company activity").replaceAll("_", " "),
        detail: String(activity.entity_type || activity.action || "workspace").replaceAll("_", " "),
        time: activity.created_at || "",
        path: "/app/startup-os",
      });
    }
    return next.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority ? -1 : 1;
      return new Date(b.time || 0).getTime() - new Date(a.time || 0).getTime();
    });
  }, [snapshot.activity, snapshot.tasks, trust.data.conversations]);

  const counts = useMemo(() => ({
    all: items.length,
    messages: items.filter((item) => item.kind === "messages").length,
    actions: items.filter((item) => item.kind === "actions").length,
    reviews: items.filter((item) => item.kind === "reviews").length,
    activity: items.filter((item) => item.kind === "activity").length,
  }), [items]);
  const visible = filter === "all" ? items : items.filter((item) => item.kind === filter);

  if (session.loading || loadingWorkspace || trust.loading) return <AppShell title="Inbox" eyebrow="MESSAGES · ACTIONS · REVIEWS · ACTIVITY"><div className="phase0-loading"><Inbox className="spin"/> Building your unified inbox…</div></AppShell>;
  if (!session.session || session.session.user.is_anonymous) return <AppShell title="Inbox" eyebrow="MESSAGES · ACTIONS · REVIEWS · ACTIVITY"><AuthDeferred /></AppShell>;

  const filters: Array<{ key: Filter; label: string }> = [
    { key: "all", label: "Everything" },
    { key: "messages", label: "Messages" },
    { key: "actions", label: "Actions" },
    { key: "reviews", label: "Reviews" },
    { key: "activity", label: "Activity" },
  ];

  return <AppShell title="Inbox" eyebrow="MESSAGES · ACTIONS · REVIEWS · ACTIVITY">
    <section className="operating-hero">
      <div className="operating-hero-copy"><span>UNIFIED INBOX</span><h2>One queue for work that needs attention.</h2><p>Private conversations, open company actions, review-like tasks and audited workspace activity are brought together without exposing protected content outside its original module.</p></div>
      <aside className="operating-stage-card"><span>PRIORITY SIGNAL</span><strong>{items.filter((item) => item.priority).length} urgent</strong><p>High-priority unresolved company actions are placed first.</p></aside>
    </section>

    <div className="operating-inbox" style={{ marginTop: 14 }}>
      <aside className="operating-inbox-filters" aria-label="Inbox filters">{filters.map((item) => <button type="button" key={item.key} onClick={() => setFilter(item.key)} className={filter === item.key ? "active" : ""}><span>{item.label}</span><b>{counts[item.key]}</b></button>)}</aside>
      <section className="operating-inbox-list">
        {visible.length ? visible.map((item) => {
          const Icon = item.kind === "messages" ? MessageCircle : item.kind === "reviews" ? ShieldCheck : item.kind === "activity" ? Activity : item.priority ? CircleAlert : ListTodo;
          return <Link key={item.id} to={item.path as any} className={`operating-inbox-item ${item.priority ? "priority" : ""}`}><i><Icon size={16}/></i><div><strong>{item.title}</strong><span>{item.detail}</span></div><small>{item.time ? new Date(item.time).toLocaleString() : ""}</small></Link>;
        }) : <div className="operating-empty"><CheckCircle2 size={22}/><strong>Nothing is waiting in this view.</strong><span>New conversations, unresolved company actions and reviewed workspace activity will appear here automatically.</span>{filter !== "all" ? <button className="button button-secondary" type="button" onClick={() => setFilter("all")}>Show everything</button> : <Link className="button button-secondary" to="/app/work">Choose work</Link>}</div>}
      </section>
    </div>
  </AppShell>;
}
