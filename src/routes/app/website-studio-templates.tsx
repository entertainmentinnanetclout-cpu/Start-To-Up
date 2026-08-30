import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, LockKeyhole, Search, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "../../components/app-shell";
import { applyStudioTemplate } from "../../lib/website-studio-template-catalog";
import { getStructuralFamily, structuralFamilyLabels } from "../../lib/website-studio-structural";
import { applyVisualContractDefaults } from "../../lib/website-studio-visual-contract-defaults";
import { hasVisualContract } from "../../lib/website-studio-visual-contracts";
import { ensureStudioV6Draft } from "../../lib/website-studio-v6";
import { getVisualContractAssetPack } from "../../lib/website-studio-template-assets";
import { createEntertainmentDraft, isEntertainmentTemplate, publishedStudioTemplates, templateCommercialDefaults } from "../../lib/website-studio-entertainment-templates";
import { renderStudioHtml } from "../../lib/website-studio-render";
import "../../website-studio-templates.css";
import "../../website-studio-visual-contracts.css";

export const Route = createFileRoute("/app/website-studio-templates")({ component: WebsiteStudioTemplatesPage });

function WebsiteStudioTemplatesPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [family, setFamily] = useState("All");
  const families = useMemo(() => ["All", ...Array.from(new Set(publishedStudioTemplates.map((item) => item.family)))], []);
  const filtered = useMemo(() => publishedStudioTemplates.filter((template) => {
    const matchFamily = family === "All" || template.family === family;
    const haystack = `${template.name} ${template.family} ${template.description} ${template.tags.join(" ")}`.toLowerCase();
    return matchFamily && haystack.includes(query.toLowerCase().trim());
  }), [family, query]);

  function sampleFor(template: (typeof publishedStudioTemplates)[number]) {
    if (isEntertainmentTemplate(template.key)) return createEntertainmentDraft(template);
    return ensureStudioV6Draft(applyVisualContractDefaults(applyStudioTemplate(template)) as any);
  }

  function choose(template: (typeof publishedStudioTemplates)[number]) {
    const next = sampleFor(template);
    window.localStorage.setItem("start-to-up-website-studio-draft", JSON.stringify(next));
    window.localStorage.setItem("start-to-up-website-studio-template", template.key);
    void navigate({ to: "/app/website-studio-v6-pro" });
  }

  return <AppShell title="Website templates" eyebrow={`${publishedStudioTemplates.length} CURATED VISUAL SYSTEMS`} action={<Link to="/app/website-studio-v6-pro" className="button button-secondary">Open website editor</Link>}>
    <section className="template-library-hero">
      <div><span><Sparkles/> START TO UP CURATED TEMPLATE LIBRARY</span><h2>Only templates with a real custom visual system stay in the marketplace.</h2><p>Generic duplicate/mock renderers are hidden. Every listed system has a dedicated visual contract or an industry-specific live renderer that is carried into editing, multi-page preview and exported source.</p></div>
      <div className="template-library-count"><strong>{publishedStudioTemplates.length}</strong><span>curated templates</span></div>
    </section>

    <section className="template-library-controls">
      <label><Search size={17}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search producer, artist, SaaS, property, clinic…"/></label>
      <div>{families.map((item) => <button key={item} className={family === item ? "active" : ""} onClick={() => setFamily(item)}>{item}</button>)}</div>
    </section>

    <section className="template-library-grid">
      {filtered.map((template) => {
        const sample = sampleFor(template);
        const contractAssets = getVisualContractAssetPack(template.key);
        const structuralFamily = getStructuralFamily(sample);
        const locked = hasVisualContract(sample) || isEntertainmentTemplate(template.key);
        const commercial = templateCommercialDefaults[template.key];
        return <article className={`template-card mood-${template.preview.mood}`} key={template.key}>
          <div className="template-card-preview template-card-live-preview">
            <div className="template-browser-bar"><i/><i/><i/><span>{template.name}</span></div>
            <div className="template-card-iframe-stage" aria-hidden="true">
              {contractAssets
                ? <img className="template-card-reference-image" src={contractAssets.preview} alt="" loading="lazy" style={{ width: "100%", height: "100%", minHeight: 260, display: "block", objectFit: "cover", objectPosition: "center top" }}/>
                : <iframe title={`${template.name} live template preview`} srcDoc={renderStudioHtml(sample)} tabIndex={-1} sandbox=""/>
              }
            </div>
            <span className="template-contract-badge"><Check size={12}/> {isEntertainmentTemplate(template.key) ? "ENTERTAINMENT VISUAL CONTRACT" : "VISUAL CONTRACT"}</span>
          </div>
          <div className="template-card-body"><div><span>{template.family}</span><h3>{template.name}</h3><p>{template.description}</p><small>{locked ? "Custom structure · replaceable media · multi-page" : structuralFamilyLabels[structuralFamily]}</small></div><div className="template-tag-row">{template.tags.slice(0,4).map((tag) => <span key={tag}>{tag}</span>)}</div><div className="template-tag-row"><span><LockKeyhole size={12}/> {commercial?.access === "paid" ? commercial.priceCents == null ? "PAID · PRICE SET BY ADMIN" : `${commercial.currency} ${(commercial.priceCents / 100).toFixed(2)}` : "FREE"}</span><span>{commercial?.approvalRequired ? "APPROVAL REQUIRED" : "OPEN ACCESS"}</span></div><button className="button button-primary" onClick={() => choose(template)}><Check size={16}/> Preview & customise</button></div>
        </article>;
      })}
    </section>
  </AppShell>;
}
