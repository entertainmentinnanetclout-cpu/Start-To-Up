import { CheckCircle2, LoaderCircle } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: Record<string, unknown>) => string;
      remove: (widgetId: string) => void;
    };
  }
}

function TurnstileWidget({ onToken }: { onToken: (token: string) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const siteKey = import.meta.env["VITE_TURNSTILE_SITE_KEY"] as string | undefined;

  useEffect(() => {
    if (!siteKey || !container.current) return;
    let widgetId: string | undefined;
    const render = () => {
      if (container.current && window.turnstile && !widgetId) {
        widgetId = window.turnstile.render(container.current, {
          sitekey: siteKey,
          callback: onToken,
          "expired-callback": () => onToken(""),
          theme: "light",
        });
      }
    };
    const existing = document.querySelector<HTMLScriptElement>(
      "script[data-start-to-up-turnstile]",
    );
    if (existing) {
      existing.addEventListener("load", render);
      render();
    } else {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.dataset["startToUpTurnstile"] = "true";
      script.addEventListener("load", render);
      document.head.appendChild(script);
    }
    return () => {
      existing?.removeEventListener("load", render);
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, [onToken, siteKey]);

  if (!siteKey)
    return (
      <p className="captcha-config">
        Secure verification is temporarily unavailable. Please return shortly.
      </p>
    );
  return <div className="turnstile-slot" ref={container} aria-label="Security verification" />;
}

export function GuestActionForm({
  label,
  fieldLabel,
  placeholder,
  onSubmit,
}: {
  label: string;
  fieldLabel: string;
  placeholder: string;
  onSubmit: (value: string, email: string, captchaToken: string) => Promise<unknown>;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [email, setEmail] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");
    try {
      if (!captchaToken) throw new Error("Complete the security verification.");
      await onSubmit(value.trim(), email.trim(), captchaToken);
      setStatus("success");
      setMessage("Submitted securely. You can return to this device to view its status.");
      setValue("");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Submission failed. Please try again.");
    }
  }

  if (!open) return <button onClick={() => setOpen(true)}>{label}</button>;
  return (
    <form className="guest-action-form" onSubmit={submit}>
      <label>
        <span>{fieldLabel}</span>
        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder}
          minLength={10}
          maxLength={1500}
          required
        />
      </label>
      <TurnstileWidget onToken={setCaptchaToken} />
      <label>
        <span>Contact email</span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          required
        />
      </label>
      <div>
        <button type="button" className="button-quiet" onClick={() => setOpen(false)}>
          Cancel
        </button>
        <button type="submit" disabled={status === "submitting"}>
          {status === "submitting" ? <LoaderCircle className="spin" /> : "Submit"}
        </button>
      </div>
      {message ? (
        <p className={`form-result ${status}`} role="status">
          {status === "success" ? <CheckCircle2 /> : null}
          {message}
        </p>
      ) : null}
    </form>
  );
}

export function GuestReportForm({
  onSubmit,
}: {
  onSubmit: (
    subjectId: string,
    category: string,
    description: string,
    email: string,
    captchaToken: string,
  ) => Promise<unknown>;
}) {
  const [subjectId, setSubjectId] = useState("");
  const [category, setCategory] = useState("irrelevant_content");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    try {
      if (!captchaToken) throw new Error("Complete the security verification.");
      await onSubmit(subjectId.trim(), category, description.trim(), email.trim(), captchaToken);
      setStatus("success");
      setMessage("Report submitted for human review.");
      setDescription("");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Report submission failed.");
    }
  }

  return (
    <form className="guest-action-form report-form" onSubmit={submit}>
      <label>
        <span>Content or project reference</span>
        <input
          value={subjectId}
          onChange={(event) => setSubjectId(event.target.value)}
          placeholder="Paste the record UUID"
          pattern="[0-9a-fA-F-]{36}"
          required
        />
      </label>
      <TurnstileWidget onToken={setCaptchaToken} />
      <label>
        <span>Report category</span>
        <select value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="irrelevant_content">Unrelated content</option>
          <option value="fraud_or_spam">Fraud or spam</option>
          <option value="harassment">Harassment</option>
          <option value="unsafe_activity">Unsafe or unlawful activity</option>
          <option value="false_credentials">False credentials</option>
        </select>
      </label>
      <label>
        <span>What happened?</span>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          minLength={20}
          maxLength={3000}
          required
        />
      </label>
      <label>
        <span>Contact email</span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          required
        />
      </label>
      <button type="submit" disabled={status === "submitting"}>
        {status === "submitting" ? <LoaderCircle className="spin" /> : "Submit report"}
      </button>
      {message ? (
        <p className={`form-result ${status}`} role="status">
          {message}
        </p>
      ) : null}
    </form>
  );
}
