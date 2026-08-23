import { CheckCircle2, LoaderCircle } from "lucide-react";
import { useState, type FormEvent } from "react";

export function GuestActionForm({
  label,
  fieldLabel,
  placeholder,
  onSubmit,
}: {
  label: string;
  fieldLabel: string;
  placeholder: string;
  onSubmit: (value: string, email: string) => Promise<unknown>;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");
    try {
      await onSubmit(value.trim(), email.trim());
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
  ) => Promise<unknown>;
}) {
  const [subjectId, setSubjectId] = useState("");
  const [category, setCategory] = useState("irrelevant_content");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    try {
      await onSubmit(subjectId.trim(), category, description.trim(), email.trim());
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
