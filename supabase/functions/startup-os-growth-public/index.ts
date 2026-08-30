import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization,x-client-info,apikey,content-type","Access-Control-Allow-Methods":"POST,OPTIONS"};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json"}});
async function sha(value:string){const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));return Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,"0")).join("");}
Deno.serve(async req=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:cors}); if(req.method!=="POST")return json({error:"METHOD_NOT_ALLOWED"},405);
  const url=Deno.env.get("SUPABASE_URL"),key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"); if(!url||!key)return json({error:"SERVICE_NOT_CONFIGURED"},503); const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  let body:any;try{body=await req.json();}catch{return json({error:"INVALID_REQUEST"},400)}
  const token=String(body?.token||"").trim(),eventType=String(body?.eventType||"").trim(),sourceUrl=String(body?.sourceUrl||"").slice(0,1000),session=String(body?.session||"").slice(0,200),utmLinkId=String(body?.utmLinkId||"").trim();
  if(!token||!["page_view","cta_click"].includes(eventType))return json({error:"INVALID_EVENT"},400);
  const {data:campaign}=await db.from("growth_campaigns").select("id,organization_id,status").eq("public_token",token).maybeSingle(); if(!campaign||!["active","completed"].includes(campaign.status))return json({error:"CAMPAIGN_UNAVAILABLE"},404);
  if(utmLinkId){const {data:utm}=await db.from("growth_utm_links").select("id,campaign_id").eq("id",utmLinkId).maybeSingle();if(!utm||utm.campaign_id!==campaign.id)return json({error:"INVALID_UTM"},400);}
  const forwarded=req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||req.headers.get("cf-connecting-ip")||"unknown",salt=Deno.env.get("GROWTH_EVENT_HASH_SALT")||key.slice(0,24); const [ipHash,sessionHash]=await Promise.all([sha(`${salt}:ip:${forwarded}`),sha(`${salt}:session:${session||forwarded}`)]);
  const since=new Date(Date.now()-60_000).toISOString(); const {count}=await db.from("growth_public_events").select("id",{count:"exact",head:true}).eq("campaign_id",campaign.id).eq("ip_hash",ipHash).gte("created_at",since); if((count||0)>30)return json({ok:true});
  const metadata=body?.metadata&&typeof body.metadata==="object"?body.metadata:{};
  await db.from("growth_public_events").insert({organization_id:campaign.organization_id,campaign_id:campaign.id,utm_link_id:utmLinkId||null,event_type:eventType,session_hash:sessionHash,ip_hash:ipHash,source_url:sourceUrl,metadata});
  await db.from("growth_touchpoints").insert({organization_id:campaign.organization_id,campaign_id:campaign.id,utm_link_id:utmLinkId||null,event_type:eventType,session_key:sessionHash,source:String(metadata?.utm_source||""),medium:String(metadata?.utm_medium||""),conversion_value:0,evidence_confidence:"observed",metadata:{sourceUrl}});
  if(utmLinkId&&eventType==="cta_click"){const {data:u}=await db.from("growth_utm_links").select("clicks").eq("id",utmLinkId).single();await db.from("growth_utm_links").update({clicks:Number(u?.clicks||0)+1}).eq("id",utmLinkId);}
  return json({ok:true});
});