import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, Search, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "../../components/app-shell";
import { applyStudioTemplate, studioTemplates } from "../../lib/website-studio-template-catalog";
import { getStructuralFamily, structuralFamilyLabels } from "../../lib/website-studio-structural";
import { hasVisualContract, renderWebsiteStudioHtml } from "../../lib/website-studio-visual-contracts";
import "../../website-studio-templates.css";
import "../../website-studio-visual-contracts.css";

export const Route = createFileRoute("/app/website-studio-templates")({ component: WebsiteStudioTemplatesPage });

function WebsiteStudioTemplatesPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [family, setFamily] = useState("All");
  const families = useMemo(() => ["All", ...Array.from(new Set(studioTemplates.map((item) => item.family)))], []);
  const filtered = useMemo(() => studioTemplates.filter((template) => {
    const matchFamily = family === "All" || template.family === family;
    const haystack = `${template.name} ${template.family} ${template.description} ${template.tags.join(" ")}`.toLowerCase();
    return matchFamily && haystack.includes(query.toLowerCase().trim());
  }), [family, query]);

  function choose(template: (typeof studioTemplates)[number]) {
    const next = applyStudioTemplate(template);
    window.localStorage.setItem("start-to-up-website-studio-draft", JSON.stringify(next));
    window.localStorage.setItem("start-to-up-website-studio-template", template.key);
    void navigate({ to: "/app/website-studio-v4" });
  }

  return <AppShell title="Website templates" eyebrow={`${studioTemplates.length} PREMIUM STRUCTURAL SYSTEMS`} action={<Link to="/app/website-studio-v4" className="button button-secondary">Open website editor</Link>}>
    <section className="template-library-hero">
      <div><span><Sparkles/> START TO UP TEMPLATE LIBRARY V5</span><h2>What you preview is what gets built.</h2><p>Marketplace cards now render the same source used by the editor, ZIP export, GitHub publication and Vercel deployment. The ten approved templates are reference-locked visual contracts; other catalogue entries show their actual structural renderer instead of invented mockups.</p></div>
      <div className="template-library-count"><strong>{studioTemplates.length}</strong><span>premium templates</span></div>
    </section>

    <section className="template-library-controls">
      <label><Search size={17}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search SaaS, restaurant, property, clinic…"/></label>
      <div>{families.map((item) => <button key={item} className={family === item ? "active" : ""} onClick={() => setFamily(item)}>{item}</button>)}</div>
    </section>

    <section className="template-library-grid">
      {filtered.map((template) => {
        const sample = applyStudioTemplate(template);
        const structuralFamily = getStructuralFamily(sample);
        const locked = hasVisualContract(sample);
        return <article className={`template-card mood-${template.preview.mood}`} key={template.key}>
          <div className="template-card-preview template-card-live-preview">
            <div className="template-browser-bar"><i/><i/><i/><span>{template.name}</span></div>
            <div className="template-card-iframe-stage" aria-hidden="true">
              <iframe title={`${template.name} live template preview`} srcDoc={renderWebsiteStudioHtml(sample)} tabIndex={-1}/>
            </div>
            {locked ? <span className="template-contract-badge"><Check size={12}/> VISUAL CONTRACT</span> : <span className="template-contract-badge structural">LIVE RENDERER</span>}
          </div>
          <div className="template-card-body"><div><span>{template.family}</span><h3>{template.name}</h3><p>{template.description}</p><small>{locked ? "Reference-locked structure · replaceable media" : structuralFamilyLabels[structuralFamily]}</small></div><div className="template-tag-row">{template.tags.slice(0,3).map((tag) => <span key={tag}>{tag}</span>)}</div><button className="button button-primary" onClick={() => choose(template)}><Check size={16}/> Use template</button></div>
        </article>;
      })}
    </section>
  </AppShell>;
}
