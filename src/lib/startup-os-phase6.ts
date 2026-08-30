import { supabase } from "../integrations/supabase/client";
const db=supabase as any;

export function calculateRiskScore(likelihood:number,impact:number){return Math.max(1,Math.min(5,Number(likelihood)||1))*Math.max(1,Math.min(5,Number(impact)||1));}
export function riskLevel(score:number){return score>=20?"critical":score>=15?"high":score>=8?"medium":"low";}
export function calculateKeyResultProgress(start:number,current:number,target:number){const s=Number(start)||0,c=Number(current)||0,t=Number(target)||0;if(t===s)return c>=t?100:0;return Math.max(0,Math.min(100,((c-s)/(t-s))*100));}
export function calculateOkrProgress(rows:Array<{start_value:number;current_value:number;target_value:number}>){if(!rows.length)return 0;return rows.reduce((sum,row)=>sum+calculateKeyResultProgress(row.start_value,row.current_value,row.target_value),0)/rows.length;}
export function calculateHiringMonthlyCost(min:number,max:number){const a=Math.max(0,Number(min)||0),b=Math.max(a,Number(max)||a);return {minimum:a,maximum:b,midpoint:(a+b)/2,annualMidpoint:(a+b)/2*12};}
export function daysUntil(date:string){const target=new Date(`${date}T00:00:00`),now=new Date();const today=new Date(now.getFullYear(),now.getMonth(),now.getDate());return Math.ceil((target.getTime()-today.getTime())/86400000);}

export async function loadOperatingWorkspace(organizationId:string){
  const calls=await Promise.all([
    db.from("ops_okrs").select("*").eq("organization_id",organizationId).order("updated_at",{ascending:false}).limit(50),
    db.from("ops_key_results").select("*").eq("organization_id",organizationId).order("updated_at",{ascending:false}).limit(100),
    db.from("ops_decisions").select("*").eq("organization_id",organizationId).order("decided_at",{ascending:false}).limit(60),
    db.from("ops_risks").select("*").eq("organization_id",organizationId).order("risk_score",{ascending:false}).limit(80),
    db.from("ops_hiring_plans").select("*").eq("organization_id",organizationId).order("priority",{ascending:false}).limit(50),
    db.from("ops_job_descriptions").select("*").eq("organization_id",organizationId).order("updated_at",{ascending:false}).limit(50),
    db.from("ops_candidates").select("*").eq("organization_id",organizationId).order("updated_at",{ascending:false}).limit(100),
    db.from("ops_candidate_events").select("*").eq("organization_id",organizationId).order("created_at",{ascending:false}).limit(100),
    db.from("ops_vendors").select("*").eq("organization_id",organizationId).order("updated_at",{ascending:false}).limit(80),
    db.from("ops_vendor_engagements").select("*").eq("organization_id",organizationId).order("updated_at",{ascending:false}).limit(80),
    db.from("ops_meetings").select("*").eq("organization_id",organizationId).order("starts_at",{ascending:false}).limit(80),
    db.from("ops_meeting_actions").select("*").eq("organization_id",organizationId).order("updated_at",{ascending:false}).limit(100),
    db.from("ops_renewals").select("*").eq("organization_id",organizationId).order("due_date",{ascending:true}).limit(100),
    db.rpc("ops_command_centre",{org_id:organizationId}),
  ]);
  for(const call of calls)if(call.error)throw call.error;
  const [okrs,keyResults,decisions,risks,hiring,jobs,candidates,candidateEvents,vendors,engagements,meetings,meetingActions,renewals,command]=calls;
  return {okrs:okrs.data||[],keyResults:keyResults.data||[],decisions:decisions.data||[],risks:risks.data||[],hiring:hiring.data||[],jobs:jobs.data||[],candidates:candidates.data||[],candidateEvents:candidateEvents.data||[],vendors:vendors.data||[],engagements:engagements.data||[],meetings:meetings.data||[],meetingActions:meetingActions.data||[],renewals:renewals.data||[],command:command.data||{}};
}
async function actor(){return (await supabase.auth.getUser()).data.user?.id||null;}
async function insert(table:string,organizationId:string,values:Record<string,unknown>){const {data,error}=await db.from(table).insert({organization_id:organizationId,...values,created_by:await actor()}).select("*").single();if(error)throw error;return data;}

export async function createOkr(org:string,values:Record<string,unknown>){return insert("ops_okrs",org,values);}
export async function addKeyResult(org:string,values:Record<string,unknown>){const row=await insert("ops_key_results",org,values);await db.rpc("ops_refresh_okrs",{org_id:org});return row;}
export async function refreshOkrs(org:string){const {error}=await db.rpc("ops_refresh_okrs",{org_id:org});if(error)throw error;}
export async function recordDecision(org:string,values:Record<string,unknown>){const {data,error}=await db.from("ops_decisions").insert({organization_id:org,...values,decided_by:await actor()}).select("*").single();if(error)throw error;return data;}
export async function addRisk(org:string,values:Record<string,unknown>){return insert("ops_risks",org,values);}
export async function createHiringPlan(org:string,values:Record<string,unknown>){return insert("ops_hiring_plans",org,values);}
export async function createJobDescription(org:string,values:Record<string,unknown>){return insert("ops_job_descriptions",org,values);}
export async function addCandidate(org:string,values:Record<string,unknown>){return insert("ops_candidates",org,values);}
export async function addCandidateEvent(org:string,values:Record<string,unknown>){const {data,error}=await db.from("ops_candidate_events").insert({organization_id:org,...values,actor_id:await actor()}).select("*").single();if(error)throw error;return data;}
export async function addVendor(org:string,values:Record<string,unknown>){return insert("ops_vendors",org,values);}
export async function addVendorEngagement(org:string,values:Record<string,unknown>){const {data,error}=await db.from("ops_vendor_engagements").insert({organization_id:org,...values,owner_id:await actor()}).select("*").single();if(error)throw error;return data;}
export async function createMeeting(org:string,values:Record<string,unknown>){return insert("ops_meetings",org,values);}
export async function addMeetingAction(org:string,values:Record<string,unknown>){const {data,error}=await db.from("ops_meeting_actions").insert({organization_id:org,...values}).select("*").single();if(error)throw error;return data;}
export async function addRenewal(org:string,values:Record<string,unknown>){return insert("ops_renewals",org,values);}
export async function saveCommandSnapshot(org:string,command:Record<string,unknown>,nextActions:string[]=[]){const user=await actor();const payload={organization_id:org,snapshot_date:new Date().toISOString().slice(0,10),company_health:Number(command.company_health||0),revenue_health:Number(command.revenue_health||0),growth_health:Number(command.growth_health||0),execution_health:Number(command.execution_health||0),people_health:Number(command.people_health||0),risk_health:Number(command.risk_health||0),next_actions:nextActions,inputs:command,created_by:user};const {data,error}=await db.from("ops_command_snapshots").upsert(payload,{onConflict:"organization_id,snapshot_date"}).select("*").single();if(error)throw error;return data;}

export function commandNextActions(command:Record<string,any>){const actions:string[]=[];if(Number(command.overdue_tasks||0)>0)actions.push(`Resolve ${command.overdue_tasks} overdue company task${Number(command.overdue_tasks)===1?"":"s"}.`);if(Number(command.high_risks||0)>0)actions.push(`Mitigate ${command.high_risks} high-priority risk${Number(command.high_risks)===1?"":"s"}.`);if(Number(command.active_okrs||0)===0)actions.push("Create at least one active OKR for the current operating period.");if(Number(command.weighted_pipeline||0)===0)actions.push("Build or qualify revenue pipeline in Revenue OS.");if(Number(command.active_campaigns||0)===0)actions.push("Create an active measurable growth campaign.");if(Number(command.upcoming_renewals||0)>0)actions.push(`Review ${command.upcoming_renewals} renewal/deadline item${Number(command.upcoming_renewals)===1?"":"s"} due within 30 days.`);return actions.slice(0,5);}
