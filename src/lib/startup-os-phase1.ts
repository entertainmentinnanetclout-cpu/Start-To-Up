import { supabase } from "../integrations/supabase/client";

const db = supabase as any;

export type EvidenceConfidence = "owner_entered" | "observed" | "estimated" | "verified";
export type ValidationDimension = {
  key: "problem" | "customer" | "demand" | "competition" | "differentiation" | "monetisation" | "execution";
  label: string;
  score: number;
  evidence: string;
};

export type IdeaValidationInput = {
  ideaName: string;
  problem: string;
  customer: string;
  urgency: number;
  evidenceCount: number;
  payingSignals: number;
  competitorKnowledge: number;
  differentiation: number;
  monetisationClarity: number;
  executionReadiness: number;
};

export function scoreIdeaValidation(input: IdeaValidationInput) {
  const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
  const evidenceScore = clamp((input.evidenceCount / 20) * 100);
  const payingScore = clamp((input.payingSignals / 10) * 100);
  const dimensions: ValidationDimension[] = [
    { key: "problem", label: "Problem urgency", score: clamp(input.urgency), evidence: input.problem },
    { key: "customer", label: "Customer evidence", score: clamp(evidenceScore), evidence: `${input.evidenceCount} customer evidence points recorded` },
    { key: "demand", label: "Willingness to pay", score: clamp(payingScore), evidence: `${input.payingSignals} paying/pre-commitment signals recorded` },
    { key: "competition", label: "Competitive understanding", score: clamp(input.competitorKnowledge), evidence: "Founder-entered competitive understanding" },
    { key: "differentiation", label: "Differentiation", score: clamp(input.differentiation), evidence: "Founder-entered differentiation strength" },
    { key: "monetisation", label: "Monetisation clarity", score: clamp(input.monetisationClarity), evidence: "Founder-entered revenue-model clarity" },
    { key: "execution", label: "Execution readiness", score: clamp(input.executionReadiness), evidence: "Founder-entered execution readiness" },
  ];
  const weights: Record<ValidationDimension["key"], number> = {
    problem: 0.18,
    customer: 0.18,
    demand: 0.18,
    competition: 0.10,
    differentiation: 0.14,
    monetisation: 0.12,
    execution: 0.10,
  };
  const score = clamp(dimensions.reduce((sum, item) => sum + item.score * weights[item.key], 0));
  const stage = score >= 80 ? "strong evidence" : score >= 65 ? "promising" : score >= 45 ? "needs validation" : "high uncertainty";
  return { score, stage, dimensions };
}

export type MarketSizeInput = {
  totalCustomers: number;
  annualSpendPerCustomer: number;
  serviceablePercent: number;
  obtainablePercent: number;
  currency: string;
};

export function calculateMarketSize(input: MarketSizeInput) {
  const pct = (n: number) => Math.max(0, Math.min(100, Number(n) || 0)) / 100;
  const tam = Math.max(0, input.totalCustomers || 0) * Math.max(0, input.annualSpendPerCustomer || 0);
  const sam = tam * pct(input.serviceablePercent);
  const som = sam * pct(input.obtainablePercent);
  return { tam, sam, som, currency: input.currency || "ZAR" };
}

export type StartupHealthInput = {
  validation: number;
  product: number;
  finance: number;
  sales: number;
  digital: number;
  compliance: number;
  team: number;
};

export function calculateStartupHealth(input: StartupHealthInput) {
  const clamp = (n: number) => Math.max(0, Math.min(100, Number(n) || 0));
  const weights: Record<keyof StartupHealthInput, number> = {
    validation: 0.18,
    product: 0.15,
    finance: 0.16,
    sales: 0.16,
    digital: 0.10,
    compliance: 0.12,
    team: 0.13,
  };
  const score = Math.round((Object.keys(weights) as Array<keyof StartupHealthInput>).reduce((sum, key) => sum + clamp(input[key]) * weights[key], 0));
  const next = (Object.keys(weights) as Array<keyof StartupHealthInput>)
    .map((key) => ({ key, score: clamp(input[key]) }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);
  return { score, next };
}

export async function saveIdeaValidation(organizationId: string, input: IdeaValidationInput) {
  const result = scoreIdeaValidation(input);
  const { data, error } = await db.from("startup_idea_validations").insert({
    organization_id: organizationId,
    idea_name: input.ideaName,
    problem_statement: input.problem,
    target_customer: input.customer,
    input,
    score: result.score,
    stage: result.stage,
    dimensions: result.dimensions,
  }).select("*").single();
  if (error) throw error;
  return data;
}

export async function saveMarketModel(organizationId: string, name: string, input: MarketSizeInput) {
  const model = calculateMarketSize(input);
  const { data, error } = await db.from("startup_market_models").insert({
    organization_id: organizationId,
    name,
    assumptions: input,
    tam: model.tam,
    sam: model.sam,
    som: model.som,
    currency: model.currency,
  }).select("*").single();
  if (error) throw error;
  return data;
}

export async function saveCompetitor(organizationId: string, values: Record<string, unknown>) {
  const { data, error } = await db.from("startup_competitors").insert({ organization_id: organizationId, ...values }).select("*").single();
  if (error) throw error;
  return data;
}

export async function savePersona(organizationId: string, values: Record<string, unknown>) {
  const { data, error } = await db.from("startup_customer_personas").insert({ organization_id: organizationId, ...values }).select("*").single();
  if (error) throw error;
  return data;
}

export async function saveInterview(organizationId: string, values: Record<string, unknown>) {
  const { data, error } = await db.from("startup_customer_interviews").insert({ organization_id: organizationId, ...values }).select("*").single();
  if (error) throw error;
  return data;
}

export async function createSurvey(organizationId: string, values: Record<string, unknown>) {
  const { data, error } = await db.from("startup_validation_surveys").insert({ organization_id: organizationId, ...values }).select("*").single();
  if (error) throw error;
  return data;
}

export async function saveBrandCheck(organizationId: string, values: Record<string, unknown>) {
  const { data, error } = await db.from("startup_brand_checks").insert({ organization_id: organizationId, ...values }).select("*").single();
  if (error) throw error;
  return data;
}

export async function saveStartupHealth(organizationId: string, input: StartupHealthInput) {
  const assessment = calculateStartupHealth(input);
  const { data, error } = await db.from("startup_health_assessments").insert({
    organization_id: organizationId,
    inputs: input,
    score: assessment.score,
    next_actions: assessment.next,
  }).select("*").single();
  if (error) throw error;
  return data;
}

export async function loadValidationWorkspace(organizationId: string) {
  const calls = await Promise.all([
    db.from("startup_idea_validations").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(12),
    db.from("startup_market_models").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(12),
    db.from("startup_competitors").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(30),
    db.from("startup_customer_personas").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(20),
    db.from("startup_customer_interviews").select("*").eq("organization_id", organizationId).order("interviewed_at", { ascending: false }).limit(30),
    db.from("startup_validation_surveys").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(20),
    db.from("startup_brand_checks").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(20),
    db.from("startup_health_assessments").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(12),
    db.from("company_intelligence_records").select("*").eq("organization_id", organizationId).order("updated_at", { ascending: false }).limit(50),
  ]);
  const [ideas, markets, competitors, personas, interviews, surveys, brands, health, companies] = calls;
  for (const call of calls) if (call.error) throw call.error;
  return {
    ideas: ideas.data || [],
    markets: markets.data || [],
    competitors: competitors.data || [],
    personas: personas.data || [],
    interviews: interviews.data || [],
    surveys: surveys.data || [],
    brands: brands.data || [],
    health: health.data || [],
    companies: companies.data || [],
  };
}

export async function runCompanyIntelligence(organizationId: string, action: "places_search" | "website_scan" | "brand_domain_check", payload: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("startup-os-company-intelligence", {
    body: { organizationId, action, ...payload },
  });
  if (error) throw error;
  return data as any;
}
