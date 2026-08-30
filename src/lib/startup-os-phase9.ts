import { supabase } from "../integrations/supabase/client";
const db=supabase as any;

export type MatchProfile={industry?:string|null;stage?:string|null;geography?:string|null;capabilities?:string[];needs?:string[];verification_score?:number};
export function calculateNetworkMatch(source:MatchProfile,target:MatchProfile){
  const reasons:string[]=[];let score=0;
  if(source.industry&&target.industry&&source.industry===target.industry){score+=25;reasons.push("Same industry");}
  if(source.geography&&target.geography&&source.geography===target.geography){score+=15;reasons.push("Same geography");}
  if(source.stage&&target.stage&&source.stage===target.stage){score+=10;reasons.push("Compatible stage");}
  const needs=new Set(source.needs||[]),caps=target.capabilities||[];const overlap=caps.filter(x=>needs.has(x));score+=Math.min(30,overlap.length*10);if(overlap.length)reasons.push(`Capability fit: ${overlap.join(", ")}`);
  score+=Math.min(20,Math.max(0,Number(target.verification_score)||0)/5);if((target.verification_score||0)>=60)reasons.push("Strong verification evidence");
  return{score:Math.round(Math.min(100,score)),reasons};
}
export function opportunityPath(type:string){return type==="funding"?"/app/funding":type==="tender"?"/app/compliance":"/app/opportunities";}
async function actor(){return (await supabase.auth.getUser()).data.user?.id||null;}
export async function loadEcosystemWorkspace(org:string){
  const calls=await Promise.all([
    db.from("ecosystem_profiles").select("*").eq("organization_id",org).maybeSingle(),
    db.from("ecosystem_opportunities").select("*").or(`organization_id.eq.${org},visibility.in.(network,public)`).order("created_at",{ascending:false}).limit(100),
    db.from("ecosystem_saved_opportunities").select("*").eq("organization_id",org).order("created_at",{ascending:false}).limit(100),
    db.from("ecosystem_opportunity_applications").select("*").eq("organization_id",org).order("updated_at",{ascending:false}).limit(100),
    db.from("ecosystem_matches").select("*").eq("organization_id",org).order("match_score",{ascending:false}).limit(100),
    db.from("ecosystem_partnerships").select("*").eq("organization_id",org).order("updated_at",{ascending:false}).limit(100),
    db.from("ecosystem_programs").select("*").order("updated_at",{ascending:false}).limit(100),
    db.from("ecosystem_supplier_profiles").select("*").eq("organization_id",org).maybeSingle(),
    db.from("ecosystem_pilot_requests").select("*").eq("organization_id",org).order("updated_at",{ascending:false}).limit(100),
    db.from("ecosystem_handoffs").select("*").eq("organization_id",org).order("created_at",{ascending:false}).limit(100),
  ]);
  for(const c of calls)if(c.error)throw c.error;
  return{profile:calls[0].data,opportunities:calls[1].data||[],saved:calls[2].data||[],applications:calls[3].data||[],matches:calls[4].data||[],partnerships:calls[5].data||[],programs:calls[6].data||[],supplier:calls[7].data,pilots:calls[8].data||[],handoffs:calls[9].data||[]};
}
export async function saveProfile(org:string,values:Record<string,unknown>){const {data,error}=await db.from("ecosystem_profiles").upsert({organization_id:org,...values,created_by:await actor()},{onConflict:"organization_id"}).select("*").single();if(error)throw error;return data;}
export async function createOpportunity(org:string,values:Record<string,unknown>){const {data,error}=await db.from("ecosystem_opportunities").insert({organization_id:org,...values,created_by:await actor()}).select("*").single();if(error)throw error;return data;}
export async function saveOpportunity(org:string,id:string){const {data,error}=await db.from("ecosystem_saved_opportunities").upsert({organization_id:org,opportunity_id:id,saved_by:await actor()},{onConflict:"organization_id,opportunity_id"}).select("*").single();if(error)throw error;return data;}
export async function applyToOpportunity(org:string,id:string,pitch:string){const {data,error}=await db.from("ecosystem_opportunity_applications").upsert({organization_id:org,opportunity_id:id,pitch,status:"submitted",submitted_at:new Date().toISOString(),created_by:await actor()},{onConflict:"organization_id,opportunity_id"}).select("*").single();if(error)throw error;return data;}
export async function createProgram(org:string,values:Record<string,unknown>){const {data,error}=await db.from("ecosystem_programs").insert({organization_id:org,...values}).select("*").single();if(error)throw error;return data;}
export async function createPilot(org:string,values:Record<string,unknown>){const {data,error}=await db.from("ecosystem_pilot_requests").insert({organization_id:org,...values,created_by:await actor()}).select("*").single();if(error)throw error;return data;}
export async function createPartnership(org:string,values:Record<string,unknown>){const {data,error}=await db.from("ecosystem_partnerships").insert({organization_id:org,...values,created_by:await actor()}).select("*").single();if(error)throw error;return data;}
export async function createHandoff(org:string,opportunityId:string,target:"crm"|"collaboration"|"project"|"task"|"website_studio"){const {data,error}=await db.rpc("ecosystem_create_handoff",{org_id:org,opportunity_uuid:opportunityId,target_kind:target});if(error)throw error;return data as string;}
