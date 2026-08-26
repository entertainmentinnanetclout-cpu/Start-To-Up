import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.112.3";
import { getWebsiteStudioProviderCredential } from "../_shared/website-studio-provider-credential.ts";

const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const providers=new Set(["github","vercel","supabase","lovable","stripe","resend","google_business","shopify","wordpress","crm_webhook"]);
function json(body:unknown,status=200){return new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json"}})}
function text(value:unknown,max=2000){return String(value??"").trim().slice(0,max)}
function bytesToBase64(bytes:Uint8Array){let value="";for(const byte of bytes)value+=String.fromCharCode(byte);return btoa(value)}
async function cryptoKey(serviceRole:string,projectId:string,provider:string){const material=new TextEncoder().encode(`${serviceRole}|website-studio-provider-v1|${projectId}|${provider}`);const digest=await crypto.subtle.digest("SHA-256",material);return crypto.subtle.importKey("raw",digest,{name:"AES-GCM"},false,["encrypt"])}
async function encrypt(secret:string,serviceRole:string,projectId:string,provider:string){const iv=crypto.getRandomValues(new Uint8Array(12));const key=await cryptoKey(serviceRole,projectId,provider);const cipher=await crypto.subtle.encrypt({name:"AES-GCM",iv},key,new TextEncoder().encode(secret));return{ciphertext:bytesToBase64(new Uint8Array(cipher)),iv:bytesToBase64(iv)}}
function cleanConfig(input:unknown){const source=input&&typeof input==="object"?input as Record<string,unknown>:{};const output:Record<string,unknown>={};for(const[key,value]of Object.entries(source)){if(["token","secret","password","clientSecret","privateKey","apiKey"].includes(key))continue;output[key]=typeof value==="string"?text(value,1200):value}return output}
function safeUrl(value:unknown){try{const url=new URL(String(value||""));return ["http:","https:"].includes(url.protocol)?url.toString():""}catch{return""}}
async function requestOk(url:string,init:RequestInit={}){const response=await fetch(url,init);if(!response.ok){const body=await response.text().catch(()=>"");throw new Error(`Provider returned ${response.status}${body?`: ${body.slice(0,180)}`:""}`)}return response}
async function testProvider(provider:string,secret:string,config:Record<string,unknown>){
  if(provider==="github"){await requestOk("https://api.github.com/user",{headers:{Authorization:`Bearer ${secret}`,Accept:"application/vnd.github+json","User-Agent":"Start-To-Up-Website-Studio"}});return{ok:true,status:"connected"}}
  if(provider==="vercel"){await requestOk("https://api.vercel.com/v2/user",{headers:{Authorization:`Bearer ${secret}`}});return{ok:true,status:"connected"}}
  if(provider==="stripe"){await requestOk("https://api.stripe.com/v1/account",{headers:{Authorization:`Bearer ${secret}`}});return{ok:true,status:"connected"}}
  if(provider==="resend"){await requestOk("https://api.resend.com/domains",{headers:{Authorization:`Bearer ${secret}`}});return{ok:true,status:"connected"}}
  if(provider==="shopify"){const host=text(config.storeDomain,300).replace(/^https?:\/\//,"").replace(/\/$/,"");if(!host)throw new Error("Store domain required");await requestOk(`https://${host}/admin/api/2025-07/shop.json`,{headers:{"X-Shopify-Access-Token":secret,"Content-Type":"application/json"}});return{ok:true,status:"connected"}}
  if(provider==="wordpress"){const site=safeUrl(config.siteUrl),username=text(config.username,200);if(!site||!username)throw new Error("WordPress site URL and username required");await requestOk(`${site.replace(/\/$/,"")}/wp-json/wp/v2/users/me?context=edit`,{headers:{Authorization:`Basic ${btoa(`${username}:${secret}`)}`}});return{ok:true,status:"connected"}}
  if(provider==="crm_webhook"){const url=safeUrl(config.webhookUrl);if(!url)throw new Error("HTTPS webhook URL required");const headers:Record<string,string>={"Content-Type":"application/json"};if(secret)headers.Authorization=`Bearer ${secret}`;await requestOk(url,{method:"POST",headers,body:JSON.stringify({type:"website_studio_connection_test",sentAt:new Date().toISOString()})});return{ok:true,status:"connected"}}
  if(provider==="supabase"){const url=safeUrl(config.url),key=text(config.publishableKey,1000);if(!url||!key)throw new Error("Project URL and publishable key required");await requestOk(`${url.replace(/\/$/,"")}/rest/v1/`,{headers:{apikey:key}});return{ok:true,status:"connected"}}
  if(provider==="lovable"){const editor=safeUrl(config.editorUrl||config.previewUrl);if(!editor)throw new Error("Lovable editor or preview URL required");return{ok:true,status:"connected"}}
  if(provider==="google_business"){if(!text(config.clientId,1000)||!secret)throw new Error("OAuth Client ID and Client Secret required");return{ok:true,status:"ready_for_oauth",message:"Credentials saved. Complete Google account authorization to access Business Profile data."}}
  throw new Error("Unsupported provider");
}

Deno.serve(async(req:Request)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:cors});if(req.method!=="POST")return json({error:"Method not allowed"},405);
  const supabaseUrl=Deno.env.get("SUPABASE_URL"),serviceRole=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");if(!supabaseUrl||!serviceRole)return json({error:"Service unavailable"},503);
  const accessToken=(req.headers.get("Authorization")||"").replace(/^Bearer\s+/i,"").trim();if(!accessToken)return json({error:"Authentication required"},401);
  const admin=createClient(supabaseUrl,serviceRole,{auth:{persistSession:false,autoRefreshToken:false}});const{data:userData,error:userError}=await admin.auth.getUser(accessToken);if(userError||!userData.user)return json({error:"Authentication required"},401);
  let body:any;try{body=await req.json()}catch{return json({error:"Invalid request"},400)}
  const projectId=text(body?.projectId,80),provider=text(body?.provider,60),action=text(body?.action,30)||"status";if(!projectId||!providers.has(provider))return json({error:"Project and supported provider required"},400);
  const{data:project}=await admin.from("website_studio_projects").select("id,owner_id").eq("id",projectId).maybeSingle();if(!project)return json({error:"Project not found"},404);
  const{data:roles}=await admin.from("user_roles").select("role").eq("user_id",userData.user.id);const isAdmin=(roles||[]).some((row:any)=>["admin","super_admin"].includes(String(row.role)));
  if(project.owner_id!==userData.user.id&&!isAdmin)return json({error:"Only the project owner can manage provider credentials."},403);
  const config=cleanConfig(body?.config);

  if(action==="status"){
    const{data:credential}=await admin.from("website_studio_provider_credentials").select("provider,credential_hint,updated_at").eq("project_id",projectId).eq("provider",provider).maybeSingle();
    const{data:integration}=await admin.from("website_studio_integrations").select("status,config,external_url,updated_at,last_error").eq("project_id",projectId).eq("provider",provider).maybeSingle();
    return json({provider,hasCredential:Boolean(credential),credentialHint:credential?.credential_hint||null,status:integration?.status||"disconnected",config:integration?.config||{},externalUrl:integration?.external_url||null,updatedAt:integration?.updated_at||credential?.updated_at||null,lastError:integration?.last_error||null});
  }
  if(action==="remove"){
    await admin.from("website_studio_provider_credentials").delete().eq("project_id",projectId).eq("provider",provider);
    await admin.from("website_studio_integrations").upsert({project_id:projectId,provider,status:"disconnected",config,created_by:userData.user.id,updated_at:new Date().toISOString(),last_error:null},{onConflict:"project_id,provider"});
    return json({ok:true,status:"disconnected"});
  }
  if(action==="save"){
    const secret=text(body?.secret,12000);if(["github","vercel","stripe","resend","google_business","shopify","wordpress"].includes(provider)&&!secret)return json({error:"Credential required"},400);
    if(secret){const encrypted=await encrypt(secret,serviceRole,projectId,provider);const hint=secret.length>8?`${secret.slice(0,3)}••••${secret.slice(-4)}`:"••••••••";const{error}=await admin.from("website_studio_provider_credentials").upsert({project_id:projectId,provider,ciphertext:encrypted.ciphertext,iv:encrypted.iv,credential_hint:hint,metadata:{credential_version:1},created_by:userData.user.id,updated_at:new Date().toISOString()},{onConflict:"project_id,provider"});if(error)return json({error:"Credential could not be stored"},500)}
    await admin.from("website_studio_integrations").upsert({project_id:projectId,provider,status:"configured",config,created_by:userData.user.id,updated_at:new Date().toISOString(),last_error:null},{onConflict:"project_id,provider"});
    return json({ok:true,status:"configured"});
  }
  if(action==="test"){
    const supplied=text(body?.secret,12000);const secret=supplied||await getWebsiteStudioProviderCredential(admin,serviceRole,projectId,provider);
    try{const result=await testProvider(provider,secret,config);await admin.from("website_studio_integrations").upsert({project_id:projectId,provider,status:result.status||"connected",config,created_by:userData.user.id,updated_at:new Date().toISOString(),last_error:null},{onConflict:"project_id,provider"});return json(result)}catch(error){const message=error instanceof Error?error.message:"Connection test failed";await admin.from("website_studio_integrations").upsert({project_id:projectId,provider,status:"error",config,created_by:userData.user.id,updated_at:new Date().toISOString(),last_error:message.slice(0,500)},{onConflict:"project_id,provider"});return json({ok:false,status:"error",message:"Connection test failed. Check the setup steps and credential, then try again."},400)}
  }
  return json({error:"Unsupported action"},400);
});
