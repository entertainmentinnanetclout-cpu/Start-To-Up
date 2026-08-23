import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.112.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const allowedActions = new Set([
  "collaboration_interest",
  "session_registration",
  "content_report",
]);
const emailPattern = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const body = await request.json();
    const { captchaToken, actionType, targetId, contactEmail, message, category } = body;
    if (!captchaToken) return json({ error: "Complete the security check." }, 400);
    if (!allowedActions.has(actionType)) return json({ error: "Invalid action type." }, 400);
    if (!uuidPattern.test(targetId)) return json({ error: "Invalid target reference." }, 400);
    if (!emailPattern.test(contactEmail))
      return json({ error: "Enter a valid email address." }, 400);
    if (typeof message !== "string" || message.length < 10 || message.length > 3000)
      return json({ error: "Submission details must be between 10 and 3000 characters." }, 400);

    const secret = Deno.env.get("TURNSTILE_SECRET_KEY");
    if (!secret) return json({ error: "CAPTCHA is not configured on the server." }, 503);
    const verification = new FormData();
    verification.append("secret", secret);
    verification.append("response", captchaToken);
    verification.append("remoteip", request.headers.get("x-forwarded-for")?.split(",")[0] ?? "");
    const turnstileResponse = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body: verification },
    );
    const outcome = await turnstileResponse.json();
    if (!outcome.success)
      return json({ error: "Security verification failed. Please retry." }, 403);

    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const url = Deno.env.get("SUPABASE_URL");
    if (!serviceKey || !url) return json({ error: "Server integration is unavailable." }, 503);
    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
    const { error } = await admin.from("guest_action_submissions").insert({
      action_type: actionType,
      target_id: targetId,
      contact_email: contactEmail,
      message,
      category: category || null,
    });
    if (error) throw error;
    return json({ success: true }, 201);
  } catch (error) {
    console.error("guest-action-submit", error);
    return json({ error: "The submission could not be processed." }, 500);
  }
});
