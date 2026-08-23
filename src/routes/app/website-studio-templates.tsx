import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, Search, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "../../components/app-shell";
import { applyStudioTemplate, studioTemplates } from "../../lib/website-studio-template-catalog";
import "../../website-studio-templates.css";

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
    void navigate({ to: "/app/website-studio" });
  }

  return <AppShell title="Website templates" eyebrow="24 PREMIUM STARTER SYSTEMS" action={<Link to="/app/website-studio" className="button button-secondary">Open current site</Link>}>
    <section className="template-library-hero">
      <div><span><Sparkles/> START TO UP TEMPLATE LIBRARY</span><h2>Elementor-level polish. Original Start To Up systems.</h2><p>Choose a premium starting point, then customise every colour, section, CTA, integration and source export inside Website Studio.</p></div>
      <div className="template-library-count"><strong>{studioTemplates.length}</strong><span>premium templates</span></div>
    </section>

    <section className="template-library-controls">
      <label><Search size={17}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search SaaS, restaurant, property, clinic…"/></label>
      <div>{families.map((item) => <button key={item} className={family === item ? "active" : ""} onClick={() => setFamily(item)}>{item}</button>)}</div>
    </section>

    <section className="template-library-grid">
      {filtered.map((template) => <article className={`template-card mood-${template.preview.mood}`} key={template.key}>
        <div className="template-card-preview" style={{ "--tp": template.preview.primary, "--ts": template.preview.secondary, "--ta": template.preview.accent, "--tf": template.preview.surface } as React.CSSProperties}>
          <div className="template-browser-bar"><i/><i/><i/><span>{template.name}</span></div>
          <div className="template-mini-nav"><b/><span/><span/><button/></div>
          <div className="template-mini-hero"><div><small>{template.family}</small><strong/><strong/><p/><div><button/><button/></div></div><aside><i/><i/><i/></aside></div>
          <div className="template-mini-cards"><i/><i/><i/></div>
        </div>
        <div className="template-card-body"><div><span>{template.family}</span><h3>{template.name}</h3><p>{template.description}</p></div><div className="template-tag-row">{template.tags.slice(0,3).map((tag) => <span key={tag}>{tag}</span>)}</div><button className="button button-primary" onClick={() => choose(template)}><Check size={16}/> Use template</button></div>
      </article>)}
    </section>
  </AppShell>;
}
