import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization,x-client-info,apikey,content-type","Access-Control-Allow-Methods":"POST,OPTIONS"};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json","Cache-Control":"no-store"}});
async function sha(value:string){const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));return Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,"0")).join("");}
function expired(value:string|null|undefined){return Boolean(value&&new Date(value).getTime()<=Date.now());}
Deno.serve(async req=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:cors});if(req.method!=="POST")return json({error:"METHOD_NOT_ALLOWED"},405);
  const url=Deno.env.get("SUPABASE_URL"),key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");if(!url||!key)return json({error:"SERVICE_NOT_CONFIGURED"},503);
  const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});let body:any;try{body=await req.json();}catch{return json({error:"INVALID_REQUEST"},400)}
  const action=String(body?.action||""),token=String(body?.token||"").trim();if(!token)return json({error:"TOKEN_REQUIRED"},400);
  const forwarded=req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||req.headers.get("cf-connecting-ip")||"unknown",ua=(req.headers.get("user-agent")||"").slice(0,500),salt=Deno.env.get("LEGAL_ACCESS_HASH_SALT")||key.slice(0,24),ipHash=await sha(`${salt}:ip:${forwarded}`);

  if(action==="share"){
    const {data:share}=await db.from("legal_due_diligence_shares").select("id,organization_id,name,allowed_document_ids,expires_at,max_views,view_count,revoked_at").eq("public_token",token).maybeSingle();
    if(!share)return json({error:"SHARE_NOT_FOUND"},404);const denied=share.revoked_at?"revoked":expired(share.expires_at)?"expired":share.max_views&&share.view_count>=share.max_views?"denied":null;
    if(denied){await db.from("legal_share_access_log").insert({organization_id:share.organization_id,share_id:share.id,event_type:denied,ip_hash:ipHash,user_agent:ua});return json({error:"SHARE_UNAVAILABLE"},410);}
    const ids=(share.allowed_document_ids||[]) as string[];const {data:docs}=ids.length?await db.from("legal_documents").select("id,title,document_type,storage_path,file_name,mime_type,public_safe_label,verification_status").eq("organization_id",share.organization_id).in("id",ids):{data:[] as any[]};
    const files=[] as any[];for(const d of docs||[]){const {data:signed}=await db.storage.from("legal-documents").createSignedUrl(d.storage_path,300,{download:false});files.push({id:d.id,title:d.title,type:d.document_type,fileName:d.file_name,label:d.public_safe_label,verificationStatus:d.verification_status,url:signed?.signedUrl||null});}
    await db.from("legal_due_diligence_shares").update({view_count:Number(share.view_count||0)+1}).eq("id",share.id);await db.from("legal_share_access_log").insert({organization_id:share.organization_id,share_id:share.id,event_type:"opened",ip_hash:ipHash,user_agent:ua,metadata:{documents:files.length}});
    return json({name:share.name,expiresAt:share.expires_at,documents:files});
  }

  const {data:recipient}=await db.from("legal_signature_recipients").select("id,organization_id,request_id,full_name,email,status,signature_type,signed_at").eq("signer_token",token).maybeSingle();if(!recipient)return json({error:"SIGNER_NOT_FOUND"},404);
  const {data:request}=await db.from("legal_signature_requests").select("id,contract_id,title,status,expires_at,message").eq("id",recipient.request_id).maybeSingle();if(!request)return json({error:"REQUEST_NOT_FOUND"},404);
  if(expired(request.expires_at)||request.status==="expired"){await db.from("legal_signature_recipients").update({status:"expired"}).eq("id",recipient.id);return json({error:"REQUEST_EXPIRED"},410);}
  const {data:contract}=await db.from("legal_contracts").select("id,title,body,contract_type,version,governing_law").eq("id",request.contract_id).maybeSingle();if(!contract)return json({error:"CONTRACT_NOT_FOUND"},404);
  if(action==="sign_get"){
    if(recipient.status==="sent")await db.from("legal_signature_recipients").update({status:"viewed"}).eq("id",recipient.id);
    await db.from("legal_signature_events").insert({organization_id:recipient.organization_id,request_id:request.id,recipient_id:recipient.id,event_type:"viewed",actor_type:"signer",ip_hash:ipHash,user_agent:ua});
    return json({request:{title:request.title,message:request.message,expiresAt:request.expires_at,status:request.status},recipient:{name:recipient.full_name,email:recipient.email,status:recipient.status,signedAt:recipient.signed_at},contract});
  }
  if(action==="sign_submit"){
    if(recipient.status==="signed")return json({ok:true,alreadySigned:true,signedAt:recipient.signed_at});if(body?.consent!==true)return json({error:"CONSENT_REQUIRED"},400);
    const signatureType=String(body?.signatureType||"typed"),signatureValue=String(body?.signatureValue||"").trim();if(!["typed","drawn","uploaded"].includes(signatureType)||signatureValue.length<2||signatureValue.length>250000)return json({error:"INVALID_SIGNATURE"},400);
    const signatureHash=await sha(`${contract.id}:${contract.version}:${recipient.id}:${signatureValue}`),now=new Date().toISOString();
    const {error:updateError}=await db.from("legal_signature_recipients").update({status:"signed",consent_text:"I consent to use this electronic signature for this document.",signature_type:signatureType,signature_value_private:signatureValue,signature_hash:signatureHash,signed_at:now,signed_ip_hash:ipHash,signed_user_agent:ua}).eq("id",recipient.id);if(updateError)return json({error:"SIGNATURE_SAVE_FAILED"},500);
    await db.from("legal_signature_events").insert([{organization_id:recipient.organization_id,request_id:request.id,recipient_id:recipient.id,event_type:"consented",actor_type:"signer",ip_hash:ipHash,user_agent:ua},{organization_id:recipient.organization_id,request_id:request.id,recipient_id:recipient.id,event_type:"signed",actor_type:"signer",ip_hash:ipHash,user_agent:ua,metadata:{signatureHash}}]);
    const {count:pending}=await db.from("legal_signature_recipients").select("id",{count:"exact",head:true}).eq("request_id",request.id).neq("status","signed");const complete=(pending||0)===0;
    await db.from("legal_signature_requests").update({status:complete?"completed":"part_signed",completed_at:complete?now:null,updated_at:now}).eq("id",request.id);await db.from("legal_contracts").update({status:complete?"signed":"part_signed",updated_at:now}).eq("id",contract.id);
    return json({ok:true,signedAt:now,signatureHash,complete});
  }
  return json({error:"UNKNOWN_ACTION"},400);
});
