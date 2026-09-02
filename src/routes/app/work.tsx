import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Bookmark, BriefcaseBusiness, Check, Compass, Sparkles, X } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { AppShell } from "../../components/app-shell";
import {
  journeyStages,
  operatingRoutes,
  personaOptions,
  readOperatingPreferences,
  readSavedViews,
  removeSavedView,
  saveCurrentView,
  saveOperatingPreferences,
  stageOptions,
  suggestedRoutePaths,
  workGroups,
  type CompanyStage,
  type OperatingPersona,
  type SavedView,
} from "../../lib/ux-operating-layer";

export const Route = createFileRoute("/app/work")({ component: WorkPage });

const groupDescription: Record<string, string> = {
  Build: "Ship products, websites, integrations and collaborative delivery.",
  Grow: "Validate demand, win customers and build repeatable acquisition.",
  Operate: "Run the company with control across execution, legal and company data.",
  Capital: "Prepare for funding, manage investors and make capital decisions.",
  Network: "Collaborate with people, ventures, institutions and opportunities.",
};

function WorkPage() {
  const current = readOperatingPreferences();
  const [persona, setPersona] = useState<OperatingPersona>(current?.persona || "founder");
  const [stage, setStage] = useState<CompanyStage>(current?.stage || "launching");
  const [savedViews, setSavedViews] = useState<SavedView[]>(() => readSavedViews());
  const [saveRoute, setSaveRoute] = useState("/app/revenue");
  const [notice, setNotice] = useState("");
  const suggested = useMemo(() => suggestedRoutePaths({ persona, stage, completedAt: current?.completedAt || new Date().toISOString() }).map((path) => operatingRoutes.find((route) => route.path === path)).filter(Boolean), [persona, stage, current?.completedAt]);
  const stageIndex = journeyStages.findIndex((item) => item.stage === stage);

  function applyContext() {
    saveOperatingPreferences(persona, stage);
    setNotice("Workspace recommendations updated. No tools were removed.");
  }

  function saveView(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") || "").trim();
    const result = saveCurrentView(name, saveRoute);
    if (!result) return;
    setSavedViews(readSavedViews());
    setNotice(`Saved “${result.name}” to Command Search.`);
    event.currentTarget.reset();
  }

  function removeView(id: string) {
    removeSavedView(id);
    setSavedViews(readSavedViews());
  }

  return <AppShell title="Work" eyebrow="TASK-BASED COMPANY OPERATING SYSTEM">
    <div className="operating-work-page">
      <section className="operating-hero">
        <div className="operating-hero-copy"><span>GUIDED WORK</span><h2>Start with the outcome, not the module.</h2><p>Use the company journey and role-aware recommendations to decide what to do next. Every underlying Start To Up capability remains available under the grouped work areas below.</p></div>
        <aside className="operating-stage-card"><span>ACTIVE OPERATING CONTEXT</span><strong>{personaOptions.find((item) => item.value === persona)?.label}</strong><p>{stageOptions.find((item) => item.value === stage)?.label} stage</p><div className="operating-onboarding-summary"><span>{stage}</span><span>{persona}</span></div></aside>
      </section>

      <section className="operating-panel">
        <header><h3>Personalise the workspace</h3><span className="operating-save-state"><Check size={13}/> Local navigation preference</span></header>
        <div className="phase0-form" style={{ gridTemplateColumns: "1fr 1fr auto" }}>
          <label>Role<select value={persona} onChange={(event) => setPersona(event.target.value as OperatingPersona)}>{personaOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
          <label>Company stage<select value={stage} onChange={(event) => setStage(event.target.value as CompanyStage)}>{stageOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
          <button className="button button-primary" type="button" onClick={applyContext}>Update workspace</button>
        </div>
        {notice ? <p className="phase0-notice" role="status">{notice}</p> : null}
      </section>

      <section className="operating-section">
        <div className="operating-section-head"><div><span>COMPANY JOURNEY</span><h3>Validate → Build → Launch → Sell → Operate → Scale</h3></div></div>
        <div className="operating-journey">{journeyStages.map((item, index) => <Link key={item.stage} to={item.path as any} className={index === stageIndex ? "active" : index < stageIndex ? "complete" : ""}><b>{item.label}</b><span>{item.verb}</span></Link>)}</div>
      </section>

      <section className="operating-section">
        <div className="operating-section-head"><div><span>FOR YOU</span><h3>Recommended for this role and stage</h3></div><Sparkles size={18}/></div>
        <div className="operating-for-you">{suggested.map((route) => route ? <Link key={route.path} to={route.path as any} className="operating-tool-card"><Sparkles size={18}/><strong>{route.label}</strong><span>{route.description}</span><small>Recommended →</small></Link> : null)}</div>
      </section>

      <section className="operating-section">
        <div className="operating-section-head"><div><span>ALL WORK</span><h3>Five operating areas. No module hunting.</h3></div><BriefcaseBusiness size={18}/></div>
        <div className="operating-work-groups">{workGroups.map(({ group, routes }) => <section className="operating-work-group" key={group}><header><div><h3>{group}</h3><span>{groupDescription[group]}</span></div><Compass size={17}/></header><div className="operating-work-group-grid">{routes.map((route) => <Link key={route.path} to={route.path as any} className="operating-tool-card"><strong>{route.label}</strong><span>{route.description}</span><small>Open <ArrowRight size={11}/></small></Link>)}</div></section>)}</div>
      </section>

      <section className="operating-panel">
        <header><h3>Saved views</h3><Bookmark size={17}/></header>
        <p style={{ marginTop: 0, color: "#768297", fontSize: 10, lineHeight: 1.55 }}>Save the company destinations you return to repeatedly. They also appear inside Command Search.</p>
        <form className="operating-saved-view-form" onSubmit={saveView}><input name="name" placeholder="e.g. Weekly sales pipeline" required minLength={2}/><select value={saveRoute} onChange={(event) => setSaveRoute(event.target.value)}>{operatingRoutes.filter((route) => route.group !== "Core").map((route) => <option key={route.path} value={route.path}>{route.label}</option>)}</select><button>Save view</button></form>
        <div className="operating-saved-views">{savedViews.length ? savedViews.map((view) => <span className="operating-saved-view" key={view.id}><a href={view.path}>{view.name}</a><button type="button" onClick={() => removeView(view.id)} aria-label={`Remove ${view.name}`}><X size={12}/></button></span>) : <span style={{ color: "#8591a2", fontSize: 9 }}>No saved views yet.</span>}</div>
      </section>
    </div>
  </AppShell>;
}
