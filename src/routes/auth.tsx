import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Eye, KeyRound, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { supabase } from "../integrations/supabase/client";

export const Route = createFileRoute("/auth")({ component: AuthPage });
type AuthMode = "signin" | "signup" | "reset" | "update-password";

function safeReturnTo() {
  if (typeof window === "undefined") return "/app/home";
  const requested = new URLSearchParams(window.location.search).get("returnTo") || window.localStorage.getItem("start-to-up-auth-return") || "/app/home";
  return requested.startsWith("/") && !requested.startsWith("//") ? requested : "/app/home";
}
function friendlyAuthError(code?: string) {
  if (!code) return "We could not complete that request. Check your details and try again.";
  const value = code.toLowerCase();
  if (value.includes("invalid login") || value.includes("invalid_credentials")) return "The email or password is incorrect.";
  if (value.includes("email not confirmed")) return "Verify your email address before signing in.";
  if (value.includes("already registered") || value.includes("user_already_exists")) return "An account already exists for this email. Sign in instead.";
  if (value.includes("rate") || value.includes("too many")) return "Too many attempts were made. Wait a moment, then try again.";
  if (value.includes("password")) return "Use a password with at least 8 characters.";
  return "We could not complete that request. Try again or use email sign-in.";
}

function AuthPage() {
  const returnTo = useMemo(() => safeReturnTo(), []);
  const initialMode = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("mode") === "update-password" ? "update-password" : "signin";
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);
  const [emailValue, setEmailValue] = useState("");

  useEffect(() => {
    window.localStorage.setItem("start-to-up-auth-return", returnTo);
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session && mode !== "update-password") window.location.replace(returnTo);
    });
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setMode("update-password");
      if (event === "SIGNED_IN" && mode !== "update-password") window.setTimeout(() => window.location.replace(returnTo), 50);
    });
    return () => data.subscription.unsubscribe();
  }, [returnTo, mode]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setStatus("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || emailValue).trim();
    const password = String(form.get("password") || "");
    if (mode === "reset") {
      const result = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth?mode=update-password&returnTo=${encodeURIComponent(returnTo)}` });
      setPending(false); setStatus(result.error ? friendlyAuthError(result.error.message) : "Password reset instructions were sent to your email."); return;
    }
    if (mode === "update-password") {
      const result = await supabase.auth.updateUser({ password });
      setPending(false);
      if (result.error) setStatus(friendlyAuthError(result.error.message)); else { setStatus("Password updated. Returning to your saved work…"); window.setTimeout(() => window.location.replace(returnTo), 400); }
      return;
    }
    const result = mode === "signin"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { data: { display_name: String(form.get("name") ?? "") }, emailRedirectTo: `${window.location.origin}/auth?returnTo=${encodeURIComponent(returnTo)}` } });
    setPending(false);
    if (result.error) setStatus(friendlyAuthError(result.error.message));
    else if (mode === "signin") { setStatus("Signed in. Restoring your workspace…"); window.setTimeout(() => window.location.replace(returnTo), 100); }
    else setStatus(result.data.session ? "Account created. Restoring your workspace…" : "Check your email to verify the account. Your Website Studio draft is saved on this device.");
  }

  async function sendMagicLink() {
    if (!emailValue.trim()) return setStatus("Enter your email address first.");
    setPending(true); setStatus("");
    const { error } = await supabase.auth.signInWithOtp({ email: emailValue.trim(), options: { emailRedirectTo: `${window.location.origin}/auth?returnTo=${encodeURIComponent(returnTo)}` } });
    setPending(false); setStatus(error ? friendlyAuthError(error.message) : "A secure sign-in link was sent to your email.");
  }

  const title = mode === "signin" ? "Continue building." : mode === "signup" ? "Create your Innovation Passport." : mode === "reset" ? "Reset your password." : "Choose a new password.";
  return <div className="auth-page">
    <section className="auth-brand-panel">
      <Link to="/"><img src="/brand/start-to-up-logo-white.png" alt="Start To Up" /></Link>
      <div><span className="section-label">FROM IDEAS TO IMPACT</span><h1>The serious network for people building what comes next.</h1><p>Your project draft, template choice and editor state stay available while you authenticate.</p></div>
      <ul><li><ShieldCheck /> Persistent secure sessions</li><li><LockKeyhole /> Private projects by default</li><li><Eye /> Return directly to your saved workspace</li></ul>
    </section>
    <main className="auth-form-panel">
      <div className="auth-mobile-logo"><img src="/brand/start-to-up-logo-primary.png" alt="Start To Up" /></div>
      <div className="auth-form-wrap">
        <span className="content-kicker">{mode === "signin" ? "WELCOME BACK" : mode === "signup" ? "JOIN THE NETWORK" : "ACCOUNT ACCESS"}</span>
        <h2>{title}</h2>
        <p>{returnTo.includes("website-studio") ? "After sign-in you will return to Website Studio with the current draft intact." : "Your session is refreshed automatically across Start To Up."}</p>
        {mode === "signin" || mode === "signup" ? <div className="auth-switch"><button className={mode === "signin" ? "active" : ""} onClick={() => setMode("signin")}>Sign in</button><button className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>Create account</button></div> : null}
        <form onSubmit={handleSubmit}>
          {mode === "signup" ? <label>Display name<input name="name" required placeholder="Your professional name" /></label> : null}
          {mode !== "update-password" ? <label>Email address<div className="input-with-icon"><Mail /><input name="email" type="email" required value={emailValue} onChange={(event) => setEmailValue(event.target.value)} placeholder="you@example.com" /></div></label> : null}
          {mode !== "reset" ? <label>{mode === "update-password" ? "New password" : "Password"}<div className="input-with-icon"><LockKeyhole /><input name="password" type="password" minLength={8} required placeholder="Minimum 8 characters" /></div></label> : null}
          <button className="button button-primary auth-submit" disabled={pending}>{pending ? "Please wait…" : mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : mode === "reset" ? "Send reset link" : "Update password"}<ArrowRight /></button>
          {mode === "signin" ? <button type="button" className="button button-secondary auth-submit" disabled={pending} onClick={() => void sendMagicLink()}><Mail/> Email me a sign-in link</button> : null}
          {status ? <p className="form-status" role="status">{status}</p> : null}
        </form>
        <div className="auth-help-actions">
          {mode === "signin" ? <button onClick={() => setMode("reset")}><KeyRound size={15}/> Forgot password?</button> : null}
          {mode === "reset" || mode === "update-password" ? <button onClick={() => setMode("signin")}>← Back to sign in</button> : null}
        </div>
        <p className="auth-terms">Sessions persist securely on this device and refresh automatically. Signing out removes the active session without deleting your locally saved Website Studio draft.</p>
      </div>
    </main>
  </div>;
}
