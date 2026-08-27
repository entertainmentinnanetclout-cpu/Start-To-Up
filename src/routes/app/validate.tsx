import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BarChart3,
  Building2,
  CheckCircle2,
  Compass,
  ExternalLink,
  Gauge,
  Globe2,
  Lightbulb,
  MessagesSquare,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  UsersRound,
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AppShell } from "../../components/app-shell";
import { AuthDeferred } from "../../components/live-data-ui";
import { supabase } from "../../integrations/supabase/client";
import { listStartupWorkspaces, type StartupWorkspace } from "../../lib/startup-os-foundation";
import {
  calculateMarketSize,
  calculateStartupHealth,
  loadValidationWorkspace,
  runCompanyIntelligence,
  saveBrandCheck,
  saveCompetitor,
  saveIdeaValidation,
  saveInterview,
  saveMarketModel,
  savePersona,
  saveStartupHealth,
  scoreIdeaValidation,
  createSurvey,
  type IdeaValidationInput,
  type MarketSizeInput,
  type StartupHealthInput,
} from "../../lib/startup-os-phase1";

export const Route = createFileRoute("/app/validate")({ component: ValidatePage });

type Tab = "overview" | "idea" | "market" | "companies" | "competitors" | "personas" | "interviews" | "surveys" | "brand" | "health";
const tabs: Array<{ key: Tab; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "idea", label: "Idea Validator" },
  { key: "market", label: "Market Size" },
  { key: "companies", label: "Company Intelligence" },
  { key: "competitors", label: "Competitors" },
  { key: "personas", label: "Personas" },
  { key: "interviews", label: "Interviews" },
  { key: "surveys", label: "Surveys" },
  { key: "brand", label: "Brand Check" },
  { key: "health", label: "Startup Health" },
];

const emptyData = { ideas: [], markets: [], competitors: [], personas: [], interviews: [], surveys: [], brands: [], health: [], companies: [] } as any;

function number(form: FormData, key: string, fallback = 0) { const value = Number(form.get(key)); return Number.isFinite(value) ? value : fallback; }
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
  const [placesResults, setPlacesResults] = useState<any[]>([]);
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
    catch { setNotice("Validation workspace data could not be refreshed. Try again after confirming your workspace access."); }
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
    const f = new FormData(event.currentTarget);
    const input: IdeaValidationInput = {
      ideaName: String(f.get("ideaName") || ""), problem: String(f.get("problem") || ""), customer: String(f.get("customer") || ""),
      urgency: number(f,"urgency"), evidenceCount: number(f,"evidenceCount"), payingSignals: number(f,"payingSignals"), competitorKnowledge: number(f,"competitorKnowledge"), differentiation: number(f,"differentiation"), monetisationClarity: number(f,"monetisationClarity"), executionReadiness: number(f,"executionReadiness"),
    };
    const preview = scoreIdeaValidation(input); setIdeaPreview(preview); setBusy(true);
    try { await saveIdeaValidation(workspaceId,input); setNotice(`Idea validation saved at ${preview.score}/100. Scores are based on the evidence entered, not a guarantee of market success.`); await refresh(); }
    catch { setNotice("Idea validation could not be saved."); } finally { setBusy(false); }
  }

  async function submitMarket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!workspaceId) return;
    const f = new FormData(event.currentTarget);
    const input: MarketSizeInput = { totalCustomers:number(f,"totalCustomers"), annualSpendPerCustomer:number(f,"annualSpend"), serviceablePercent:number(f,"serviceablePercent"), obtainablePercent:number(f,"obtainablePercent"), currency:String(f.get("currency") || "ZAR") };
    const preview = calculateMarketSize(input); setMarketPreview(preview); setBusy(true);
    try { await saveMarketModel(workspaceId,String(f.get("name") || "Market model"),input); setNotice("Market model saved. TAM/SAM/SOM are assumption-based estimates until supported by external market evidence."); await refresh(); }
    catch { setNotice("Market model could not be saved."); } finally { setBusy(false); }
  }

  async function searchCompanies() {
    if (!workspaceId || companyQuery.trim().length < 2) return;
    if (!window.confirm("Google Places can be billable and may require account prepayment/billing. Continue using your connected Google Places account for this search?")) return;
    setBusy(true); setNotice("Searching public business records…");
    try {
      const result = await runCompanyIntelligence(workspaceId,"places_search",{ query:companyQuery,location:companyLocation,acknowledgeBillable:true,limit:15 });
      setPlacesResults(result.results || []);
      setNotice(`Found ${result.results?.length || 0} businesses. Company facts are observed from Google Places; demand scores shown here are estimated proxies, not revenue or search volume.`);
      await refresh();
    } catch { setNotice("Company discovery could not run. Connect Google Places in Integrations, then confirm its billing/API permissions."); }
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

  async function submitCompetitor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const f=new FormData(event.currentTarget); setBusy(true);
    try { await saveCompetitor(workspaceId,{ name:String(f.get("name")||""),website:String(f.get("website")||"")||null,location:String(f.get("location")||""),positioning:String(f.get("positioning")||""),pricing_notes:String(f.get("pricing")||""),strengths:String(f.get("strengths")||""),weaknesses:String(f.get("weaknesses")||""),observed_ads:f.get("observedAds")==="yes",ad_evidence_url:String(f.get("adEvidence")||"")||null,evidence_confidence:"owner_entered" }); event.currentTarget.reset(); setNotice("Competitor saved. Advertising status remains owner-entered unless a source is attached or verified later."); await refresh(); }
    catch { setNotice("Competitor could not be saved."); } finally { setBusy(false); }
  }

  async function submitPersona(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const f=new FormData(event.currentTarget); setBusy(true);
    try { await savePersona(workspaceId,{ name:String(f.get("name")||""),segment:String(f.get("segment")||""),jobs_to_be_done:String(f.get("jobs")||""),pain_points:String(f.get("pains")||""),desired_outcomes:String(f.get("outcomes")||""),buying_triggers:String(f.get("triggers")||""),objections:String(f.get("objections")||""),channels:String(f.get("channels")||""),evidence_notes:String(f.get("evidence")||""),confidence:"owner_entered" }); event.currentTarget.reset(); await refresh(); setNotice("Customer persona saved. Strengthen it with interview/survey evidence over time."); }
    catch { setNotice("Persona could not be saved."); } finally { setBusy(false); }
  }

  async function submitInterview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const f=new FormData(event.currentTarget); setBusy(true);
    try { await saveInterview(workspaceId,{ participant_label:String(f.get("participant")||""),participant_segment:String(f.get("segment")||""),problem_evidence:String(f.get("problemEvidence")||""),current_alternative:String(f.get("alternative")||""),urgency_score:number(f,"urgency"),willingness_to_pay:String(f.get("willingness")||""),quotes:String(f.get("quotes")||""),insights:String(f.get("insights")||""),next_questions:String(f.get("nextQuestions")||"") }); event.currentTarget.reset(); await refresh(); setNotice("Interview evidence saved."); }
    catch { setNotice("Interview could not be saved."); } finally { setBusy(false); }
  }

  async function submitSurvey(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const f=new FormData(event.currentTarget); setBusy(true);
    try { await createSurvey(workspaceId,{ title:String(f.get("title")||""),purpose:String(f.get("purpose")||""),status:"draft" }); event.currentTarget.reset(); await refresh(); setNotice("Survey draft created. Public-response collection remains server-controlled and private by default."); }
    catch { setNotice("Survey could not be created."); } finally { setBusy(false); }
  }

  async function submitBrand(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const f=new FormData(event.currentTarget); const proposedName=String(f.get("name")||""); const domain=String(f.get("domain")||""); setBusy(true);
    try { const result=await runCompanyIntelligence(workspaceId,"brand_domain_check",{proposedName,domain}); setNotice(result.disclaimer); await refresh(); }
    catch { try { await saveBrandCheck(workspaceId,{ proposed_name:proposedName,domain,notes:"Automated network check unavailable." }); setNotice("Brand check saved for manual verification. Domain/company/trademark availability still requires authoritative confirmation."); await refresh(); } catch { setNotice("Brand check could not be saved."); } }
    finally { setBusy(false); }
  }

  async function submitHealth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const f=new FormData(event.currentTarget); const input:StartupHealthInput={validation:number(f,"validation"),product:number(f,"product"),finance:number(f,"finance"),sales:number(f,"sales"),digital:number(f,"digital"),compliance:number(f,"compliance"),team:number(f,"team")}; const preview=calculateStartupHealth(input); setHealthPreview(preview); setBusy(true);
    try { await saveStartupHealth(workspaceId,input); await refresh(); setNotice(`Startup Health baseline saved at ${preview.score}/100. It is a structured self-assessment, not an external valuation or certification.`); }
    catch { setNotice("Startup Health assessment could not be saved."); } finally { setBusy(false); }
  }

  if (!sessionReady) return <AppShell title="Validate & Research" eyebrow="STARTUP OS · PHASE 1"><div className="phase0-loading"><RefreshCw className="spin"/> Restoring validation workspace…</div></AppShell>;
  if (!signedIn) return <AppShell title="Validate & Research" eyebrow="STARTUP OS · PHASE 1"><AuthDeferred /></AppShell>;
  if (!workspaces.length) return <AppShell title="Validate & Research" eyebrow="STARTUP OS · PHASE 1"><section className="phase0-onboarding-card"><Building2/><h2>Create your company workspace first.</h2><p>Phase 1 research attaches evidence to the shared company record.</p><Link to="/app/startup-os" className="button button-primary">Open Startup OS</Link></section></AppShell>;

  const latestIdea=data.ideas[0]; const latestHealth=data.health[0];
  return <AppShell title="Validate & Research" eyebrow="STARTUP OS · PHASE 1" action={<Link to="/app/integrations" className="button button-primary">Integrations</Link>}>
    <section className="phase1-toolbar">
      <div><span>ACTIVE COMPANY</span><select value={workspaceId} onChange={(e)=>changeWorkspace(e.target.value)}>{workspaces.map((w)=><option key={w.organization_id} value={w.organization_id}>{w.name}</option>)}</select></div>
      <div className="phase1-confidence"><ShieldCheck/><span><strong>Evidence-first scoring</strong><small>Observed · Estimated · Owner-entered · Verified</small></span></div>
    </section>
    <nav className="phase1-tabs" aria-label="Validation tools">{tabs.map((item)=><button key={item.key} className={tab===item.key?"active":""} onClick={()=>setTab(item.key)}>{item.label}</button>)}</nav>
    {notice?<p className="phase0-notice" role="status">{notice}</p>:null}
    {busy?<div className="phase1-busy"><RefreshCw className="spin"/> Working…</div>:null}

    {tab==="overview"?<>
      <section className="phase1-hero"><div><span>VALIDATE BEFORE YOU SCALE</span><h2>Turn assumptions into evidence.</h2><p>Phase 1 connects idea validation, market sizing, business discovery, competitor research and customer evidence to the same company workspace.</p></div><Sparkles/></section>
      <section className="phase0-kpis phase1-kpis"><article><Lightbulb/><div><span>Idea validation</span><strong>{latestIdea?.score ?? "—"}</strong><small>{latestIdea?.stage || "No assessment yet"}</small></div></article><article><Globe2/><div><span>Market models</span><strong>{data.markets.length}</strong><small>TAM / SAM / SOM</small></div></article><article><Search/><div><span>Companies researched</span><strong>{data.companies.length}</strong><small>public intelligence records</small></div></article><article><Gauge/><div><span>Startup health</span><strong>{latestHealth?.score ?? "—"}</strong><small>baseline self-assessment</small></div></article></section>
      <div className="phase1-tool-grid">{tabs.filter(x=>x.key!=="overview").map(item=><button key={item.key} onClick={()=>setTab(item.key)}><Compass/><strong>{item.label}</strong><span>Open tool →</span></button>)}</div>
    </>:null}

    {tab==="idea"?<section className="phase0-panel phase1-workbench"><header><div><Lightbulb/><span>BUSINESS IDEA VALIDATOR</span></div><small>Weighted evidence score; not a prediction of success.</small></header><form className="phase1-form" onSubmit={submitIdea}><label>Idea / venture name<input name="ideaName" required/></label><label>Target customer<input name="customer" required/></label><label className="wide">Problem statement<textarea name="problem" required rows={3}/></label><ScoreField name="urgency" label="Problem urgency"/><label>Customer evidence points<input name="evidenceCount" type="number" min="0" defaultValue="0"/></label><label>Paying / pre-commitment signals<input name="payingSignals" type="number" min="0" defaultValue="0"/></label><ScoreField name="competitorKnowledge" label="Competitive understanding"/><ScoreField name="differentiation" label="Differentiation strength"/><ScoreField name="monetisationClarity" label="Monetisation clarity"/><ScoreField name="executionReadiness" label="Execution readiness"/><button className="button button-primary wide">Score & save validation</button></form>{ideaPreview?<ScoreResult score={ideaPreview.score} label={ideaPreview.stage}/>:null}</section>:null}

    {tab==="market"?<section className="phase0-panel phase1-workbench"><header><div><Target/><span>MARKET SIZE CALCULATOR</span></div><small>Assumption-driven TAM / SAM / SOM model.</small></header><form className="phase1-form" onSubmit={submitMarket}><label>Model name<input name="name" required defaultValue={`${active?.name || "Company"} base market`}/></label><label>Currency<select name="currency" defaultValue="ZAR"><option>ZAR</option><option>USD</option><option>EUR</option><option>GBP</option></select></label><label>Total potential customers<input name="totalCustomers" type="number" min="0" required/></label><label>Annual spend per customer<input name="annualSpend" type="number" min="0" step="0.01" required/></label><label>Serviceable market %<input name="serviceablePercent" type="number" min="0" max="100" defaultValue="30"/></label><label>Obtainable share of SAM %<input name="obtainablePercent" type="number" min="0" max="100" defaultValue="5"/></label><button className="button button-primary wide">Calculate & save</button></form>{marketPreview?<div className="phase1-market-result"><Metric label="TAM" value={marketPreview.tam} currency={marketPreview.currency}/><Metric label="SAM" value={marketPreview.sam} currency={marketPreview.currency}/><Metric label="SOM" value={marketPreview.som} currency={marketPreview.currency}/></div>:null}</section>:null}

    {tab==="companies"?<section className="phase0-panel phase1-workbench"><header><div><Search/><span>COMPANY INTELLIGENCE</span></div><small>Find businesses, detect website presence and identify digital-growth opportunities.</small></header><div className="phase1-searchbar"><input value={companyQuery} onChange={(e)=>setCompanyQuery(e.target.value)} placeholder="e.g. plumbers, restaurants, law firms"/><input value={companyLocation} onChange={(e)=>setCompanyLocation(e.target.value)} placeholder="e.g. Pretoria"/><button onClick={()=>void searchCompanies()} disabled={busy}>Search companies</button></div><aside className="startup-integration-cost"><ShieldCheck/><div><strong>Google Places billing warning</strong><span>This search uses the user's connected Google Places account and may be billable. Start To Up asks for confirmation before every live Places search.</span></div></aside><div className="phase1-company-list">{(placesResults.length?placesResults:data.companies).map((record:any)=><article key={record.external_place_id||record.id||record.company_name}><div className="phase1-company-main"><div><strong>{record.company_name}</strong><span>{record.address||record.location||record.category||"Business record"}</span></div><b className={record.website_status==="not_detected"?"opportunity":"detected"}>{String(record.website_status||"unknown").replaceAll("_"," ")}</b></div><div className="phase1-company-metrics"><span>Rating <strong>{record.rating ?? "—"}</strong></span><span>Reviews <strong>{record.review_count ?? "—"}</strong></span><span>Demand proxy <strong>{record.demand_score ?? "—"}</strong></span><span>SEO <strong>{record.seo_score ?? "—"}</strong></span><span>Opportunity <strong>{record.opportunity_score ?? "—"}</strong></span></div><footer>{record.website?<button onClick={()=>void scanWebsite(record)}>Audit website</button>:<span>No website detected in source record — verify before outreach.</span>}{record.google_maps_url?<a href={record.google_maps_url} target="_blank" rel="noreferrer">Maps <ExternalLink/></a>:null}</footer></article>)}{!placesResults.length&&!data.companies.length?<div className="phase0-empty">No company intelligence records yet.</div>:null}</div></section>:null}

    {tab==="competitors"?<section className="phase0-panel phase1-workbench"><header><div><BarChart3/><span>COMPETITOR INTELLIGENCE</span></div><small>Record evidence explicitly; do not infer private ad performance.</small></header><form className="phase1-form" onSubmit={submitCompetitor}><label>Name<input name="name" required/></label><label>Website<input name="website" type="url"/></label><label>Location<input name="location"/></label><label>Observed public ads?<select name="observedAds"><option value="no">No / unknown</option><option value="yes">Yes, observed</option></select></label><label className="wide">Positioning<textarea name="positioning" rows={2}/></label><label>Pricing notes<textarea name="pricing" rows={2}/></label><label>Ad evidence URL<input name="adEvidence" type="url"/></label><label>Strengths<textarea name="strengths" rows={2}/></label><label>Weaknesses<textarea name="weaknesses" rows={2}/></label><button className="button button-primary wide">Save competitor</button></form><RecordList rows={data.competitors} primary="name" secondary="positioning"/></section>:null}

    {tab==="personas"?<section className="phase0-panel phase1-workbench"><header><div><UsersRound/><span>ICP / CUSTOMER PERSONA</span></div><small>Start with hypotheses; strengthen with interviews and surveys.</small></header><form className="phase1-form" onSubmit={submitPersona}><label>Name<input name="name" required placeholder="e.g. Pretoria SME owner"/></label><label>Segment<input name="segment"/></label><label className="wide">Jobs to be done<textarea name="jobs" rows={2}/></label><label>Pain points<textarea name="pains" rows={2}/></label><label>Desired outcomes<textarea name="outcomes" rows={2}/></label><label>Buying triggers<textarea name="triggers" rows={2}/></label><label>Objections<textarea name="objections" rows={2}/></label><label>Channels<textarea name="channels" rows={2}/></label><label className="wide">Evidence notes<textarea name="evidence" rows={2}/></label><button className="button button-primary wide">Save persona</button></form><RecordList rows={data.personas} primary="name" secondary="segment"/></section>:null}

    {tab==="interviews"?<section className="phase0-panel phase1-workbench"><header><div><MessagesSquare/><span>CUSTOMER INTERVIEW MANAGER</span></div><small>Capture problem evidence, current alternatives and willingness-to-pay signals.</small></header><form className="phase1-form" onSubmit={submitInterview}><label>Participant label<input name="participant" required placeholder="Anonymous label or customer code"/></label><label>Segment<input name="segment"/></label><label className="wide">Problem evidence<textarea name="problemEvidence" rows={2}/></label><label>Current alternative<textarea name="alternative" rows={2}/></label><ScoreField name="urgency" label="Urgency score"/><label>Willingness to pay<textarea name="willingness" rows={2}/></label><label>Quotes / direct language<textarea name="quotes" rows={2}/></label><label className="wide">Insights<textarea name="insights" rows={2}/></label><label className="wide">Next questions<textarea name="nextQuestions" rows={2}/></label><button className="button button-primary wide">Save interview</button></form><RecordList rows={data.interviews} primary="participant_label" secondary="insights"/></section>:null}

    {tab==="surveys"?<section className="phase0-panel phase1-workbench"><header><div><CheckCircle2/><span>VALIDATION SURVEYS</span></div><small>Create research surveys; response data stays private by default.</small></header><form className="phase1-form" onSubmit={submitSurvey}><label>Survey title<input name="title" required/></label><label className="wide">Purpose<textarea name="purpose" rows={2}/></label><button className="button button-primary wide">Create draft survey</button></form><RecordList rows={data.surveys} primary="title" secondary="status"/></section>:null}

    {tab==="brand"?<section className="phase0-panel phase1-workbench"><header><div><Globe2/><span>BRAND NAME CHECKER</span></div><small>Domain/network signals only — not a company-name or trademark clearance.</small></header><form className="phase1-form" onSubmit={submitBrand}><label>Proposed brand name<input name="name" required/></label><label>Domain to check<input name="domain" required placeholder="example.co.za"/></label><button className="button button-primary wide">Run signal check</button></form><aside className="phase0-privacy-note"><ShieldCheck/><div><strong>Legal availability is not automated.</strong><span>A domain with no DNS record can still be registered/reserved, and a clear domain does not mean a company name or trademark is available. Confirm with the registrar and relevant official registries.</span></div></aside><RecordList rows={data.brands} primary="proposed_name" secondary="domain_signal"/></section>:null}

    {tab==="health"?<section className="phase0-panel phase1-workbench"><header><div><Gauge/><span>STARTUP HEALTH BASELINE</span></div><small>Structured self-assessment that becomes more evidence-driven as later phases go live.</small></header><form className="phase1-form" onSubmit={submitHealth}><ScoreField name="validation" label="Validation"/><ScoreField name="product" label="Product readiness"/><ScoreField name="finance" label="Financial readiness"/><ScoreField name="sales" label="Sales traction"/><ScoreField name="digital" label="Digital presence"/><ScoreField name="compliance" label="Compliance readiness"/><ScoreField name="team" label="Team readiness"/><button className="button button-primary wide">Calculate & save baseline</button></form>{healthPreview?<ScoreResult score={healthPreview.score} label={`Priorities: ${healthPreview.next.map((x:any)=>x.key).join(", ")}`}/>:null}</section>:null}
  </AppShell>;
}

function ScoreField({name,label}:{name:string;label:string}) { return <label>{label} (0–100)<input name={name} type="number" min="0" max="100" defaultValue="50" required/></label>; }
function ScoreResult({score,label}:{score:number;label:string}) { return <div className="phase1-score-result"><strong>{score}/100</strong><span>{label}</span></div>; }
function Metric({label,value,currency}:{label:string;value:number;currency:string}) { return <article><span>{label}</span><strong>{new Intl.NumberFormat("en-ZA",{style:"currency",currency,maximumFractionDigits:0}).format(value||0)}</strong></article>; }
function RecordList({rows,primary,secondary}:{rows:any[];primary:string;secondary:string}) { return <div className="phase0-simple-list phase1-record-list">{rows.slice(0,10).map((row:any)=><article key={row.id}><CheckCircle2/><div><strong>{row[primary]||"Record"}</strong><small>{String(row[secondary]||"")}</small></div></article>)}{!rows.length?<div className="phase0-empty">No records yet.</div>:null}</div>; }
