import { Link } from "@tanstack/react-router";
import { BadgeDollarSign, BriefcaseBusiness, FileSignature, Globe2, Handshake, Megaphone, Plus, Rocket, WalletCards } from "lucide-react";

const actions = [
  { to: "/app/create?mode=project", label: "Project", description: "Create a build room and publish controlled project context.", icon: Rocket },
  { to: "/app/revenue", label: "Lead / sale", description: "Create a customer, opportunity, proposal, quote or invoice.", icon: BadgeDollarSign },
  { to: "/app/growth", label: "Campaign", description: "Start a growth campaign, experiment, content or SEO workflow.", icon: Megaphone },
  { to: "/app/compliance", label: "Contract / legal", description: "Create or review a contract, signature or compliance action.", icon: FileSignature },
  { to: "/app/funding", label: "Investor / funding", description: "Add an investor, funding opportunity or capital workflow.", icon: WalletCards },
  { to: "/app/website-studio-templates", label: "Website", description: "Start a new production website from a premium template.", icon: Globe2 },
  { to: "/app/operations", label: "Company action", description: "Create an operating task, objective, meeting, risk or vendor action.", icon: BriefcaseBusiness },
  { to: "/app/collaboration", label: "Collaboration", description: "Open a controlled collaboration request or project room.", icon: Handshake },
] as const;

export function OperatingCreateLauncher() {
  return <section className="operating-section" style={{ marginBottom: 18 }}>
    <div className="operating-section-head"><div><span>UNIVERSAL CREATE</span><h3>What do you want to move forward?</h3></div><span className="operating-launcher-badge"><Plus size={13}/> One create surface</span></div>
    <div className="operating-for-you">{actions.map(({ to, label, description, icon: Icon }) => <Link to={to as any} className="operating-tool-card" key={to}><Icon size={18}/><strong>{label}</strong><span>{description}</span><small>Create / open →</small></Link>)}</div>
  </section>;
}
