import fs from "node:fs";

const path = "src/routes/app/website-studio-v6.tsx";
let source = fs.readFileSync(path, "utf8");
const start = source.indexOf(" function FormsPanel(){");
const end = source.indexOf(" function ImportsPanel(){", start);
if (start < 0 || end < 0) throw new Error("FormsPanel markers not found");

const replacement = ` function FormsPanel(){
  const form=(draft.studioV6.forms[0]||null) as StudioV6Form|null;
  async function persistForm(){
    if(!draft.id||!draft.studioV6.forms[0]) return setNotice("Save the project before saving a managed form.");
    try{const saved=await saveForm(draft.id,draft.studioV6.forms[0]);setForms([saved]);setNotice("Form configuration saved.")}catch{setNotice("Form could not be saved. Your draft remains safe.")}
  }
  function addField(type:StudioV6Form["fields"][number]["type"]){
    change(next=>{const target=next.studioV6.forms[0];if(!target)return;target.fields.push({id:\`field-\${crypto.randomUUID()}\`,name:\`field\${target.fields.length+1}\`,label:\`New \${type} field\`,type,required:false})});
  }
  return <Panel title="Forms & CRM" desc="Visual field builder, managed inbox, spam settings, autoresponder/email hooks, lead tags, CSV export and optional CRM webhook integration.">
    {form?<>
      <label>Form name<input value={form.name} onChange={e=>change(next=>{if(next.studioV6.forms[0])next.studioV6.forms[0].name=e.target.value})}/></label>
      <div className="v6-list">{form.fields.map(field=><article key={field.id}><input value={field.label} onChange={e=>change(next=>{const target=next.studioV6.forms[0]?.fields.find(item=>item.id===field.id);if(target)target.label=e.target.value})}/><span>{field.type}{field.required?" · required":""}</span></article>)}</div>
      <div className="v6-chip-grid">{(["text","email","tel","textarea","select","date","time","number"] as const).map(type=><button key={type} onClick={()=>addField(type)}>+ {type}</button>)}</div>
      <label className="v6-check"><input type="checkbox" checked={form.autoresponder.enabled} onChange={e=>change(next=>{if(next.studioV6.forms[0])next.studioV6.forms[0].autoresponder.enabled=e.target.checked})}/> Send autoresponder when an email provider is connected</label>
      <button onClick={()=>void persistForm()}>Save form</button>
    </>:null}
    <div className="v6-row"><h4>Submission inbox</h4><button onClick={()=>downloadText("website-studio-leads.csv",csvFromRows(submissions),"text/csv")}>Export CSV</button></div>
    <div className="v6-list">{submissions.slice(0,30).map(row=><article key={row.id}><div><strong>{row.full_name||row.email||"Lead"}</strong><span>{row.email} · {row.status}</span></div><select value={row.status} onChange={e=>{if(!draft.id)return;void updateSubmission(row.id,e.target.value,row.tags||[]).then(updated=>setSubmissions(current=>current.map(item=>item.id===updated.id?updated:item)))}}><option value="new">new</option><option value="qualified">qualified</option><option value="contacted">contacted</option><option value="closed">closed</option></select></article>)}</div>
  </Panel>
 }
`;

source = source.slice(0,start) + replacement + source.slice(end);
fs.writeFileSync(path, source);
console.log("Rewrote FormsPanel with parser-safe JSX.");
