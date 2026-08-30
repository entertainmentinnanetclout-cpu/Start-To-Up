import { supabase } from "../integrations/supabase/client";
const db=supabase as any;

export type BudgetAllocation={channel:string;percent:number};
export function calculateMarketingBudget(total:number,allocations:BudgetAllocation[]){
  const safe=Math.max(0,Number(total)||0); const rows=allocations.map(a=>({channel:a.channel,percent:Math.max(0,Number(a.percent)||0),amount:safe*Math.max(0,Number(a.percent)||0)/100}));
  const allocatedPercent=rows.reduce((s,r)=>s+r.percent,0); return {total:safe,allocatedPercent,unallocatedPercent:100-allocatedPercent,rows};
}
export function buildUtmUrl(input:{url:string;source:string;medium:string;campaign:string;term?:string;content?:string}){
  const url=new URL(input.url); url.searchParams.set("utm_source",input.source.trim()); url.searchParams.set("utm_medium",input.medium.trim()); url.searchParams.set("utm_campaign",input.campaign.trim()); if(input.term?.trim())url.searchParams.set("utm_term",input.term.trim()); if(input.content?.trim())url.searchParams.set("utm_content",input.content.trim()); return url.toString();
}
export function calculateRetention(starting:number,newCustomers:number,ending:number){
  const start=Math.max(0,Number(starting)||0),added=Math.max(0,Number(newCustomers)||0),end=Math.max(0,Number(ending)||0); const retained=Math.max(0,Math.min(start,end-added)); const churned=Math.max(0,start-retained); return {retained,churned,retentionRate:start?retained/start*100:0,churnRate:start?churned/start*100:0};
}
export function calculateCampaignEfficiency(spend:number,revenue:number,leads:number,conversions:number){const s=Math.max(0,Number(spend)||0),r=Math.max(0,Number(revenue)||0),l=Math.max(0,Number(leads)||0),c=Math.max(0,Number(conversions)||0);return{roas:s?r/s:null,cpl:l?s/l:null,cpa:c?s/c:null,revenue:r,spend:s};}

export async function loadGrowthWorkspace(organizationId:string){
  const calls=await Promise.all([
    db.from("growth_campaigns").select("*").eq("organization_id",organizationId).order("updated_at",{ascending:false}).limit(50),
    db.from("growth_content_items").select("*").eq("organization_id",organizationId).order("publish_at",{ascending:true}).limit(100),
    db.from("growth_utm_links").select("*").eq("organization_id",organizationId).order("created_at",{ascending:false}).limit(100),
    db.from("growth_seo_targets").select("*").eq("organization_id",organizationId).order("priority",{ascending:false}).limit(100),
    db.from("growth_seo_audits").select("*").eq("organization_id",organizationId).order("created_at",{ascending:false}).limit(30),
    db.from("growth_experiments").select("*").eq("organization_id",organizationId).order("updated_at",{ascending:false}).limit(50),
    db.from("growth_kpis").select("*").eq("organization_id",organizationId).order("updated_at",{ascending:false}).limit(50),
    db.from("growth_kpi_measurements").select("*").eq("organization_id",organizationId).order("measured_at",{ascending:false}).limit(100),
    db.from("growth_retention_measurements").select("*").eq("organization_id",organizationId).order("period_end",{ascending:false}).limit(24),
    db.from("growth_paid_media_snapshots").select("*").eq("organization_id",organizationId).order("created_at",{ascending:false}).limit(50),
    db.rpc("growth_attribution_summary",{org_id:organizationId}),
  ]);
  for(const c of calls)if(c.error)throw c.error;
  const [campaigns,content,utms,seoTargets,seoAudits,experiments,kpis,kpiMeasurements,retention,paidMedia,attribution]=calls;
  return {campaigns:campaigns.data||[],content:content.data||[],utms:utms.data||[],seoTargets:seoTargets.data||[],seoAudits:seoAudits.data||[],experiments:experiments.data||[],kpis:kpis.data||[],kpiMeasurements:kpiMeasurements.data||[],retention:retention.data||[],paidMedia:paidMedia.data||[],attribution:attribution.data||[]};
}
async function actor(){return (await supabase.auth.getUser()).data.user?.id||null;}
export async function createCampaign(org:string,values:Record<string,unknown>){const {data,error}=await db.from("growth_campaigns").insert({organization_id:org,...values,created_by:await actor()}).select("*").single();if(error)throw error;return data;}
export async function addContentItem(org:string,values:Record<string,unknown>){const {data,error}=await db.from("growth_content_items").insert({organization_id:org,...values,created_by:await actor()}).select("*").single();if(error)throw error;return data;}
export async function createUtmLink(org:string,values:{campaign_id?:string|null;name:string;destination_url:string;source:string;medium:string;campaign:string;term?:string;content?:string}){const final_url=buildUtmUrl({url:values.destination_url,source:values.source,medium:values.medium,campaign:values.campaign,term:values.term,content:values.content});const {data,error}=await db.from("growth_utm_links").insert({organization_id:org,...values,final_url,created_by:await actor()}).select("*").single();if(error)throw error;return data;}
export async function addSeoTarget(org:string,values:Record<string,unknown>){const {data,error}=await db.from("growth_seo_targets").insert({organization_id:org,...values}).select("*").single();if(error)throw error;return data;}
export async function addExperiment(org:string,values:Record<string,unknown>){const {data,error}=await db.from("growth_experiments").insert({organization_id:org,...values}).select("*").single();if(error)throw error;return data;}
export async function addKpi(org:string,values:Record<string,unknown>){const {data,error}=await db.from("growth_kpis").insert({organization_id:org,...values,created_by:await actor()}).select("*").single();if(error)throw error;return data;}
export async function recordKpi(org:string,kpiId:string,value:number,source="manual",confidence="owner_entered"){const {data,error}=await db.from("growth_kpi_measurements").insert({organization_id:org,kpi_id:kpiId,value,source,evidence_confidence:confidence}).select("*").single();if(error)throw error;return data;}
export async function recordRetention(org:string,values:{period_start:string;period_end:string;starting_customers:number;new_customers:number;ending_customers:number}){const calc=calculateRetention(values.starting_customers,values.new_customers,values.ending_customers);const {data,error}=await db.from("growth_retention_measurements").upsert({organization_id:org,...values,retained_customers:calc.retained,churned_customers:calc.churned,retention_rate:calc.retentionRate,churn_rate:calc.churnRate},{onConflict:"organization_id,period_start,period_end"}).select("*").single();if(error)throw error;return data;}
export async function addPaidMediaSnapshot(org:string,values:Record<string,unknown>){const {data,error}=await db.from("growth_paid_media_snapshots").insert({organization_id:org,...values}).select("*").single();if(error)throw error;return data;}
export async function attributeRevenue(org:string,campaignId:string,leadId?:string,opportunityId?:string,invoiceId?:string,amount=0){const {data,error}=await db.rpc("growth_attribute_revenue",{org_id:org,campaign_uuid:campaignId,lead_uuid:leadId||null,opportunity_uuid:opportunityId||null,invoice_uuid:invoiceId||null,conversion_amount:amount});if(error)throw error;return data as string;}
