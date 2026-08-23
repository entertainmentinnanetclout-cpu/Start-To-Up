import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.112.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-client-info, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function text(value: unknown, max: number) {
  return String(value || "").trim().slice(0, max);
}

async function hash(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRole) return json({ error: "Service unavailable" }, 503);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: "Invalid request" }, 400); }

  const projectToken = text(body.projectToken, 64);
  const fullName = text(body.fullName, 160);
  const email = text(body.email, 254);
  const phone = text(body.phone, 80);
  const message = text(body.message, 5000);
  const sourceUrl = text(body.sourceUrl, 1000);
  const honeypot = text(body.website, 200);
  if (honeypot) return json({ ok: true });
  if (!projectToken || !message || (!email && !phone)) return json({ error: "Please provide contact details and a message." }, 400);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "Invalid email address." }, 400);

  const admin = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: project, error: projectError } = await admin.from("website_studio_projects").select("id,status").eq("public_submit_token", projectToken).maybeSingle();
  if (projectError || !project) return json({ error: "Website form is not available." }, 404);

  const rawIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const ipHash = await hash(`${project.id}:${rawIp}`);
  const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
  const { count } = await admin.from("website_studio_form_submissions").select("id", { count: "exact", head: true }).eq("project_id", project.id).gte("created_at", oneMinuteAgo).contains("metadata", { ip_hash: ipHash });
  if ((count || 0) >= 6) return json({ error: "Too many requests. Please try again shortly." }, 429);

  const { error } = await admin.from("website_studio_form_submissions").insert({
    project_id: project.id,
    full_name: fullName || null,
    email: email || null,
    phone: phone || null,
    message,
    source_url: sourceUrl || null,
    metadata: { ip_hash: ipHash, user_agent: text(req.headers.get("user-agent"), 300) },
  });
  if (error) return json({ error: "Unable to submit the form." }, 500);
  return json({ ok: true });
});
