import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BarChart3, Building2, CheckCircle2, Compass, ExternalLink, Gauge, Globe2, Lightbulb,
  MessagesSquare, RefreshCw, Search, ShieldCheck, Sparkles, Target, UsersRound,
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AppShell } from "../../components/app-shell";
import { AuthDeferred } from "../../components/live-data-ui";
import { supabase } from "../../integrations/supabase/client";
import { metaAdLibraryUrl, saveMetaAdLibraryObservation } from "../../lib/startup-os-ad-library";
import { listStartupWorkspaces, type StartupWorkspace } from "../../lib/startup-os-foundation";
import {
  calculateMarketSize, calculateStartupHealth, createSurvey, loadValidationWorkspace, runCompanyIntelligence,
  saveBrandCheck, saveCompetitor, saveIdeaValidation, saveInterview, saveMarketModel, savePersona,
  saveStartupHealth, scoreIdeaValidation, type IdeaValidationInput, type MarketSizeInput, type StartupHealthInput,
} from "../../lib/startup-os-phase1";

export const Route = createFileRoute("/app/validate")({ component: ValidatePage });

type Tab = "overview" | "idea" | "market" | "companies" | "competitors" | "personas" | "interviews" | "surveys" | "brand" | "health";
const tabs: Array<{ key: Tab; label: string }> = [
  { key: "overview", label: "Overview" }, { key: "idea", label: "Idea Validator" },
  { key: "market", label: "Market Size" }, { key: "companies", label: "Company Intelligence" },
  { key: "competitors", label: "Competitors" }, { key: "personas", label: "Personas" },
  { key: "interviews", label: "Interviews" }, { key: "surveys", label: "Surveys" },
  { key: "brand", label: "Brand Check" }, { key: "health", label: "Startup Health" },
];
const emptyData = { ideas: [], markets: [], competitors: [], personas: [], interviews: [], surveys: [], brands: [], health: [], companies: [] } as any;
const num = (form: FormData, key: string, fallback = 0) => { const value = Number(form.get(key)); return Number.isFinite(value) ? value : fallback; };

function activeWorkspaceFrom(workspaces: StartupWorkspace[]) {
  if (typeof window === "undefined") return workspaces[0]?.organization_id || "";
  const stored = window.localStorage.getItem("start-to-up-active-workspace") || "";
  return workspaces.some((item) => item.organization_id === stored) ? stored : workspaces[0]?.organization_id || "";
}

function ValidatePage() {
  const [sessionReady, setSessionReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [workspaces, setWorkspaces] = useState<StartupWorkspace[]>([]);
  const [workspaceId, setWorkspaceId] = useState("");
  const [tab, setTab] = useState<Tab>("overview");
  const [data, setData] = useState<any>(emptyData);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [companyQuery, setCompanyQuery] = useState("");
  const [companyLocation, setCompanyLocation] = useState("");
  const [ideaPreview, setIdeaPreview] = useState<any>(null);
  const [marketPreview, setMarketPreview] = useState<any>(null);
  const [healthPreview, setHealthPreview] = useState<any>(null);
  const active = useMemo(() => workspaces.find((item) => item.organization_id === workspaceId), [workspaces, workspaceId]);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => { setSignedIn(Boolean(data.session)); setSessionReady(true); });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setSignedIn(Boolean(session)));
    return () => data.subscription.unsubscribe();
  }, []);

  async function refresh(id = workspaceId) {
    if (!id) return;
    setBusy(true);
    try { setData(await loadValidationWorkspace(id)); }
    catch { setNotice("Validation workspace data could not be refreshed. Confirm your workspace access and try again."); }
    finally { setBusy(false); }
  }

  useEffect(() => {
    if (!sessionReady || !signedIn) return;
    void listStartupWorkspaces().then((rows) => {
      setWorkspaces(rows);
      const id = activeWorkspaceFrom(rows);
      setWorkspaceId(id);
      if (id) void refresh(id);
    }).catch(() => setNotice("No company workspace could be loaded."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionReady, signedIn]);

  function changeWorkspace(id: string) {
    setWorkspaceId(id);
    window.localStorage.setItem("start-to-up-active-workspace", id);
    void refresh(id);
  }

  async function submitIdea(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!workspaceId) return;
    const formEl = event.currentTarget; const f = new FormData(formEl);
    const input: IdeaValidationInput = {
      ideaName: String(f.get("ideaName") || ""), problem: String(f.get("problem") || ""), customer: String(f.get("customer") || ""),
      urgency: num(f,"urgency"), evidenceCount: num(f,"evidenceCount"), payingSignals: num(f,"payingSignals"),
      competitorKnowledge: num(f,"competitorKnowledge"), differentiation: num(f,"differentiation"),
      monetisationClarity: num(f,"monetisationClarity"), executionReadiness: num(f,"executionReadiness"),
    };
    const preview = scoreIdeaValidation(input); setIdeaPreview(preview); setBusy(true);
    try { await saveIdeaValidation(workspaceId,input); setNotice(`Idea validation saved at ${preview.score}/100. It reflects entered evidence and is not a prediction of success.`); await refresh(); }
    catch { setNotice("Idea validation could not be saved."); } finally { setBusy(false); }
  }

  async function submitMarket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!workspaceId) return;
    const f = new FormData(event.currentTarget);
    const input: MarketSizeInput = { totalCustomers:num(f,"totalCustomers"), annualSpendPerCustomer:num(f,"annualSpend"), serviceablePercent:num(f,"serviceablePercent"), obtainablePercent:num(f,"obtainablePercent"), currency:String(f.get("currency") || "ZAR") };
    const preview = calculateMarketSize(input); setMarketPreview(preview); setBusy(true);
    try { await saveMarketModel(workspaceId,String(f.get("name") || "Market model"),input); setNotice("Market model saved. TAM/SAM/SOM remain assumption-based until supported by external evidence."); await refresh(); }
    catch { setNotice("Market model could not be saved."); } finally { setBusy(false); }
  }

  async function searchCompanies() {
    if (!workspaceId || companyQuery.trim().length < 2) return;
    const approved = window.confirm("Google Places can be billable and may require billing prepayment/account verification. Continue using your connected Google Places account for this search?");
    if (!approved) return;
    setBusy(true); setNotice("Searching public business records…");
    try {
      const result = await runCompanyIntelligence(workspaceId,"places_search",{ query:companyQuery,location:companyLocation,acknowledgeBillable:true,limit:15 });
      setNotice(`Found ${result.results?.length || 0} businesses. Company facts are observed from Google Places; demand scores are estimated proxies, not revenue or search volume.`);
      await refresh();
    } catch { setNotice("Company discovery could not run. Connect Google Places in Integrations and confirm its billing/API permissions."); }
    finally { setBusy(false); }
  }

  async function scanWebsite(record: any) {
    if (!record.website) return;
    setBusy(true); setNotice(`Auditing ${record.company_name}…`);
    try {
      const result = await runCompanyIntelligence(workspaceId,"website_scan",{ url:record.website,intelligenceId:record.id || "",companyName:record.company_name });
      setNotice(`Website audit complete: SEO ${result.seoScore}/100 · technical response ${result.performanceScore}/100. The performance score is not owner-verified Core Web Vitals.`);
      await refresh();
    } catch { setNotice("The public website could not be scanned safely."); }
    finally { setBusy(false); }
  }

  async function recordMetaObservation(record: any, state: "active_observed" | "none_observed") {
    if (!record.id) return setNotice("Refresh this company record before saving an advertising observation.");
    const evidenceUrl = metaAdLibraryUrl(record.company_name, "ZA");
    setBusy(true);
    try {
      await saveMetaAdLibraryObservation(workspaceId,record.id,state,evidenceUrl);
      setNotice(state === "active_observed" ? "Active Meta ads recorded as a public observation. No private spend, CTR, CPA, conversion or ROAS claim was added." : "No active Meta ads were observed in the reviewed Ad Library search. This is an observation at the time checked, not proof that the company never advertises.");
      await refresh();
    } catch { setNotice("The Meta Ad Library observation could not be saved."); }
    finally { setBusy(false); }
  }

  async function submitCompetitor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const formEl=event.currentTarget; const f=new FormData(formEl); setBusy(true);
    try { await saveCompetitor(workspaceId,{ name:String(f.get("name")||""),website:String(f.get("website")||"")||null,location:String(f.get("location")||""),positioning:String(f.get("positioning")||""),pricing_notes:String(f.get("pricing")||""),strengths:String(f.get("strengths")||""),weaknesses:String(f.get("weaknesses")||""),observed_ads:f.get("observedAds")==="yes",ad_evidence_url:String(f.get("adEvidence")||"")||null,evidence_confidence:"owner_entered" }); formEl.reset(); setNotice("Competitor saved. Advertising status remains owner-entered unless supported by an observed or verified source."); await refresh(); }
    catch { setNotice("Competitor could not be saved."); } finally { setBusy(false); }
  }

  async function submitPersona(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const formEl=event.currentTarget; const f=new FormData(formEl); setBusy(true);
    try { await savePersona(workspaceId,{ name:String(f.get("name")||""),segment:String(f.get("segment")||""),jobs_to_be_done:String(f.get("jobs")||""),pain_points:String(f.get("pains")||""),desired_outcomes:String(f.get("outcomes")||""),buying_triggers:String(f.get("triggers")||""),objections:String(f.get("objections")||""),channels:String(f.get("channels")||""),evidence_notes:String(f.get("evidence")||""),confidence:"owner_entered" }); formEl.reset(); await refresh(); setNotice("Customer persona saved. Strengthen it with interview and survey evidence over time."); }
    catch { setNotice("Persona could not be saved."); } finally { setBusy(false); }
  }

  async function submitInterview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const formEl=event.currentTarget; const f=new FormData(formEl); setBusy(true);
    try { await saveInterview(workspaceId,{ participant_label:String(f.get("participant")||""),participant_segment:String(f.get("segment")||""),problem_evidence:String(f.get("problemEvidence")||""),current_alternative:String(f.get("alternative")||""),urgency_score:num(f,"urgency"),willingness_to_pay:String(f.get("willingness")||""),quotes:String(f.get("quotes")||""),insights:String(f.get("insights")||""),next_questions:String(f.get("nextQuestions")||"") }); formEl.reset(); await refresh(); setNotice("Interview evidence saved."); }
    catch { setNotice("Interview could not be saved."); } finally { setBusy(false); }
  }

  async function submitSurvey(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const formEl=event.currentTarget; const f=new FormData(formEl); setBusy(true);
    try { await createSurvey(workspaceId,{ title:String(f.get("title")||""),purpose:String(f.get("purpose")||""),status:"draft" }); formEl.reset(); await refresh(); setNotice("Survey draft created. Response data remains private by default."); }
    catch { setNotice("Survey could not be created."); } finally { setBusy(false); }
  }

  async function submitBrand(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const f=new FormData(event.currentTarget); const proposedName=String(f.get("name")||""); const domain=String(f.get("domain")||""); setBusy(true);
    try { const result=await runCompanyIntelligence(workspaceId,"brand_domain_check",{proposedName,domain}); setNotice(result.disclaimer); await refresh(); }
    catch { try { await saveBrandCheck(workspaceId,{ proposed_name:proposedName,domain,notes:"Automated network check unavailable." }); setNotice("Brand check saved for manual verification. Domain, company-name and trademark availability still require authoritative confirmation."); await refresh(); } catch { setNotice("Brand check could not be saved."); } }
    finally { setBusy(false); }
  }

  async function submitHealth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const f=new FormData(event.currentTarget); const input:StartupHealthInput={validation:num(f,"validation"),product:num(f,"product"),finance:num(f,"finance"),sales:num(f,"sales"),digital:num(f,"digital"),compliance:num(f,"compliance"),team:num(f,"team")}; const preview=calculateStartupHealth(input); setHealthPreview(preview); setBusy(true);
    try { await saveStartupHealth(workspaceId,input); await refresh(); setNotice(`Startup Health baseline saved at ${preview.score}/100. It is a structured self-assessment, not an external valuation or certification.`); }
    catch { setNotice("Startup Health assessment could not be saved."); } finally { setBusy(false); }
  }

  if (!sessionReady) return <AppShell title="Validate & Research" eyebrow="STARTUP OS · PHASE 1"><div className="phase0-loading"><RefreshCw className="spin"/> Restoring validation workspace…</div></AppShell>;
  if (!signedIn) return <AppShell title="Validate & Research" eyebrow="STARTUP OS · PHASE 1"><AuthDeferred /></AppShell>;
  if (!workspaces.length) return <AppShell title="Validate & Research" eyebrow="STARTUP OS · PHASE 1"><section className="phase0-onboarding-card"><Building2/><h2>Create your company workspace first.</h2><p>Phase 1 research attaches evidence to the shared company record.</p><Link to="/app/startup-os" className="button button-primary">Open Startup OS</Link></section></AppShell>;

  const latestIdea=data.ideas[0]; const latestHealth=data.health[0];
  return <AppShell title="Validate & Research" eyebrow="STARTUP OS · PHASE 1" action={<Link to="/app/integrations" className="button button-primary">Integrations</Link>}>
    <section className="phase1-toolbar"><div><span>ACTIVE COMPANY</span><select value={workspaceId} onChange={(e)=>changeWorkspace(e.target.value)}>{workspaces.map((w)=><option key={w.organization_id} value={w.organization_id}>{w.name}</option>)}</select></div><div className="phase1-confidence"><ShieldCheck/><span><strong>Evidence-first scoring</strong><small>Observed · Estimated · Owner-entered · Verified</small></span></div></section>
    <nav className="phase1-tabs" aria-label="Validation tools">{tabs.map((item)=><button key={item.key} className={tab===item.key?"active":""} onClick={()=>setTab(item.key)}>{item.label}</button>)}</nav>
    {notice?<p className="phase0-notice" role="status">{notice}</p>:null}{busy?<div className="phase1-busy"><RefreshCw className="spin"/> Working…</div>:null}

    {tab==="overview"?<><section className="phase1-hero"><div><span>VALIDATE BEFORE YOU SCALE</span><h2>Turn assumptions into evidence.</h2><p>Idea validation, market sizing, company discovery, competitor research and customer evidence all attach to the same company workspace.</p></div><Sparkles/></section><section className="phase0-kpis phase1-kpis"><article><Lightbulb/><div><span>Idea validation</span><strong>{latestIdea?.score ?? "—"}</strong><small>{latestIdea?.stage || "No assessment yet"}</small></div></article><article><Globe2/><div><span>Market models</span><strong>{data.markets.length}</strong><small>TAM / SAM / SOM</small></div></article><article><Search/><div><span>Companies researched</span><strong>{data.companies.length}</strong><small>intelligence records</small></div></article><article><Gauge/><div><span>Startup health</span><strong>{latestHealth?.score ?? "—"}</strong><small>baseline self-assessment</small></div></article></section><div className="phase1-tool-grid">{tabs.filter(x=>x.key!=="overview").map(item=><button key={item.key} onClick={()=>setTab(item.key)}><Compass/><strong>{item.label}</strong><span>Open tool →</span></button>)}</div></>:null}

    {tab==="idea"?<Workbench icon={<Lightbulb/>} title="BUSINESS IDEA VALIDATOR" note="Weighted evidence score; not a prediction of success."><form className="phase1-form" onSubmit={submitIdea}><label>Idea / venture name<input name="ideaName" required/></label><label>Target customer<input name="customer" required/></label><label className="wide">Problem statement<textarea name="problem" required rows={3}/></label><ScoreField name="urgency" label="Problem urgency"/><label>Customer evidence points<input name="evidenceCount" type="number" min="0" defaultValue="0"/></label><label>Paying / pre-commitment signals<input name="payingSignals" type="number" min="0" defaultValue="0"/></label><ScoreField name="competitorKnowledge" label="Competitive understanding"/><ScoreField name="differentiation" label="Differentiation strength"/><ScoreField name="monetisationClarity" label="Monetisation clarity"/><ScoreField name="executionReadiness" label="Execution readiness"/><button className="button button-primary wide">Score & save validation</button></form>{ideaPreview?<ScoreResult score={ideaPreview.score} label={ideaPreview.stage}/>:null}</Workbench>:null}

    {tab==="market"?<Workbench icon={<Target/>} title="MARKET SIZE CALCULATOR" note="Assumption-driven TAM / SAM / SOM model."><form className="phase1-form" onSubmit={submitMarket}><label>Model name<input name="name" required defaultValue={`${active?.name || "Company"} base market`}/></label><label>Currency<select name="currency" defaultValue="ZAR"><option>ZAR</option><option>USD</option><option>EUR</option><option>GBP</option></select></label><label>Total potential customers<input name="totalCustomers" type="number" min="0" required/></label><label>Annual spend per customer<input name="annualSpend" type="number" min="0" step="0.01" required/></label><label>Serviceable market %<input name="serviceablePercent" type="number" min="0" max="100" defaultValue="30"/></label><label>Obtainable share of SAM %<input name="obtainablePercent" type="number" min="0" max="100" defaultValue="5"/></label><button className="button button-primary wide">Calculate & save</button></form>{marketPreview?<div className="phase1-market-result"><Metric label="TAM" value={marketPreview.tam} currency={marketPreview.currency}/><Metric label="SAM" value={marketPreview.sam} currency={marketPreview.currency}/><Metric label="SOM" value={marketPreview.som} currency={marketPreview.currency}/></div>:null}</Workbench>:null}

    {tab==="companies"?<Workbench icon={<Search/>} title="COMPANY INTELLIGENCE" note="Find businesses, detect website presence, inspect Meta ads and identify digital-growth opportunities."><div className="phase1-searchbar"><input value={companyQuery} onChange={(e)=>setCompanyQuery(e.target.value)} placeholder="e.g. plumbers, restaurants, law firms"/><input value={companyLocation} onChange={(e)=>setCompanyLocation(e.target.value)} placeholder="e.g. Pretoria"/><button onClick={()=>void searchCompanies()} disabled={busy}>Search companies</button></div><aside className="startup-integration-cost"><ShieldCheck/><div><strong>Google Places billing warning</strong><span>Live discovery uses the workspace's connected Google Places account and may be billable. Start To Up asks for confirmation before each Places search.</span></div></aside><div className="phase1-company-list">{data.companies.map((record:any)=><CompanyCard key={record.id} record={record} onScan={()=>void scanWebsite(record)} onMeta={(state)=>void recordMetaObservation(record,state)}/>)}{!data.companies.length?<div className="phase0-empty">No company intelligence records yet.</div>:null}</div></Workbench>:null}

    {tab==="competitors"?<Workbench icon={<BarChart3/>} title="COMPETITOR INTELLIGENCE" note="Record evidence explicitly; never infer private advertising performance."><form className="phase1-form" onSubmit={submitCompetitor}><label>Name<input name="name" required/></label><label>Website<input name="website" type="url"/></label><label>Location<input name="location"/></label><label>Observed public ads?<select name="observedAds"><option value="no">No / unknown</option><option value="yes">Yes, observed</option></select></label><label className="wide">Positioning<textarea name="positioning" rows={2}/></label><label>Pricing notes<textarea name="pricing" rows={2}/></label><label>Ad evidence URL<input name="adEvidence" type="url"/></label><label>Strengths<textarea name="strengths" rows={2}/></label><label>Weaknesses<textarea name="weaknesses" rows={2}/></label><button className="button button-primary wide">Save competitor</button></form><RecordList rows={data.competitors} primary="name" secondary="positioning"/></Workbench>:null}

    {tab==="personas"?<Workbench icon={<UsersRound/>} title="ICP / CUSTOMER PERSONA" note="Start with hypotheses; strengthen them with interviews and surveys."><form className="phase1-form" onSubmit={submitPersona}><label>Name<input name="name" required placeholder="e.g. Pretoria SME owner"/></label><label>Segment<input name="segment"/></label><label className="wide">Jobs to be done<textarea name="jobs" rows={2}/></label><label>Pain points<textarea name="pains" rows={2}/></label><label>Desired outcomes<textarea name="outcomes" rows={2}/></label><label>Buying triggers<textarea name="triggers" rows={2}/></label><label>Objections<textarea name="objections" rows={2}/></label><label>Channels<textarea name="channels" rows={2}/></label><label className="wide">Evidence notes<textarea name="evidence" rows={2}/></label><button className="button button-primary wide">Save persona</button></form><RecordList rows={data.personas} primary="name" secondary="segment"/></Workbench>:null}

    {tab==="interviews"?<Workbench icon={<MessagesSquare/>} title="CUSTOMER INTERVIEW MANAGER" note="Capture problem evidence, current alternatives and willingness-to-pay signals."><form className="phase1-form" onSubmit={submitInterview}><label>Participant label<input name="participant" required placeholder="Anonymous label or customer code"/></label><label>Segment<input name="segment"/></label><label className="wide">Problem evidence<textarea name="problemEvidence" rows={2}/></label><label>Current alternative<textarea name="alternative" rows={2}/></label><ScoreField name="urgency" label="Urgency score"/><label>Willingness to pay<textarea name="willingness" rows={2}/></label><label>Quotes / direct language<textarea name="quotes" rows={2}/></label><label className="wide">Insights<textarea name="insights" rows={2}/></label><label className="wide">Next questions<textarea name="nextQuestions" rows={2}/></label><button className="button button-primary wide">Save interview</button></form><RecordList rows={data.interviews} primary="participant_label" secondary="insights"/></Workbench>:null}

    {tab==="surveys"?<Workbench icon={<CheckCircle2/>} title="VALIDATION SURVEYS" note="Create research surveys; response data stays private by default."><form className="phase1-form" onSubmit={submitSurvey}><label>Survey title<input name="title" required/></label><label className="wide">Purpose<textarea name="purpose" rows={2}/></label><button className="button button-primary wide">Create draft survey</button></form><RecordList rows={data.surveys} primary="title" secondary="status"/></Workbench>:null}

    {tab==="brand"?<Workbench icon={<Globe2/>} title="BRAND NAME CHECKER" note="Domain/network signals only — not a company-name or trademark clearance."><form className="phase1-form" onSubmit={submitBrand}><label>Proposed brand name<input name="name" required/></label><label>Domain to check<input name="domain" required placeholder="example.co.za"/></label><button className="button button-primary wide">Run signal check</button></form><aside className="phase0-privacy-note"><ShieldCheck/><div><strong>Legal availability is not automated.</strong><span>A domain with no DNS record can still be registered or reserved, and a clear domain does not mean a company name or trademark is available. Confirm with the registrar and relevant official registries.</span></div></aside><RecordList rows={data.brands} primary="proposed_name" secondary="domain_signal"/></Workbench>:null}

    {tab==="health"?<Workbench icon={<Gauge/>} title="STARTUP HEALTH BASELINE" note="Structured self-assessment that becomes evidence-driven as later phases go live."><form className="phase1-form" onSubmit={submitHealth}><ScoreField name="validation" label="Validation"/><ScoreField name="product" label="Product readiness"/><ScoreField name="finance" label="Financial readiness"/><ScoreField name="sales" label="Sales traction"/><ScoreField name="digital" label="Digital presence"/><ScoreField name="compliance" label="Compliance readiness"/><ScoreField name="team" label="Team readiness"/><button className="button button-primary wide">Calculate & save baseline</button></form>{healthPreview?<ScoreResult score={healthPreview.score} label={`Priorities: ${healthPreview.next.map((x:any)=>x.key).join(", ")}`}/>:null}</Workbench>:null}
  </AppShell>;
}

function Workbench({icon,title,note,children}:{icon:React.ReactNode;title:string;note:string;children:React.ReactNode}) { return <section className="phase0-panel phase1-workbench"><header><div>{icon}<span>{title}</span></div><small>{note}</small></header>{children}</section>; }
function ScoreField({name,label}:{name:string;label:string}) { return <label>{label} (0–100)<input name={name} type="number" min="0" max="100" defaultValue="50" required/></label>; }
function ScoreResult({score,label}:{score:number;label:string}) { return <div className="phase1-score-result"><strong>{score}/100</strong><span>{label}</span></div>; }
function Metric({label,value,currency}:{label:string;value:number;currency:string}) { return <article><span>{label}</span><strong>{new Intl.NumberFormat("en-ZA",{style:"currency",currency,maximumFractionDigits:0}).format(value||0)}</strong></article>; }
function RecordList({rows,primary,secondary}:{rows:any[];primary:string;secondary:string}) { return <div className="phase0-simple-list phase1-record-list">{rows.slice(0,10).map((row:any)=><article key={row.id}><CheckCircle2/><div><strong>{row[primary]||"Record"}</strong><small>{String(row[secondary]||"")}</small></div></article>)}{!rows.length?<div className="phase0-empty">No records yet.</div>:null}</div>; }
function CompanyCard({record,onScan,onMeta}:{record:any;onScan:()=>void;onMeta:(state:"active_observed"|"none_observed")=>void}) {
  const adLibrary=metaAdLibraryUrl(record.company_name,"ZA");
  return <article><div className="phase1-company-main"><div><strong>{record.company_name}</strong><span>{record.address||record.location||record.category||"Business record"}</span></div><b className={record.website_status==="not_detected"?"opportunity":"detected"}>{String(record.website_status||"unknown").replaceAll("_"," ")}</b></div><div className="phase1-company-metrics"><span>Rating <strong>{record.rating ?? "—"}</strong></span><span>Reviews <strong>{record.review_count ?? "—"}</strong></span><span>Demand proxy <strong>{record.demand_score ?? "—"}</strong></span><span>SEO <strong>{record.seo_score ?? "—"}</strong></span><span>Opportunity <strong>{record.opportunity_score ?? "—"}</strong></span><span>Meta ads <strong>{String(record.meta_ads_status||"unknown").replaceAll("_"," ")}</strong></span></div><footer><div className="phase1-company-actions">{record.website?<button onClick={onScan}>Audit website</button>:<span>No website detected in source record — verify before outreach.</span>}<a href={adLibrary} target="_blank" rel="noreferrer">Check Meta Ad Library <ExternalLink/></a>{record.id?<><button className="secondary" onClick={()=>onMeta("active_observed")}>Record active ads observed</button><button className="secondary" onClick={()=>onMeta("none_observed")}>Record none observed</button></>:null}</div>{record.google_maps_url?<a href={record.google_maps_url} target="_blank" rel="noreferrer">Maps <ExternalLink/></a>:null}</footer></article>;
}
