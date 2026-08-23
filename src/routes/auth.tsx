import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Eye, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { supabase } from "../integrations/supabase/client";

export const Route = createFileRoute("/auth")({ component: AuthPage });

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [status, setStatus] = useState<string>("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setStatus("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    const result =
      mode === "signin"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: { data: { display_name: String(form.get("name") ?? "") } },
          });
    setPending(false);
    setStatus(
      result.error
        ? result.error.message
        : mode === "signin"
          ? "Signed in successfully."
          : "Check your email to verify your account.",
    );
  }

  return (
    <div className="auth-page">
      <section className="auth-brand-panel">
        <Link to="/">
          <img src="/brand/start-to-up-logo-white.png" alt="Start To Up" />
        </Link>
        <div>
          <span className="section-label">FROM IDEAS TO IMPACT</span>
          <h1>The serious network for people building what comes next.</h1>
          <p>
            Document your work, protect sensitive projects and find collaborators who can help you
            move forward.
          </p>
        </div>
        <ul>
          <li>
            <ShieldCheck /> Innovation-only community
          </li>
          <li>
            <LockKeyhole /> Private projects by default
          </li>
          <li>
            <Eye /> Creator-controlled visibility
          </li>
        </ul>
      </section>
      <main className="auth-form-panel">
        <div className="auth-mobile-logo">
          <img src="/brand/start-to-up-logo-primary.png" alt="Start To Up" />
        </div>
        <div className="auth-form-wrap">
          <span className="content-kicker">
            {mode === "signin" ? "WELCOME BACK" : "JOIN THE NETWORK"}
          </span>
          <h2>{mode === "signin" ? "Continue building." : "Create your Innovation Passport."}</h2>
          <p>
            {mode === "signin"
              ? "Sign in to access your projects and network."
              : "Your work deserves a credible home and serious connections."}
          </p>
          <div className="auth-switch">
            <button className={mode === "signin" ? "active" : ""} onClick={() => setMode("signin")}>
              Sign in
            </button>
            <button className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>
              Create account
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            {mode === "signup" ? (
              <label>
                Display name
                <input name="name" required placeholder="Your professional name" />
              </label>
            ) : null}
            <label>
              Email address
              <div className="input-with-icon">
                <Mail />
                <input name="email" type="email" required placeholder="you@example.com" />
              </div>
            </label>
            <label>
              Password
              <div className="input-with-icon">
                <LockKeyhole />
                <input
                  name="password"
                  type="password"
                  minLength={8}
                  required
                  placeholder="Minimum 8 characters"
                />
              </div>
            </label>
            <button className="button button-primary auth-submit" disabled={pending}>
              {pending ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
              <ArrowRight />
            </button>
            {status ? (
              <p className="form-status" role="status">
                {status}
              </p>
            ) : null}
          </form>
          <p className="auth-terms">
            By continuing, you acknowledge the Terms, Privacy Notice and Innovation Community Code.
            Full agreement acceptance is completed during onboarding.
          </p>
          <Link to="/app/home" className="preview-link">
            Preview the Phase 0 experience →
          </Link>
        </div>
      </main>
    </div>
  );
}
