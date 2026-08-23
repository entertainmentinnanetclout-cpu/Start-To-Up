import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Banknote,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  Code2,
  Compass,
  FileCheck2,
  Gauge,
  Handshake,
  Lightbulb,
  Megaphone,
  Rocket,
  Scale,
  ShieldCheck,
  Target,
  Users,
} from "lucide-react";

export const Route = createFileRoute("/startup-playbook")({
  component: StartupPlaybook,
  head: () => ({
    meta: [
      { title: "Startup Playbook | Start To Up" },
      {
        name: "description",
        content:
          "A practical startup operating playbook covering validation, product, sales, finance, hiring, fundraising, operations and scale.",
      },
    ],
  }),
});

const modules = [
  {
    id: "validate",
    number: "01",
    icon: Lightbulb,
    title: "Validate before you build",
    principle: "The first job is not building. It is proving that a painful problem exists for a reachable customer.",
    tips: [
      "Interview people who actually experience the problem; do not ask friends whether they like the idea.",
      "Write the problem in one sentence: who has it, when it happens, what it costs them and how they solve it today.",
      "Ask for evidence of past behaviour—money spent, workarounds used, time lost—not hypothetical future interest.",
      "Pick one narrow early customer segment. A startup normally wins a beachhead before it wins a broad market.",
      "Define a falsifiable validation target such as 20 interviews, 5 strong design partners or 3 paid pilots.",
    ],
  },
  {
    id: "market",
    number: "02",
    icon: Compass,
    title: "Know the market and the wedge",
    principle: "A large market is not a strategy. You need a specific entry point where your advantage is obvious.",
    tips: [
      "Map direct competitors, substitutes and the option of doing nothing.",
      "Identify your wedge: faster, cheaper, safer, easier, more trusted, better distributed or uniquely integrated.",
      "Estimate market size from customers × realistic annual spend before relying on headline industry reports.",
      "Choose a segment you can actually reach with your current network, sales motion and budget.",
      "Track why prospects reject you. Rejection patterns usually reveal positioning, pricing or product gaps.",
    ],
  },
  {
    id: "product",
    number: "03",
    icon: Code2,
    title: "Build the smallest useful product",
    principle: "An MVP is the smallest credible system that tests the riskiest assumption—not a cheap version of the final product.",
    tips: [
      "Rank features by the customer job they unlock. Remove anything that does not change the validation result.",
      "Prototype before engineering when a clickable flow can answer the same question faster.",
      "Instrument the product from day one: activation, completion, retention and critical failure points.",
      "Release to a controlled cohort, watch users operate it and fix friction before adding surface area.",
      "Keep a written product decision log so the team remembers why a feature exists and what evidence justified it.",
    ],
  },
  {
    id: "business-model",
    number: "04",
    icon: CircleDollarSign,
    title: "Design the business model early",
    principle: "Revenue architecture affects the product, sales motion, support burden and capital requirements.",
    tips: [
      "Decide who uses, who pays and who approves. In institutional sales these may be three different people.",
      "Test willingness to pay before polishing pricing pages.",
      "Model gross margin after payment fees, delivery, support, infrastructure and partner revenue shares.",
      "Avoid pricing solely from competitor prices; anchor price to value created, risk removed or cost saved.",
      "Know whether your motion is self-serve, sales-assisted, enterprise, marketplace, transaction or hybrid.",
    ],
  },
  {
    id: "cash",
    number: "05",
    icon: Banknote,
    title: "Control cash like an operator",
    principle: "Profitable-looking startups can still die from timing. Cash runway is a weekly operating metric.",
    tips: [
      "Maintain a 13-week cash forecast and update actuals every week.",
      "Separate fixed costs, variable costs and founder discretionary spend.",
      "Know monthly burn, net burn and runway in months under base, upside and downside scenarios.",
      "Collect deposits, milestone payments or annual prepayment where the business model allows it.",
      "Do not hire permanently to solve a temporary workload spike unless the demand is repeatable.",
      "Create approval thresholds so one person cannot casually commit the company to large recurring expenses.",
    ],
  },
  {
    id: "sales",
    number: "06",
    icon: Target,
    title: "Install a sales operating cadence",
    principle: "Sales improves when it becomes a measurable process instead of a founder mood.",
    tips: [
      "Define stages with exit criteria: lead, qualified, discovery, proposal, decision, won/lost.",
      "Track pipeline value, probability, next action, owner and expected close date for every real opportunity.",
      "Run discovery around problem, urgency, decision process, budget, alternatives and implementation risk.",
      "Follow every meeting with the agreed next step and date; vague follow-ups create fake pipeline.",
      "Review lost deals monthly and code the reason—price, timing, no authority, competitor, product gap or no decision.",
    ],
  },
  {
    id: "marketing",
    number: "07",
    icon: Megaphone,
    title: "Market proof, not noise",
    principle: "Early-stage marketing should shorten trust and sales cycles by showing evidence that the company understands the problem.",
    tips: [
      "Create content around customer problems, decisions and implementation—not only company announcements.",
      "Turn pilots, user outcomes and lessons into case studies with measurable before/after evidence.",
      "Own a small number of distribution channels you can sustain instead of posting everywhere inconsistently.",
      "Measure qualified conversations and activation, not vanity reach alone.",
      "Build founder credibility through useful explanations, transparent progress and real operating insight.",
    ],
  },
  {
    id: "team",
    number: "08",
    icon: Users,
    title: "Hire around outcomes",
    principle: "A startup team needs accountable owners, not inflated titles and overlapping responsibilities.",
    tips: [
      "Define the outcome, decision rights and scorecard before opening a role.",
      "Use contractors or specialist partners where the work is important but not yet a permanent full-time function.",
      "Keep one directly responsible owner for every critical metric or deliverable.",
      "Document access, credentials, code ownership, files and vendor relationships so the company is not hostage to one person.",
      "Create a simple weekly leadership rhythm: priorities, metrics, blockers, decisions and commitments.",
    ],
  },
  {
    id: "risk",
    number: "09",
    icon: ShieldCheck,
    title: "Protect the company early",
    principle: "Governance should reduce future disputes without turning an early startup into a bureaucracy.",
    tips: [
      "Keep company, founder and customer money clearly separated.",
      "Put founder ownership, vesting or exit expectations, decision rights and IP assignment in writing.",
      "Use signed contracts for material customers, suppliers, contractors and strategic partnerships.",
      "Store evidence of product creation, major decisions, versions and contributor ownership.",
      "Design privacy, access control, backups and least-privilege permissions before sensitive data becomes difficult to untangle.",
      "Use qualified legal, tax and regulatory professionals for obligations that materially affect the company.",
    ],
  },
  {
    id: "metrics",
    number: "10",
    icon: BarChart3,
    title: "Run the company from a small metric stack",
    principle: "The right metrics expose reality quickly. Too many metrics hide it.",
    tips: [
      "Choose one primary value metric tied to customer success, not internal activity.",
      "Track acquisition, activation, retention, revenue and referral in a simple funnel.",
      "For recurring revenue, watch MRR/ARR, churn, net revenue retention and gross margin.",
      "For marketplaces, track liquidity, repeat rate, take rate, fulfilment and contribution margin.",
      "For transaction businesses, monitor frequency, average order value, failed transactions and unit contribution.",
      "Review trends and cohorts. A single total number can hide deterioration in newer customers.",
    ],
  },
  {
    id: "funding",
    number: "11",
    icon: BriefcaseBusiness,
    title: "Raise capital from a position of evidence",
    principle: "Funding is a financing strategy, not validation. Know what capital will unlock and why now is the right time.",
    tips: [
      "State the raise, runway created, milestones funded and what becomes materially more valuable after those milestones.",
      "Maintain a clean data room: incorporation records, cap table, contracts, financials, metrics, IP, team and product evidence.",
      "Tell a coherent story from problem → wedge → traction → economics → market → team → plan → ask.",
      "Know your dilution and future financing needs before accepting a headline valuation.",
      "Treat investor conversations as a pipeline with stages, next actions and decision timing.",
      "Do not claim traction you cannot evidence. Investor trust is expensive to rebuild.",
    ],
  },
  {
    id: "scale",
    number: "12",
    icon: Rocket,
    title: "Scale only what is repeatable",
    principle: "Scaling magnifies both strengths and defects. Systemise the motion before spending aggressively to expand it.",
    tips: [
      "Prove a repeatable acquisition and delivery motion in one segment or geography before multiplying complexity.",
      "Write the playbook for onboarding, sales, delivery, support and incident handling before adding large teams.",
      "Watch contribution margin while growing; revenue growth that worsens unit economics can destroy optionality.",
      "Automate stable processes after understanding them. Automating confusion makes confusion faster.",
      "Add management layers only when span of control and decision load require them.",
      "Revisit strategy quarterly: what changed, what remains true, where capital should move and what should stop.",
    ],
  },
] as const;

const weeklyRhythm = [
  ["Monday", "Set the three company priorities and owners for the week."],
  ["Daily", "Review sales movement, product incidents and cash-sensitive issues."],
  ["Wednesday", "Check customer evidence: interviews, support, activation, retention and delivery."],
  ["Friday", "Close commitments, update metrics and record decisions before the next week starts."],
  ["Monthly", "Review runway, P&L, pipeline, product metrics, hiring capacity and strategic risks."],
] as const;

function StartupPlaybook() {
  return (
    <div className="startup-playbook-page">
      <header className="playbook-header shell-width">
        <Link preload="intent" to="/" className="playbook-brand">
          <img src="/brand/start-to-up-logo-white.png" alt="Start To Up" decoding="async" />
        </Link>
        <div className="playbook-header-actions">
          <Link preload="intent" to="/" className="playbook-back"><ArrowLeft /> Company</Link>
          <Link preload="intent" to="/app/home" className="button button-primary">Enter the network</Link>
        </div>
      </header>

      <main>
        <section className="playbook-hero shell-width">
          <div>
            <span><BadgeCheck /> START TO UP OPERATING PLAYBOOK</span>
            <h1>The practical operating system for building a startup.</h1>
            <p>
              A founder-grade reference for moving from an idea to a company that can validate,
              sell, deliver, control cash, raise capital and scale with discipline.
            </p>
            <div className="playbook-hero-actions">
              <a href="#validate" className="button button-primary">Start with validation <ArrowRight /></a>
              <a href="#weekly-rhythm" className="button button-secondary">Weekly founder rhythm</a>
            </div>
          </div>
          <aside className="playbook-principles">
            <strong>STARTUP RULES THAT COMPOUND</strong>
            <div><CheckCircle2 /> Evidence before opinion.</div>
            <div><CheckCircle2 /> Cash before vanity.</div>
            <div><CheckCircle2 /> One owner per outcome.</div>
            <div><CheckCircle2 /> Distribution is part of the product.</div>
            <div><CheckCircle2 /> Scale repeatability, not chaos.</div>
          </aside>
        </section>

        <section className="playbook-map shell-width" aria-label="Startup playbook modules">
          {modules.map((module) => (
            <a href={`#${module.id}`} key={module.id}><span>{module.number}</span>{module.title}</a>
          ))}
        </section>

        <section className="playbook-modules shell-width">
          {modules.map(({ id, number, icon: Icon, title, principle, tips }) => (
            <article id={id} className="playbook-module" key={id}>
              <header>
                <div><Icon /></div>
                <span>{number}</span>
                <div><h2>{title}</h2><p>{principle}</p></div>
              </header>
              <ul>
                {tips.map((tip) => <li key={tip}><CheckCircle2 /> <span>{tip}</span></li>)}
              </ul>
            </article>
          ))}
        </section>

        <section id="weekly-rhythm" className="founder-rhythm shell-width">
          <div className="founder-rhythm-heading">
            <span><Gauge /> FOUNDER OPERATING RHYTHM</span>
            <h2>Run the company on a cadence.</h2>
            <p>Consistency turns strategy into execution and makes problems visible while they are still manageable.</p>
          </div>
          <div className="rhythm-grid">
            {weeklyRhythm.map(([cadence, action]) => (
              <article key={cadence}><strong>{cadence}</strong><p>{action}</p></article>
            ))}
          </div>
        </section>

        <section className="playbook-scorecard shell-width">
          <div>
            <span><FileCheck2 /> MONTHLY FOUNDER SCORECARD</span>
            <h2>Know these numbers without opening ten dashboards.</h2>
          </div>
          <div className="scorecard-grid">
            <article><CircleDollarSign /><strong>Runway</strong><span>Months of cash remaining</span></article>
            <article><Target /><strong>Pipeline</strong><span>Qualified revenue in motion</span></article>
            <article><Users /><strong>Retention</strong><span>Customers who keep receiving value</span></article>
            <article><BarChart3 /><strong>Unit economics</strong><span>Value created per customer/order</span></article>
            <article><Handshake /><strong>Delivery</strong><span>Promises shipped on time</span></article>
            <article><Scale /><strong>Risk</strong><span>Top unresolved company exposures</span></article>
          </div>
        </section>

        <section className="playbook-cta shell-width">
          <div>
            <span>FROM KNOWLEDGE TO EXECUTION</span>
            <h2>Use the playbook, then build inside the network.</h2>
            <p>Turn startup knowledge into projects, collaborators, media, live sessions, investor readiness and operating workspaces.</p>
          </div>
          <div>
            <Link preload="intent" to="/app/home" className="button button-primary button-large">Enter Start To Up <ArrowRight /></Link>
            <a href="mailto:starttoscale@gmail.com?subject=Startup%20support%20enquiry" className="button button-secondary button-large">Work with the company</a>
          </div>
        </section>
      </main>

      <footer className="playbook-footer shell-width">
        <img src="/brand/start-to-up-logo-white.png" alt="Start To Up" loading="lazy" decoding="async" />
        <p>Practical startup operating guidance. Specific legal, tax, investment and regulatory decisions should be reviewed with appropriately qualified professionals.</p>
      </footer>
    </div>
  );
}
