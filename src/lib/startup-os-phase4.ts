import { supabase } from "../integrations/supabase/client";

const db = supabase as any;
export type RevenueTab = "dashboard"|"crm"|"pipeline"|"proposals"|"billing"|"forecast"|"lead-magnets"|"referrals"|"affiliates"|"reputation"|"support";
export type QuoteLineInput = { description:string; quantity:number; unitPrice:number; taxRate:number; discount:number };

export function calculateCommercialLines(lines: QuoteLineInput[]) {
  const normalized = lines.map((line) => {
    const quantity=Math.max(0,Number(line.quantity)||0), unitPrice=Math.max(0,Number(line.unitPrice)||0), taxRate=Math.max(0,Math.min(100,Number(line.taxRate)||0)), discount=Math.max(0,Number(line.discount)||0);
    const beforeDiscount=quantity*unitPrice;
    const taxable=Math.max(0,beforeDiscount-discount);
    const tax=taxable*taxRate/100;
    return {...line,quantity,unitPrice,taxRate,discount,subtotal:beforeDiscount,tax,lineTotal:taxable+tax};
  });
  const subtotal=normalized.reduce((sum,l)=>sum+l.subtotal,0);
  const discountTotal=normalized.reduce((sum,l)=>sum+l.discount,0);
  const taxTotal=normalized.reduce((sum,l)=>sum+l.tax,0);
  return {lines:normalized,subtotal,discountTotal,taxTotal,total:Math.max(0,subtotal-discountTotal+taxTotal)};
}

export function calculateWeightedForecast(opportunities:Array<{amount:number|string;probability:number|string;status?:string}>) {
  const open=opportunities.filter((row)=>!row.status||row.status==="open");
  const pipeline=open.reduce((sum,row)=>sum+Math.max(0,Number(row.amount)||0),0);
  const weighted=open.reduce((sum,row)=>sum+Math.max(0,Number(row.amount)||0)*Math.max(0,Math.min(100,Number(row.probability)||0))/100,0);
  return {pipeline,weighted};
}

export function calculateCommission(value:number, kind:"fixed"|"percent", rate:number) {
  const safeValue=Math.max(0,Number(value)||0), safeRate=Math.max(0,Number(rate)||0);
  return kind==="percent" ? safeValue*Math.min(100,safeRate)/100 : safeRate;
}

export async function loadRevenueWorkspace(organizationId:string) {
  const calls=await Promise.all([
    db.from("revenue_accounts").select("*").eq("organization_id",organizationId).order("updated_at",{ascending:false}).limit(100),
    db.from("revenue_contacts").select("*").eq("organization_id",organizationId).order("updated_at",{ascending:false}).limit(150),
    db.from("revenue_leads").select("*").eq("organization_id",organizationId).order("updated_at",{ascending:false}).limit(150),
    db.from("revenue_pipeline_stages").select("*").eq("organization_id",organizationId).order("position"),
    db.from("revenue_opportunities").select("*").eq("organization_id",organizationId).order("updated_at",{ascending:false}).limit(150),
    db.from("revenue_proposals").select("*").eq("organization_id",organizationId).order("updated_at",{ascending:false}).limit(80),
    db.from("revenue_quotes").select("*").eq("organization_id",organizationId).order("updated_at",{ascending:false}).limit(100),
    db.from("revenue_invoices").select("*").eq("organization_id",organizationId).order("updated_at",{ascending:false}).limit(100),
    db.from("revenue_payments").select("*").eq("organization_id",organizationId).order("created_at",{ascending:false}).limit(100),
    db.from("revenue_lead_magnets").select("*").eq("organization_id",organizationId).order("updated_at",{ascending:false}).limit(60),
    db.from("revenue_referral_programs").select("*").eq("organization_id",organizationId).order("updated_at",{ascending:false}).limit(60),
    db.from("revenue_referrals").select("*").eq("organization_id",organizationId).order("updated_at",{ascending:false}).limit(100),
    db.from("revenue_affiliate_programs").select("*").eq("organization_id",organizationId).order("updated_at",{ascending:false}).limit(60),
    db.from("revenue_affiliates").select("*").eq("organization_id",organizationId).order("updated_at",{ascending:false}).limit(100),
    db.from("revenue_reputation_records").select("*").eq("organization_id",organizationId).order("updated_at",{ascending:false}).limit(100),
    db.from("revenue_support_tickets").select("*").eq("organization_id",organizationId).order("updated_at",{ascending:false}).limit(100),
    db.rpc("revenue_forecast",{org_id:organizationId}),
    db.from("company_intelligence_saved_leads").select("intelligence_id,status,notes,company_intelligence_records(*)").eq("organization_id",organizationId).order("updated_at",{ascending:false}).limit(50),
    db.from("website_studio_form_submissions").select("*,website_studio_projects!inner(organization_id,business_name)").eq("website_studio_projects.organization_id",organizationId).order("created_at",{ascending:false}).limit(50),
  ]);
  for(const call of calls)if(call.error)throw call.error;
  const [accounts,contacts,leads,stages,opportunities,proposals,quotes,invoices,payments,leadMagnets,referralPrograms,referrals,affiliatePrograms,affiliates,reputation,tickets,forecast,intelligenceLeads,websiteSubmissions]=calls;
  return {accounts:accounts.data||[],contacts:contacts.data||[],leads:leads.data||[],stages:stages.data||[],opportunities:opportunities.data||[],proposals:proposals.data||[],quotes:quotes.data||[],invoices:invoices.data||[],payments:payments.data||[],leadMagnets:leadMagnets.data||[],referralPrograms:referralPrograms.data||[],referrals:referrals.data||[],affiliatePrograms:affiliatePrograms.data||[],affiliates:affiliates.data||[],reputation:reputation.data||[],tickets:tickets.data||[],forecast:forecast.data?.[0]||{open_pipeline:0,weighted_forecast:0,won_value:0,overdue_value:0},intelligenceLeads:intelligenceLeads.data||[],websiteSubmissions:websiteSubmissions.data||[]};
}

export async function ensureRevenuePipeline(organizationId:string){const {error}=await db.rpc("ensure_revenue_pipeline",{org_id:organizationId});if(error)throw error;}
export async function importCompanyIntelligenceLead(organizationId:string,intelligenceId:string){const {data,error}=await db.rpc("revenue_import_company_intelligence",{org_id:organizationId,intelligence_id:intelligenceId});if(error)throw error;return String(data);}
export async function importWebsiteLead(organizationId:string,submissionId:string){const {data,error}=await db.rpc("revenue_import_website_submission",{org_id:organizationId,submission_id:submissionId});if(error)throw error;return String(data);}
export async function convertLeadToOpportunity(leadId:string,amount=0,closeDate?:string){const {data,error}=await db.rpc("revenue_convert_lead_to_opportunity",{lead_uuid:leadId,opportunity_amount:amount,close_date:closeDate||null});if(error)throw error;return String(data);}
export async function quoteToInvoice(quoteId:string,dueDate?:string){const {data,error}=await db.rpc("revenue_quote_to_invoice",{quote_uuid:quoteId,invoice_due_date:dueDate||null});if(error)throw error;return String(data);}

export async function createAccount(organizationId:string,input:{name:string;email?:string;phone?:string;website?:string;industry?:string}){
  const user=(await supabase.auth.getUser()).data.user;if(!user)throw new Error("SIGN_IN_REQUIRED");
  const {data,error}=await db.from("revenue_accounts").insert({organization_id:organizationId,name:input.name.trim(),email:input.email||null,phone:input.phone||null,website:input.website||null,industry:input.industry||null,lifecycle:"prospect",source_type:"manual",owner_id:user.id,created_by:user.id}).select("*").single();if(error)throw error;return data;
}
export async function createContact(organizationId:string,input:{fullName:string;accountId?:string;email?:string;phone?:string;jobTitle?:string}){
  const user=(await supabase.auth.getUser()).data.user;if(!user)throw new Error("SIGN_IN_REQUIRED");
  const {data,error}=await db.from("revenue_contacts").insert({organization_id:organizationId,account_id:input.accountId||null,full_name:input.fullName.trim(),email:input.email||null,phone:input.phone||null,job_title:input.jobTitle||null,created_by:user.id}).select("*").single();if(error)throw error;return data;
}
export async function createLead(organizationId:string,input:{title:string;accountId?:string;contactId?:string;score?:number;value?:number;currency?:string;notes?:string}){
  const user=(await supabase.auth.getUser()).data.user;if(!user)throw new Error("SIGN_IN_REQUIRED");
  const {data,error}=await db.from("revenue_leads").insert({organization_id:organizationId,account_id:input.accountId||null,contact_id:input.contactId||null,title:input.title.trim(),lead_score:Math.max(0,Math.min(100,input.score||0)),estimated_value:Math.max(0,input.value||0),currency:input.currency||"ZAR",assigned_to:user.id,notes:input.notes||null,created_by:user.id}).select("*").single();if(error)throw error;return data;
}
export async function moveOpportunity(opportunityId:string,stage:any){
  const closed=Boolean(stage?.is_closed), outcome=stage?.closed_outcome;
  const payload:any={stage_id:stage?.id||null,probability:Number(stage?.probability||0),updated_at:new Date().toISOString()};
  if(closed&&outcome==="won"){payload.status="won";payload.won_at=new Date().toISOString();payload.lost_at=null;} else if(closed&&outcome==="lost"){payload.status="lost";payload.lost_at=new Date().toISOString();payload.won_at=null;} else {payload.status="open";payload.won_at=null;payload.lost_at=null;}
  const {data,error}=await db.from("revenue_opportunities").update(payload).eq("id",opportunityId).select("*").single();if(error)throw error;return data;
}

export async function createProposal(organizationId:string,input:{title:string;accountId?:string;contactId?:string;opportunityId?:string;summary?:string;total?:number;currency?:string}){
  const user=(await supabase.auth.getUser()).data.user;if(!user)throw new Error("SIGN_IN_REQUIRED");
  const {data,error}=await db.from("revenue_proposals").insert({organization_id:organizationId,title:input.title.trim(),account_id:input.accountId||null,contact_id:input.contactId||null,opportunity_id:input.opportunityId||null,summary:input.summary||null,total:Math.max(0,input.total||0),currency:input.currency||"ZAR",created_by:user.id}).select("*").single();if(error)throw error;return data;
}

export async function createQuote(organizationId:string,input:{accountId?:string;contactId?:string;opportunityId?:string;proposalId?:string;currency?:string;validUntil?:string;notes?:string;lines:QuoteLineInput[]}){
  const user=(await supabase.auth.getUser()).data.user;if(!user)throw new Error("SIGN_IN_REQUIRED"); const calc=calculateCommercialLines(input.lines);
  const quoteNumber=`Q-${new Date().toISOString().slice(0,10).replaceAll("-","")}-${Math.random().toString(36).slice(2,7).toUpperCase()}`;
  const result=await db.from("revenue_quotes").insert({organization_id:organizationId,opportunity_id:input.opportunityId||null,proposal_id:input.proposalId||null,account_id:input.accountId||null,contact_id:input.contactId||null,quote_number:quoteNumber,currency:input.currency||"ZAR",subtotal:calc.subtotal,tax_total:calc.taxTotal,discount_total:calc.discountTotal,total:calc.total,valid_until:input.validUntil||null,notes:input.notes||null,created_by:user.id}).select("*").single();if(result.error)throw result.error;
  if(calc.lines.length){const items=calc.lines.map((line,index)=>({organization_id:organizationId,quote_id:result.data.id,position:index,description:line.description,quantity:line.quantity,unit_price:line.unitPrice,tax_rate:line.taxRate,discount:line.discount,line_total:line.lineTotal}));const {error}=await db.from("revenue_quote_items").insert(items);if(error)throw error;}
  return result.data;
}

export async function recordPayment(organizationId:string,invoiceId:string,amount:number,method="manual"){
  const user=(await supabase.auth.getUser()).data.user;if(!user)throw new Error("SIGN_IN_REQUIRED");
  const {data,error}=await db.from("revenue_payments").insert({organization_id:organizationId,invoice_id:invoiceId,amount:Math.max(0,amount),payment_method:method,status:"confirmed",paid_at:new Date().toISOString(),recorded_by:user.id}).select("*").single();if(error)throw error;
  const invoice=(await db.from("revenue_invoices").select("total,amount_paid").eq("id",invoiceId).single()).data; const nextPaid=Math.min(Number(invoice?.total||0),Number(invoice?.amount_paid||0)+amount); const due=Math.max(0,Number(invoice?.total||0)-nextPaid);
  await db.from("revenue_invoices").update({amount_paid:nextPaid,amount_due:due,status:due<=0?"paid":"part_paid"}).eq("id",invoiceId);return data;
}

export async function createLeadMagnet(organizationId:string,input:{name:string;headline:string;description?:string;assetUrl?:string}){
  const user=(await supabase.auth.getUser()).data.user;if(!user)throw new Error("SIGN_IN_REQUIRED"); const slug=input.name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,70)||`lead-${Date.now()}`;
  const {data,error}=await db.from("revenue_lead_magnets").insert({organization_id:organizationId,name:input.name,slug,headline:input.headline,description:input.description||null,asset_url:input.assetUrl||null,created_by:user.id}).select("*").single();if(error)throw error;return data;
}
export async function createReferralProgram(organizationId:string,input:{name:string;rewardType:"fixed"|"percent"|"credit"|"custom";rewardValue:number;currency?:string}){const user=(await supabase.auth.getUser()).data.user;if(!user)throw new Error("SIGN_IN_REQUIRED");const {data,error}=await db.from("revenue_referral_programs").insert({organization_id:organizationId,name:input.name,reward_type:input.rewardType,reward_value:Math.max(0,input.rewardValue),currency:input.currency||"ZAR",created_by:user.id}).select("*").single();if(error)throw error;return data;}
export async function createAffiliateProgram(organizationId:string,input:{name:string;commissionType:"fixed"|"percent";commissionValue:number;currency?:string}){const user=(await supabase.auth.getUser()).data.user;if(!user)throw new Error("SIGN_IN_REQUIRED");const {data,error}=await db.from("revenue_affiliate_programs").insert({organization_id:organizationId,name:input.name,commission_type:input.commissionType,commission_value:Math.max(0,input.commissionValue),currency:input.currency||"ZAR",created_by:user.id}).select("*").single();if(error)throw error;return data;}
export async function addReputationRecord(organizationId:string,input:{provider:string;reviewer?:string;rating?:number;text?:string;evidenceUrl?:string}){const {data,error}=await db.from("revenue_reputation_records").insert({organization_id:organizationId,provider:input.provider,reviewer_label:input.reviewer||null,rating:input.rating??null,review_text:input.text||null,evidence_url:input.evidenceUrl||null,confidence:"observed"}).select("*").single();if(error)throw error;return data;}
export async function createSupportTicket(organizationId:string,input:{subject:string;accountId?:string;contactId?:string;priority?:string;channel?:string;message?:string}){const user=(await supabase.auth.getUser()).data.user;if(!user)throw new Error("SIGN_IN_REQUIRED");const ticketNumber=`T-${Date.now().toString(36).toUpperCase()}`;const {data,error}=await db.from("revenue_support_tickets").insert({organization_id:organizationId,account_id:input.accountId||null,contact_id:input.contactId||null,ticket_number:ticketNumber,subject:input.subject,priority:input.priority||"normal",channel:input.channel||"manual",created_by:user.id}).select("*").single();if(error)throw error;if(input.message)await db.from("revenue_support_messages").insert({organization_id:organizationId,ticket_id:data.id,sender_type:"team",sender_id:user.id,body:input.message});return data;}
export async function updateSupportTicket(ticketId:string,patch:{status?:string;priority?:string;assigned_to?:string|null}){const payload:any={...patch,updated_at:new Date().toISOString()};if(patch.status==="resolved")payload.resolved_at=new Date().toISOString();const {data,error}=await db.from("revenue_support_tickets").update(payload).eq("id",ticketId).select("*").single();if(error)throw error;return data;}
