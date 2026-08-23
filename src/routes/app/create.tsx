import { Link, createFileRoute } from "@tanstack/react-router";
import { type FormEvent, useMemo, useState } from "react";
import {
  ArrowRight,
  FileText,
  FlaskConical,
  Handshake,
  Lightbulb,
  ListChecks,
  LockKeyhole,
  Radio,
  Upload,
  Video,
  X,
} from "lucide-react";
import { AppShell } from "../../components/app-shell";
import { useSessionState } from "../../lib/start-to-up-data";
import {
  createProjectWithWorkspace,
  publishBuildReel,
  scheduleLiveEvent,
  useOwnProjects,
} from "../../lib/pro-network-data";
import {
  createCollaborationRequest,
  createProjectMilestone,
  publishNetworkPost,
} from "../../lib/publishing-data";
import type { Database } from "../../integrations/supabase/types";
import "../../pro-network.css";

type Mode = "project" | "reel" | "live" | "post" | "research" | "update" | "collaboration";

export const Route = createFileRoute("/app/create")({
  validateSearch: (search: Record<string, unknown>) => ({
    mode: typeof search.mode === "string" ? search.mode : undefined,
  }),
  component: CreateHub,
});

const types: Array<{
  mode: Mode;
  icon: typeof FileText;
  title: string;
  text: string;
  color: string;
}> = [
  { mode: "project", icon: Lightbulb, title: "Project", text: "Publish a project and open its build room", color: "amber" },
  { mode: "reel", icon: Video, title: "Build Reel", text: "Upload a prototype, demo or technical walkthrough", color: "blue" },
  { mode: "live", icon: Radio, title: "Live Session", text: "Schedule a product demo, review or expert stream", color: "indigo" },
  { mode: "collaboration", icon: Handshake, title: "Collaboration Call", text: "Recruit a specific capability into a project", color: "navy" },
  { mode: "update", icon: ListChecks, title: "Progress Update", text: "Record a milestone and mirror it to the network", color: "teal" },
  { mode: "research", icon: FlaskConical, title: "Research", text: "Share findings, evidence or a research request", color: "violet" },
  { mode: "post", icon: FileText, title: "Network Post", text: "Publish a focused innovation insight or update", color: "indigo" },
];

function CreateHub() {
  const search = Route.useSearch();
  const initial = types.some((type) => type.mode === search.mode) ? (search.mode as Mode) : "project";
  const [selected, setSelected] = useState<Mode>(initial);
  const session = useSessionState();
  const projects = useOwnProjects(session.session?.user.id);

  return (
    <AppShell title="Create" eyebrow="PUBLISH WORK · FORM TEAMS · BUILD IN PUBLIC OR PRIVATE">
      <section className="create-intro pro-create-intro">
        <div>
          <h2>What are you moving forward?</h2>
          <p>
            Start To Up creation is project-first: publish the work, attach the right media and keep delivery connected to the people responsible.
          </p>
        </div>
        <div className="privacy-pill"><LockKeyhole size={16} /> Project visibility stays under your control</div>
      </section>

      <div className="create-grid pro-create-grid">
        {types.map(({ mode, icon: Icon, title, text, color }) => (
          <button className={`create-type${selected === mode ? " active" : ""}`} key={mode} onClick={() => setSelected(mode)}>
            <span className={`create-icon icon-${color}`}><Icon /></span>
            <div><strong>{title}</strong><p>{text}</p></div>
            <ArrowRight />
          </button>
        ))}
      </div>

      <section className="pro-publisher-shell">
        <header className="pro-publisher-head">
          <div><span>ACTIVE PUBLISHER</span><h3>{types.find((type) => type.mode === selected)?.title}</h3></div>
          <button type="button" onClick={() => setSelected("project")}><X /> Reset</button>
        </header>
        {!session.session || session.session.user.is_anonymous ? (
          <AuthPrompt />
        ) : selected === "project" ? (
          <ProjectForm onCreated={() => setSelected("reel")} />
        ) : selected === "reel" ? (
          <BuildReelForm projects={projects.data} />
        ) : selected === "live" ? (
          <LiveSessionForm />
        ) : selected === "collaboration" ? (
          <CollaborationForm projects={projects.data} />
        ) : selected === "update" ? (
          <ProgressForm projects={projects.data} />
        ) : (
          <PostForm projects={projects.data} research={selected === "research"} />
        )}
      </section>

      <section className="draft-card publishing-standard-card">
        <div className="draft-art"><LockKeyhole /></div>
        <div>
          <span className="content-kicker">THE PUBLISHING STANDARD</span>
          <h3>Show enough to create trust. Protect what must remain controlled.</h3>
          <p>
            Define the problem, current stage, evidence, required skills and visibility before a project enters discovery. Public media can attract contributors; protected room material stays with approved collaborators.
          </p>
        </div>
        <Link to="/app/collaboration">Open collaboration rooms</Link>
      </section>
    </AppShell>
  );
}

function AuthPrompt() {
  return (
    <div className="pro-room-lock" style={{ margin: 22 }}>
      <LockKeyhole />
      <h3>Sign in to publish and collaborate.</h3>
      <p>A permanent member account protects project ownership, contributor attribution and private workspace access.</p>
      <Link to="/auth" className="button button-primary">Sign in <ArrowRight /></Link>
    </div>
  );
}

function ProjectForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [pitch, setPitch] = useState("");
  const [problem, setProblem] = useState("");
  const [solution, setSolution] = useState("");
  const [technologies, setTechnologies] = useState("");
  const [skills, setSkills] = useState("");
  const [stage, setStage] = useState<Database["public"]["Enums"]["project_stage"]>("idea");
  const [visibility, setVisibility] = useState<Database["public"]["Enums"]["visibility_level"]>("community");
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [seekingFunding, setSeekingFunding] = useState(false);
  const status = useActionStatus();

  async function submit(event: FormEvent) {
    event.preventDefault();
    status.start();
    try {
      const result = await createProjectWithWorkspace({
        name,
        pitch,
        problem,
        solution,
        technologies: splitTags(technologies),
        requiredSkills: splitTags(skills),
        stage,
        repositoryUrl,
        demoUrl,
        seekingFunding,
        visibility,
      });
      status.success(`${result.project.name} is published and its collaboration room is ready.`);
      setName(""); setPitch(""); setProblem(""); setSolution(""); setTechnologies(""); setSkills(""); setRepositoryUrl(""); setDemoUrl("");
    } catch (error) {
      status.fail(error);
    }
  }

  return (
    <form className="pro-create-form" onSubmit={submit}>
      <div className="pro-form-grid">
        <Field label="Project name"><input value={name} onChange={(event) => setName(event.target.value)} required placeholder="e.g. Campus logistics API" /></Field>
        <Field label="Stage"><select value={stage} onChange={(event) => setStage(event.target.value as typeof stage)}>{["idea","research","concept","prototype","testing","pilot","early_market","growth","established"].map((value) => <option value={value} key={value}>{value.replaceAll("_"," ")}</option>)}</select></Field>
      </div>
      <Field label="One-line pitch"><textarea value={pitch} onChange={(event) => setPitch(event.target.value)} required placeholder="What are you building, for whom, and why does it matter?" /></Field>
      <div className="pro-form-grid">
        <Field label="Problem"><textarea value={problem} onChange={(event) => setProblem(event.target.value)} placeholder="Describe the problem clearly." /></Field>
        <Field label="Solution"><textarea value={solution} onChange={(event) => setSolution(event.target.value)} placeholder="Describe the proposed solution and current proof." /></Field>
      </div>
      <div className="pro-form-grid">
        <Field label="Technology stack"><input value={technologies} onChange={(event) => setTechnologies(event.target.value)} placeholder="React, Supabase, Python, Flutter" /></Field>
        <Field label="Skills needed"><input value={skills} onChange={(event) => setSkills(event.target.value)} placeholder="Backend, UI/UX, AI, legal, sales" /></Field>
      </div>
      <div className="pro-form-grid">
        <Field label="Repository URL"><input type="url" value={repositoryUrl} onChange={(event) => setRepositoryUrl(event.target.value)} placeholder="https://github.com/..." /></Field>
        <Field label="Demo URL"><input type="url" value={demoUrl} onChange={(event) => setDemoUrl(event.target.value)} placeholder="https://..." /></Field>
      </div>
      <div className="pro-form-grid">
        <Field label="Visibility"><select value={visibility} onChange={(event) => setVisibility(event.target.value as typeof visibility)}><option value="community">Network members</option><option value="public">Public discovery</option><option value="protected">Protected</option><option value="private">Private</option></select></Field>
        <div className="pro-form-checks"><label><input type="checkbox" checked={seekingFunding} onChange={(event) => setSeekingFunding(event.target.checked)} /> Seeking investment</label><label><input type="checkbox" checked readOnly /> Open to collaborators</label></div>
      </div>
      <ActionFeedback status={status} />
      <div className="pro-create-actions"><small>A build room is created automatically with the project.</small><button className="button button-primary" disabled={status.busy}>Publish project <ArrowRight /></button></div>
      {status.message ? <button type="button" className="button button-secondary" onClick={onCreated}>Publish a Build Reel next</button> : null}
    </form>
  );
}

function BuildReelForm({ projects }: { projects: Array<{ id: string; name: string }> }) {
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [projectId, setProjectId] = useState("");
  const [topics, setTopics] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [audiences, setAudiences] = useState(["developers", "entrepreneurs", "innovators", "investors", "institutions"]);
  const status = useActionStatus();

  async function submit(event: FormEvent) {
    event.preventDefault(); if (!file) return;
    status.start();
    try {
      const duration = await videoDuration(file).catch(() => undefined);
      await publishBuildReel({ title, caption, projectId: projectId || undefined, topics: splitTags(topics), audiences, file, durationSeconds: duration });
      status.success("Build Reel published to professional discovery.");
      setTitle(""); setCaption(""); setTopics(""); setFile(null);
    } catch (error) { status.fail(error); }
  }

  return (
    <form className="pro-create-form" onSubmit={submit}>
      <label className="pro-upload-zone"><Upload /><strong>{file ? file.name : "Choose an MP4 or WebM Build Reel"}</strong><span>{file ? formatBytes(file.size) : "Prototype demos, product walkthroughs, screen demos and technical explainers."}</span><input type="file" accept="video/mp4,video/webm" required onChange={(event) => setFile(event.target.files?.[0] ?? null)} /></label>
      <div className="pro-form-grid">
        <Field label="Title"><input value={title} onChange={(event) => setTitle(event.target.value)} required placeholder="What should builders understand immediately?" /></Field>
        <Field label="Attach project"><select value={projectId} onChange={(event) => setProjectId(event.target.value)}><option value="">Independent media</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></Field>
      </div>
      <Field label="Professional caption"><textarea value={caption} onChange={(event) => setCaption(event.target.value)} minLength={10} required placeholder="Explain what is being demonstrated, the current stage and where collaboration is useful." /></Field>
      <Field label="Topics"><input value={topics} onChange={(event) => setTopics(event.target.value)} placeholder="AI, fintech, mobile, React, logistics" /></Field>
      <div className="pro-form-checks">{["developers","entrepreneurs","innovators","investors","institutions"].map((audience) => <label key={audience}><input type="checkbox" checked={audiences.includes(audience)} onChange={(event) => setAudiences((current) => event.target.checked ? [...new Set([...current,audience])] : current.filter((item) => item !== audience))} /> {audience}</label>)}</div>
      <ActionFeedback status={status} />
      <div className="pro-create-actions"><small>Published video is delivered from the network media bucket and enters the signal-ranked feed.</small><button className="button button-primary" disabled={status.busy || !file}>Publish Build Reel <ArrowRight /></button></div>
    </form>
  );
}

function LiveSessionForm() {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [joinUrl, setJoinUrl] = useState("");
  const status = useActionStatus();
  return (
    <form className="pro-create-form" onSubmit={async (event) => {
      event.preventDefault(); status.start();
      try { await scheduleLiveEvent({ title, summary, startsAt, protectedJoinUrl: joinUrl }); status.success("Live session scheduled and available to the media studio."); setTitle(""); setSummary(""); setStartsAt(""); setJoinUrl(""); } catch (error) { status.fail(error); }
    }}>
      <div className="pro-form-grid"><Field label="Session title"><input value={title} onChange={(event) => setTitle(event.target.value)} required placeholder="Live prototype review" /></Field><Field label="Start time"><input type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} required /></Field></div>
      <Field label="Session brief"><textarea value={summary} onChange={(event) => setSummary(event.target.value)} required placeholder="What will be demonstrated, who should join and what outcome should the session produce?" /></Field>
      <Field label="Protected stream / studio URL"><input type="url" value={joinUrl} onChange={(event) => setJoinUrl(event.target.value)} placeholder="Optional provider URL; project context stays in Start To Up" /></Field>
      <div className="pro-live-note"><Radio /> The platform now owns discovery, scheduling, project context, room discussion and replay linking. Real-time video transport can use an approved streaming provider until a dedicated SFU/transcoding layer is connected.</div>
      <ActionFeedback status={status} />
      <div className="pro-create-actions"><small>Live sessions appear in the Media Studio and Sessions area.</small><button className="button button-primary" disabled={status.busy}>Schedule live <ArrowRight /></button></div>
    </form>
  );
}

function CollaborationForm({ projects }: { projects: Array<{ id: string; name: string }> }) {
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [requirement, setRequirement] = useState("");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState("");
  const [commitment, setCommitment] = useState("");
  const [compensation, setCompensation] = useState("");
  const [deadline, setDeadline] = useState("");
  const [remote, setRemote] = useState(true);
  const status = useActionStatus();
  if (!projects.length) return <NeedProject />;
  return (
    <form className="pro-create-form" onSubmit={async (event) => {
      event.preventDefault(); status.start();
      try { await createCollaborationRequest({ projectId, requirement, description, skills: splitTags(skills), isRemote: remote, commitment, compensationDisclosure: compensation, deadline }); status.success("Collaboration call is open and mirrored into the network."); setRequirement(""); setDescription(""); setSkills(""); } catch (error) { status.fail(error); }
    }}>
      <div className="pro-form-grid"><Field label="Project"><select value={projectId} onChange={(event) => setProjectId(event.target.value)}>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></Field><Field label="Capability required"><input value={requirement} onChange={(event) => setRequirement(event.target.value)} required placeholder="e.g. React Native engineer / pilot university / seed investor" /></Field></div>
      <Field label="Scope"><textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Describe the work, current state and expected contribution." /></Field>
      <div className="pro-form-grid"><Field label="Skills / resources"><input value={skills} onChange={(event) => setSkills(event.target.value)} placeholder="TypeScript, fintech, legal, distribution" /></Field><Field label="Commitment"><input value={commitment} onChange={(event) => setCommitment(event.target.value)} placeholder="e.g. 6 hours/week for 8 weeks" /></Field></div>
      <div className="pro-form-grid"><Field label="Compensation / terms"><input value={compensation} onChange={(event) => setCompensation(event.target.value)} placeholder="Paid, equity discussion, volunteer pilot, partnership" /></Field><Field label="Deadline"><input type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} /></Field></div>
      <div className="pro-form-checks"><label><input type="checkbox" checked={remote} onChange={(event) => setRemote(event.target.checked)} /> Remote collaboration accepted</label></div>
      <ActionFeedback status={status} />
      <div className="pro-create-actions"><small>Applications stay attached to the project and can move into the build room.</small><button className="button button-primary" disabled={status.busy}>Open collaboration call <ArrowRight /></button></div>
    </form>
  );
}

function ProgressForm({ projects }: { projects: Array<{ id: string; name: string; stage?: string }> }) {
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [stage, setStage] = useState<Database["public"]["Enums"]["project_stage"]>("prototype");
  const status = useActionStatus();
  if (!projects.length) return <NeedProject />;
  return (
    <form className="pro-create-form" onSubmit={async (event) => {
      event.preventDefault(); status.start();
      try { await createProjectMilestone({ projectId, title, description, stage }); status.success("Milestone recorded and mirrored into the project feed."); setTitle(""); setDescription(""); } catch (error) { status.fail(error); }
    }}>
      <div className="pro-form-grid"><Field label="Project"><select value={projectId} onChange={(event) => setProjectId(event.target.value)}>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></Field><Field label="Stage"><select value={stage} onChange={(event) => setStage(event.target.value as typeof stage)}>{["idea","research","concept","prototype","testing","pilot","early_market","growth","established"].map((value) => <option key={value} value={value}>{value.replaceAll("_"," ")}</option>)}</select></Field></div>
      <Field label="Milestone"><input value={title} onChange={(event) => setTitle(event.target.value)} required placeholder="What changed?" /></Field>
      <Field label="Evidence / delivery note"><textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What was delivered, tested, learned or unlocked?" /></Field>
      <ActionFeedback status={status} />
      <div className="pro-create-actions"><small>Milestones strengthen project history and contributor evidence.</small><button className="button button-primary" disabled={status.busy}>Record milestone <ArrowRight /></button></div>
    </form>
  );
}

function PostForm({ projects, research }: { projects: Array<{ id: string; name: string }>; research: boolean }) {
  const [caption, setCaption] = useState("");
  const [purpose, setPurpose] = useState("");
  const [help, setHelp] = useState("");
  const [projectId, setProjectId] = useState("");
  const status = useActionStatus();
  return (
    <form className="pro-create-form" onSubmit={async (event) => {
      event.preventDefault(); status.start();
      try { await publishNetworkPost({ caption, projectId: projectId || undefined, purpose, requestedHelp: help, type: research ? "research" : "post" }); status.success(research ? "Research post published." : "Network post published."); setCaption(""); setPurpose(""); setHelp(""); } catch (error) { status.fail(error); }
    }}>
      <div className="pro-form-grid"><Field label="Attach project"><select value={projectId} onChange={(event) => setProjectId(event.target.value)}><option value="">Independent post</option>{projects.map((project) => <option value={project.id} key={project.id}>{project.name}</option>)}</select></Field><Field label="Purpose"><input value={purpose} onChange={(event) => setPurpose(event.target.value)} placeholder={research ? "Finding, validation, research question" : "Insight, build note, opportunity"} /></Field></div>
      <Field label={research ? "Research summary" : "Post"}><textarea value={caption} onChange={(event) => setCaption(event.target.value)} required placeholder={research ? "Share the finding, method, evidence or research need." : "Share something useful to builders, founders, investors or institutions."} /></Field>
      <Field label="What response would help?"><input value={help} onChange={(event) => setHelp(event.target.value)} placeholder="Review, collaborator, data partner, investor, institution, technical advice" /></Field>
      <ActionFeedback status={status} />
      <div className="pro-create-actions"><small>Keep posts specific enough to trigger useful action.</small><button className="button button-primary" disabled={status.busy}>Publish <ArrowRight /></button></div>
    </form>
  );
}

function NeedProject() {
  return <div className="pro-room-lock" style={{ margin: 22 }}><Lightbulb /><h3>Create a project first.</h3><p>Collaboration calls and milestones need a project identity so the work, ownership and room history stay connected.</p></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label>{label}{children}</label>;
}

function useActionStatus() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  return useMemo(() => ({
    busy,
    message,
    error,
    start() { setBusy(true); setMessage(""); setError(""); },
    success(value: string) { setBusy(false); setMessage(value); setError(""); },
    fail(value: unknown) { setBusy(false); setMessage(""); setError(value instanceof Error ? value.message : "The action could not be completed."); },
  }), [busy, message, error]);
}

function ActionFeedback({ status }: { status: ReturnType<typeof useActionStatus> }) {
  if (status.error) return <div className="pro-create-error">{status.error}</div>;
  if (status.message) return <div className="pro-create-status">{status.message}</div>;
  return null;
}

function splitTags(value: string) {
  return [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))].slice(0, 20);
}

function videoDuration(file: File) {
  return new Promise<number>((resolve, reject) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(file);
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const duration = Number.isFinite(video.duration) ? Math.round(video.duration) : 0;
      URL.revokeObjectURL(url);
      resolve(duration || 0);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Video metadata could not be read."));
    };
    video.src = url;
  });
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
