import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ExternalLink, KeyRound, PlugZap, ShieldCheck, WalletCards, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../../components/app-shell";
import { AuthDeferred } from "../../components/live-data-ui";
import { supabase } from "../../integrations/supabase/client";
import {
  invokeStartupIntegration,
  listStartupWorkspaces,
  startupOsProviders,
  type StartupOsProviderKey,
  type StartupWorkspace,
} from "../../lib/startup-os-foundation";

export const Route = createFileRoute("/app/integrations")({ component: IntegrationsPage });

type StatusRow = {
  provider: string;
  status: "disconnected" | "ready" | "connected" | "error";
  credentialHint?: string;
  externalUrl?: string;
  lastCheckedAt?: string;
  message?: string;
};

function IntegrationsPage() {
  const [sessionReady, setSessionReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [workspaces, setWorkspaces] = useState<StartupWorkspace[]>([]);
  const [workspaceId, setWorkspaceId] = useState("");
  const [selected, setSelected] = useState<StartupOsProviderKey>("github");
  const [credential, setCredential] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [statuses, setStatuses] = useState<StatusRow[]>([]);
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("Choose a provider. Every integration follows the same three-step setup pattern.");
  const provider = useMemo(() => startupOsProviders.find((item) => item.key === selected) ?? startupOsProviders[0], [selected]);
  const status = statuses.find((item) => item.provider === selected);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => { setSignedIn(Boolean(data.session)); setSessionReady(true); });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setSignedIn(Boolean(session)));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!sessionReady || !signedIn) return;
    void listStartupWorkspaces().then(async (rows) => {
      setWorkspaces(rows);
      const stored = window.localStorage.getItem("start-to-up-active-workspace") || "";
      const next = rows.some((row) => row.organization_id === stored) ? stored : rows[0]?.organization_id || "";
      setWorkspaceId(next);
      if (next) {
        window.localStorage.setItem("start-to-up-active-workspace", next);
        await refreshStatuses(next);
      }
    }).catch(() => setNotice("Your workspace integrations could not be loaded."));
  }, [sessionReady, signedIn]);

  useEffect(() => { setCredential(""); setFields({}); setNotice("Follow the three steps, review the cost note, then test the connection."); }, [selected]);

  async function refreshStatuses(id = workspaceId) {
    if (!id) return;
    try {
      const data = await invokeStartupIntegration("status", id);
      setStatuses(Array.isArray(data?.connections) ? data.connections : []);
    } catch {
      setNotice("Connection status could not be refreshed. Try again shortly.");
    }
  }

  async function switchWorkspace(id: string) {
    setWorkspaceId(id);
    window.localStorage.setItem("start-to-up-active-workspace", id);
    setStatuses([]);
    await refreshStatuses(id);
  }

  async function act(action: "test" | "connect" | "disconnect") {
    if (!workspaceId) return setNotice("Create a Startup OS company workspace first.");
    setBusy(action);
    try {
      const data = await invokeStartupIntegration(action, workspaceId, selected, credential, fields);
      setNotice(data?.message || (action === "disconnect" ? "Integration disconnected." : "Connection verified."));
      if (action !== "test") setCredential("");
      await refreshStatuses(workspaceId);
    } catch {
      setNotice("The provider could not verify those details. Check the copied value, account permissions and provider setup, then try again.");
    } finally {
      setBusy("");
    }
  }

  if (!sessionReady) return <AppShell title="Integrations" eyebrow="STARTUP OS · CONNECT YOUR TOOLS"><div className="phase0-loading">Restoring your session…</div></AppShell>;
  if (!signedIn) return <AppShell title="Integrations" eyebrow="STARTUP OS · CONNECT YOUR TOOLS"><AuthDeferred /></AppShell>;
  if (!workspaces.length) return <AppShell title="Integrations" eyebrow="STARTUP OS · CONNECT YOUR TOOLS"><section className="phase0-onboarding-card"><PlugZap/><h2>Create your company workspace first.</h2><p>Integrations belong to a secure Startup OS workspace so credentials, permissions and audit history stay isolated.</p><Link to="/app/startup-os" className="button button-primary">Open Startup OS</Link></section></AppShell>;

  return (
    <AppShell title="Integrations" eyebrow="3-STEP SELF-SERVICE SETUP">
      <section className="phase0-toolbar integration-workspace-bar">
        <div><span>CONNECT FOR</span><select value={workspaceId} onChange={(event) => void switchWorkspace(event.target.value)}>{workspaces.map((workspace) => <option key={workspace.organization_id} value={workspace.organization_id}>{workspace.name}</option>)}</select></div>
        <Link to="/app/startup-os">← Company workspace</Link>
      </section>

      <div className="startup-integrations-layout">
        <aside className="startup-integrations-nav">
          <header><PlugZap/><div><strong>Integration Centre</strong><span>No API experience required.</span></div></header>
          <div>
            {startupOsProviders.map((item) => {
              const itemStatus = statuses.find((row) => row.provider === item.key)?.status;
              return <button key={item.key} className={selected === item.key ? "active" : ""} onClick={() => setSelected(item.key)}>
                <span><strong>{item.name}</strong><small>{item.module}</small></span>
                {itemStatus === "connected" ? <CheckCircle2/> : itemStatus === "error" ? <XCircle/> : <PlugZap/>}
              </button>;
            })}
          </div>
        </aside>

        <main className="startup-integration-detail">
          <header className="startup-integration-heading">
            <div><span>{provider.module.toUpperCase()}</span><h2>{provider.name}</h2><p>{provider.purpose}</p></div>
            <b className={`startup-integration-status ${status?.status || "disconnected"}`}>{status?.status || "not connected"}</b>
          </header>

          <section className="startup-three-steps">
            {provider.steps.map((step, index) => <article key={step}><b>{index + 1}</b><div><strong>{index === 0 ? "Open provider" : index === 1 ? "Get the required value" : "Connect in Start To Up"}</strong><p>{step}</p>{index === 0 ? <a href={provider.setupUrl} target="_blank" rel="noreferrer">Open {provider.name} <ExternalLink/></a> : null}</div></article>)}
          </section>

          <aside className="startup-integration-cost"><WalletCards/><div><strong>Cost / quota note</strong><span>{provider.cost}</span></div></aside>

          <div className="startup-integration-links"><a href={provider.setupUrl} target="_blank" rel="noreferrer">Setup page <ExternalLink/></a><a href={provider.docsUrl} target="_blank" rel="noreferrer">Official documentation <ExternalLink/></a></div>

          <section className="startup-integration-form">
            {provider.fields?.map((field) => <label key={field.key}>{field.label}<input value={fields[field.key] || ""} onChange={(event) => setFields((current) => ({ ...current, [field.key]: event.target.value }))} placeholder={field.placeholder}/></label>)}
            <label>{provider.credentialLabel}<div className="startup-secret-input"><KeyRound/><input type={provider.secret ? "password" : "text"} autoComplete="off" value={credential} onChange={(event) => setCredential(event.target.value)} placeholder={provider.credentialPlaceholder}/></div></label>
            {status?.credentialHint ? <p className="startup-saved-secret"><ShieldCheck/> Saved securely · {status.credentialHint}</p> : null}
            <p className="phase0-notice" role="status">{notice}</p>
            <div className="startup-integration-actions">
              <button onClick={() => void act("test")} disabled={Boolean(busy)}>{busy === "test" ? "Testing…" : "Test connection"}</button>
              <button className="primary" onClick={() => void act("connect")} disabled={Boolean(busy)}>{busy === "connect" ? "Connecting…" : "Test & connect"}</button>
              {status?.status === "connected" ? <button onClick={() => void act("disconnect")} disabled={Boolean(busy)}>Disconnect</button> : null}
            </div>
          </section>

          <aside className="phase0-privacy-note"><ShieldCheck/><div><strong>Secrets stay server-side.</strong><span>Start To Up stores private provider credentials as encrypted server-only values. Public pages, browser-readable records and exported Website Studio projects never receive them.</span></div></aside>
        </main>
      </div>
    </AppShell>
  );
}
