import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ExternalLink, KeyRound, PlugZap, ShieldCheck, X } from "lucide-react";
import {
  connectStudioProvider,
  disconnectStudioProvider,
  listStudioProviderStatuses,
  studioProviders,
  testStudioProvider,
  type ProviderConnectionStatus,
  type StudioProviderKey,
} from "../lib/website-studio-provider-setup";
import type { StudioV6Draft } from "../lib/website-studio-v6";

function currentDraft(): StudioV6Draft | null {
  try {
    return JSON.parse(localStorage.getItem("start-to-up-website-studio-draft") || "null") as StudioV6Draft | null;
  } catch {
    return null;
  }
}

export function WebsiteStudioProviderSetup({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [selected, setSelected] = useState<StudioProviderKey>("github");
  const [credential, setCredential] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [statuses, setStatuses] = useState<ProviderConnectionStatus[]>([]);
  const [busy, setBusy] = useState<"test" | "connect" | "disconnect" | "">("");
  const [notice, setNotice] = useState("Choose an integration. Each connection takes three guided steps.");
  const provider = useMemo(() => studioProviders.find((item) => item.key === selected) ?? studioProviders[0], [selected]);
  const status = statuses.find((item) => item.provider === selected);

  useEffect(() => {
    if (!open) return;
    const draft = currentDraft();
    if (!draft?.id) return;
    void listStudioProviderStatuses(draft.id).then(setStatuses).catch(() => undefined);
  }, [open]);

  useEffect(() => {
    setCredential("");
    setFields({});
    setNotice("Follow the three steps below, then test the connection.");
  }, [selected]);

  async function act(action: "test" | "connect" | "disconnect") {
    const draft = currentDraft();
    if (!draft?.id) {
      setNotice("Save the Website Studio project first, then connect external services.");
      return;
    }
    setBusy(action);
    try {
      const result = action === "disconnect"
        ? await disconnectStudioProvider(draft.id, selected)
        : action === "test"
          ? await testStudioProvider(draft.id, selected, credential, fields)
          : await connectStudioProvider(draft.id, selected, credential, fields);
      setStatuses((current) => [...current.filter((item) => item.provider !== selected), result]);
      setNotice(result.message || (action === "test" ? "Connection test passed." : action === "connect" ? "Integration connected." : "Integration disconnected."));
      if (action !== "test") setCredential("");
    } catch {
      setNotice("The connection could not be verified. Check the copied value and provider permissions, then try again.");
    } finally {
      setBusy("");
    }
  }

  if (!open) return null;
  return (
    <div className="stu-provider-layer" role="dialog" aria-modal="true" aria-label="Website Studio integrations">
      <button className="stu-provider-backdrop" onClick={onClose} aria-label="Close integrations" />
      <section className="stu-provider-drawer">
        <header className="stu-provider-header">
          <div><span>SELF-SERVICE INTEGRATIONS</span><h2>Connect your own services</h2><p>No API experience required. Website Studio explains exactly where to click and what to copy.</p></div>
          <button onClick={onClose} aria-label="Close"><X /></button>
        </header>
        <div className="stu-provider-layout">
          <nav className="stu-provider-nav" aria-label="Integration providers">
            {studioProviders.map((item) => {
              const connected = statuses.find((statusItem) => statusItem.provider === item.key)?.status === "connected";
              return <button key={item.key} onClick={() => setSelected(item.key)} className={selected === item.key ? "active" : ""}>
                <PlugZap size={16}/><span><strong>{item.name}</strong><small>{connected ? "Connected" : "Set up"}</small></span>{connected ? <CheckCircle2 size={15}/> : null}
              </button>;
            })}
          </nav>
          <main className="stu-provider-content">
            <div className="stu-provider-title"><div><span>{provider.name.toUpperCase()}</span><h3>{provider.purpose}</h3></div><span className={`stu-provider-status ${status?.status || "disconnected"}`}>{status?.status || "not connected"}</span></div>
            <section className="stu-provider-steps">
              {provider.steps.map((step, index) => <article key={step}><b>{index + 1}</b><p>{step}</p>{index === 0 ? <a href={provider.setupUrl} target="_blank" rel="noreferrer">Open {provider.name} <ExternalLink size={13}/></a> : null}</article>)}
            </section>
            <div className="stu-provider-links"><a href={provider.setupUrl} target="_blank" rel="noreferrer">Provider setup <ExternalLink size={13}/></a><a href={provider.docsUrl} target="_blank" rel="noreferrer">Official guide <ExternalLink size={13}/></a></div>
            {provider.fields?.map((field) => <label key={field.key}>{field.label}<input value={fields[field.key] || ""} onChange={(event) => setFields((current) => ({ ...current, [field.key]: event.target.value }))} placeholder={field.placeholder}/></label>)}
            <label>{provider.credentialLabel}<div className="stu-provider-key-input"><KeyRound size={16}/><input type={provider.credentialSecret ? "password" : "text"} value={credential} onChange={(event) => setCredential(event.target.value)} placeholder={provider.credentialPlaceholder} autoComplete="off"/></div></label>
            {status?.credentialHint ? <p className="stu-provider-hint"><ShieldCheck size={15}/> Saved securely · {status.credentialHint}</p> : null}
            <p className="stu-provider-notice" role="status">{notice}</p>
            <div className="stu-provider-actions">
              <button onClick={() => void act("test")} disabled={Boolean(busy)}>{busy === "test" ? "Testing…" : "Test connection"}</button>
              <button className="primary" onClick={() => void act("connect")} disabled={Boolean(busy)}>{busy === "connect" ? "Connecting…" : "Test & connect"}</button>
              {status?.status === "connected" ? <button onClick={() => void act("disconnect")} disabled={Boolean(busy)}>Disconnect</button> : null}
            </div>
            <aside className="stu-provider-security"><ShieldCheck/><div><strong>Your secret is never added to exported source.</strong><span>Website Studio sends secret credentials only to its authenticated server connector. Generated ZIPs receive public configuration only.</span></div></aside>
          </main>
        </div>
      </section>
    </div>
  );
}
