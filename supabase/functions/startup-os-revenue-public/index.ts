import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization,x-client-info,apikey,content-type","Access-Control-Allow-Methods":"POST,OPTIONS"};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json"}});
const emailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
async function sha(value:string){const bytes=new TextEncoder().encode(value);const digest=await crypto.subtle.digest("SHA-256",bytes);return Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,"0")).join("");}

Deno.serve(async(req)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
  if(req.method!=="POST")return json({error:"METHOD_NOT_ALLOWED"},405);
  const url=Deno.env.get("SUPABASE_URL"),serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if(!url||!serviceKey)return json({error:"SERVICE_NOT_CONFIGURED"},503);
  const db=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
  let body:any;try{body=await req.json();}catch{return json({error:"INVALID_REQUEST"},400);}
  if(body?.action!=="lead_magnet_submit")return json({error:"UNKNOWN_ACTION"},400);
  if(String(body?.website||"").trim())return json({ok:true}); // honeypot: do not reveal rejection
  const token=String(body?.token||"").trim(),email=String(body?.email||"").trim().toLowerCase(),fullName=String(body?.fullName||"").trim(),phone=String(body?.phone||"").trim(),sourceUrl=String(body?.sourceUrl||"").slice(0,1000);
  if(!token||!emailPattern.test(email))return json({error:"VALID_EMAIL_REQUIRED"},400);
  const {data:magnet,error:magnetError}=await db.from("revenue_lead_magnets").select("id,organization_id,name,status,thank_you_message").eq("public_token",token).eq("status","active").maybeSingle();
  if(magnetError||!magnet)return json({error:"LEAD_MAGNET_UNAVAILABLE"},404);
  const forwarded=req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||req.headers.get("cf-connecting-ip")||"unknown";
  const salt=Deno.env.get("REVENUE_CAPTURE_HASH_SALT")||serviceKey.slice(0,24);
  const [ipHash,emailHash]=await Promise.all([sha(`${salt}:${forwarded}`),sha(`${salt}:${email}`)]);
  const since=new Date(Date.now()-10*60*1000).toISOString();
  const {count}=await db.from("revenue_public_capture_events").select("id",{count:"exact",head:true}).eq("lead_magnet_id",magnet.id).eq("ip_hash",ipHash).gte("created_at",since);
  if((count||0)>=5)return json({error:"TOO_MANY_REQUESTS"},429);
  const dayAgo=new Date(Date.now()-24*60*60*1000).toISOString();
  const {count:duplicateCount}=await db.from("revenue_public_capture_events").select("id",{count:"exact",head:true}).eq("lead_magnet_id",magnet.id).eq("email_hash",emailHash).gte("created_at",dayAgo);
  if((duplicateCount||0)>0)return json({ok:true,message:magnet.thank_you_message||"Thank you."});

  let contactId:string|undefined;
  const existing=await db.from("revenue_contacts").select("id").eq("organization_id",magnet.organization_id).ilike("email",email).limit(1).maybeSingle();
  if(existing.data?.id)contactId=existing.data.id;
  else{
    const created=await db.from("revenue_contacts").insert({organization_id:magnet.organization_id,full_name:fullName||email.split("@")[0],email,phone:phone||null,source_type:"lead_magnet",consent_status:"consented",metadata:{leadMagnetId:magnet.id}}).select("id").single();
    if(created.error)return json({error:"CAPTURE_FAILED"},500); contactId=created.data.id;
  }
  const captureId=crypto.randomUUID();
  const lead=await db.from("revenue_leads").insert({organization_id:magnet.organization_id,contact_id:contactId,title:`${magnet.name} lead`,status:"new",source_type:"lead_magnet",source_ref_id:captureId,lead_score:30,estimated_value:0,currency:"ZAR",metadata:{leadMagnetId:magnet.id,sourceUrl}}).select("id").single();
  if(lead.error)return json({error:"CAPTURE_FAILED"},500);
  await db.from("revenue_public_capture_events").insert({id:captureId,organization_id:magnet.organization_id,lead_magnet_id:magnet.id,lead_id:lead.data.id,contact_id:contactId,email_hash:emailHash,ip_hash:ipHash,source_url:sourceUrl,metadata:{userAgent:req.headers.get("user-agent")?.slice(0,300)||""}});
  await db.from("revenue_lead_magnets").update({submissions_count:(await db.from("revenue_public_capture_events").select("id",{count:"exact",head:true}).eq("lead_magnet_id",magnet.id)).count||1}).eq("id",magnet.id);
  return json({ok:true,message:magnet.thank_you_message||"Thank you. Check your inbox for the next step."});
});
