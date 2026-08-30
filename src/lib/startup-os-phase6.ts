import { supabase } from "../integrations/supabase/client";
const db=supabase as any;
export function calculateOkrProgress(start:number,current:number,target:number){if(target===start)return 100;return Math.max(0,Math.min(100,((current-start)/(target-start))*100));}
export function calculateRisk(probability:number,impact:number){const p=Math.max(1,Math.min(5,Math.round(probability||1))),i=Math.max(1,Math.min(5,Math.round(impact||1))),score=p*i;return{probability:p,impact:i,score,severity:score>=20?"critical":score>=15?"high":score>=8?"medium":"low"};}
export function calculateHiringBudget(roles:Array<{monthlyBudget:number;months?:number}>){return roles.reduce((s,r)=>s+Math.max(0,r.monthlyBudget||0)*Math.max(1,r.months||12),0);}
export function commandCentreActions(snapshot:any){const a:string[]=[];if(Number(snapshot?.overdueValue||0)>0)a.push("Follow up overdue invoices");if(Number(snapshot?.highRisks||0)>0)a.push("Mitigate high-priority risks");if(Number(snapshot?.upcomingDeadlines||0)>0)a.push("Review deadlines due in the next 30 days");if(Number(snapshot?.openPipeline||0)>0)a.push("Progress open sales opportunities");if(Number(snapshot?.activeCampaigns||0)===0)a.push("Create or activate a growth campaign");if(Number(snapshot?.okrProgress||0)<60)a.push("Update OKRs and unblock lagging key results");return a.slice(0,6);}
async function actor(){return (await supabase.auth.getUser()).data.user?.id||null;}
export async function loadOperationsWorkspace(org:string){const calls=await Promise.all([
  db.rpc("startup_command_centre",{org_id:org}),
  db.from("ops_okrs").select("*").eq("organization_id",org).order("updated_at",{ascending:false}).limit(40),
  db.from("ops_key_results").select("*").eq("organization_id",org).order("updated_at",{ascending:false}).limit(120),
  db.from("ops_decisions").select("*").eq("organization_id",org).order("decided_at",{ascending:false}).limit(50),
  db.from("ops_risks").select("*").eq("organization_id",org).order("risk_score",{ascending:false}).limit(80),
  db.from("ops_hiring_plans").select("*").eq("organization_id",org).order("updated_at",{ascending:false}).limit(50),
  db.from("ops_job_roles").select("*").eq("organization_id",org).order("updated_at",{ascending:false}).limit(50),
  db.from("ops_candidates").select("*").eq("organization_id",org).order("updated_at",{ascending:false}).limit(100),
  db.from("ops_vendors").select("*").eq("organization_id",org).order("updated_at",{ascending:false}).limit(80),
  db.from("ops_meetings").select("*").eq("organization_id",org).order("meeting_at",{ascending:false}).limit(60),
  db.from("ops_meeting_actions").select("*").eq("organization_id",org).order("due_at",{ascending:true}).limit(100),
  db.from("ops_deadlines").select("*").eq("organization_id",org).order("due_date",{ascending:true}).limit(100),
]);for(const c of calls)if(c.error)throw c.error;const [command,okrs,keyResults,decisions,risks,hiringPlans,jobRoles,candidates,vendors,meetings,meetingActions,deadlines]=calls;return{command:command.data||{},okrs:okrs.data||[],keyResults:keyResults.data||[],decisions:decisions.data||[],risks:risks.data||[],hiringPlans:hiringPlans.data||[],jobRoles:jobRoles.data||[],candidates:candidates.data||[],vendors:vendors.data||[],meetings:meetings.data||[],meetingActions:meetingActions.data||[],deadlines:deadlines.data||[]};}
async function insert(table:string,org:string,values:Record<string,unknown>){const {data,error}=await db.from(table).insert({organization_id:org,...values,created_by:await actor()}).select("*").single();if(error)throw error;return data;}
export const createOkr=(org:string,v:Record<string,unknown>)=>insert("ops_okrs",org,v);
export async function addKeyResult(org:string,v:Record<string,unknown>){const {data,error}=await db.from("ops_key_results").insert({organization_id:org,...v}).select("*").single();if(error)throw error;return data;}
export const logDecision=(org:string,v:Record<string,unknown>)=>insert("ops_decisions",org,{...v,decided_by:null});
export const addRisk=(org:string,v:Record<string,unknown>)=>insert("ops_risks",org,v);
export const addHiringPlan=(org:string,v:Record<string,unknown>)=>insert("ops_hiring_plans",org,v);
export const addJobRole=(org:string,v:Record<string,unknown>)=>insert("ops_job_roles",org,v);
export const addCandidate=(org:string,v:Record<string,unknown>)=>insert("ops_candidates",org,v);
export const addVendor=(org:string,v:Record<string,unknown>)=>insert("ops_vendors",org,v);
export const addMeeting=(org:string,v:Record<string,unknown>)=>insert("ops_meetings",org,v);
export async function addMeetingAction(org:string,v:Record<string,unknown>){const {data,error}=await db.from("ops_meeting_actions").insert({organization_id:org,...v}).select("*").single();if(error)throw error;return data;}
export const addDeadline=(org:string,v:Record<string,unknown>)=>insert("ops_deadlines",org,v);
export async function meetingActionToTask(id:string){const {data,error}=await db.rpc("ops_meeting_action_to_task",{action_uuid:id});if(error)throw error;return data as string;}
