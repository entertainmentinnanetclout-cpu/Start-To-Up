import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BadgeDollarSign, Building2, FileSearch, MessageSquareText, ShieldCheck, Sparkles, WalletCards } from "lucide-react";
import { AppShell } from "../../components/app-shell";
import { DataState } from "../../components/live-data-ui";
import { updateWatchlistStatus, useInvestorWatchlist, type InvestorWatchItem } from "../../lib/media-v2-data";
import "../../media-v2.css";

export const Route = createFileRoute("/app/watchlist")({ component: InvestorWatchlistPage });

const statuses: InvestorWatchItem["status"][] = ["watching", "diligence", "contacted", "passed", "invested"];

function InvestorWatchlistPage() {
  const watchlist = useInvestorWatchlist();
  return (
    <AppShell title="Investor watchlist" eyebrow="PRIVATE DILIGENCE · PROJECT SIGNALS · FOLLOW-UP">
      <section className="v2-command investor-command">
        <div><span><WalletCards /> PRIVATE INVESTOR WORKSPACE</span><h2>Move interesting ventures from discovery into structured diligence.</h2><p>Projects saved from Media V2 stay private to your account. Track intent, notes and follow-up without exposing investor activity publicly.</p></div>
        <div className="investor-summary"><strong>{watchlist.data.length}</strong><span>tracked ventures</span><strong>{watchlist.data.filter((item) => item.status === "diligence").length}</strong><span>in diligence</span></div>
      </section>

      <DataState loading={watchlist.loading} error={watchlist.error} empty={!watchlist.data.length}>
        <section className="investor-watch-grid">
          {watchlist.data.map((item) => <WatchCard key={item.project_id} item={item} refresh={watchlist.refresh} />)}
        </section>
      </DataState>
      {!watchlist.loading && !watchlist.data.length ? <div className="v2-empty"><Sparkles /><h3>Your private venture watchlist is ready.</h3><p>Use “Investor watch” on project-linked media to add ventures here.</p></div> : null}
    </AppShell>
  );
}

function WatchCard({ item, refresh }: { item: InvestorWatchItem; refresh: () => Promise<void> }) {
  const [status, setStatus] = useState(item.status);
  const [notes, setNotes] = useState(item.private_notes ?? "");
  const [saving, setSaving] = useState(false);
  async function save() {
    setSaving(true);
    try { await updateWatchlistStatus(item.project_id, status, notes); await refresh(); } finally { setSaving(false); }
  }
  return (
    <article className="investor-watch-card">
      <header><i>{item.project?.name?.slice(0, 2).toUpperCase() ?? "ST"}</i><div><span>{item.project?.stage ?? "venture"}</span><h2>{item.project?.name ?? "Project"}</h2></div></header>
      <p>{item.project?.pitch ?? "Project context will appear as the venture profile develops."}</p>
      <div className="investor-facts">
        <span><BadgeDollarSign /> {item.project?.seeking_funding ? "Seeking funding" : "Funding status open"}</span>
        <span><FileSearch /> Private diligence notes</span>
        <span><ShieldCheck /> Not visible to founders</span>
      </div>
      {item.project?.funding_amount ? <strong className="funding-ask">R {Number(item.project.funding_amount).toLocaleString("en-ZA")} indicated ask</strong> : null}
      <label>Status<select value={status} onChange={(event) => setStatus(event.target.value as InvestorWatchItem["status"])}>{statuses.map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}</select></label>
      <label>Private notes<textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Traction questions, commercial risks, intro notes, diligence items…" /></label>
      <button className="button button-primary" disabled={saving} onClick={() => void save()}><MessageSquareText /> {saving ? "Saving" : "Save diligence"}</button>
    </article>
  );
}
