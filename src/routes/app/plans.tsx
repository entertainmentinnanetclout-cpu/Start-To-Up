import { createFileRoute } from "@tanstack/react-router";
import { CreditCard, ShieldCheck } from "lucide-react";
import { AppShell } from "../../components/app-shell";
import { DataState } from "../../components/live-data-ui";
import { usePhaseThreeData } from "../../lib/start-to-up-data";

export const Route = createFileRoute("/app/plans")({ component: PlansPage });
function PlansPage() {
  const phase = usePhaseThreeData();
  return (
    <AppShell title="Platform plans" eyebrow="MONETIZATION FOUNDATION">
      <div className="phase-two-intro">
        <CreditCard />
        <div>
          <h2>Plans before payments</h2>
          <p>
            No payment processor is connected and no charges can occur. Published plans and
            entitlements are ready for later provider integration and legal review.
          </p>
        </div>
      </div>
      <DataState loading={phase.loading} error={phase.error} empty={!phase.data.plans.length}>
        <div className="trust-grid">
          {phase.data.plans.map((plan) => (
            <article className="trust-card" key={plan.id}>
              <ShieldCheck />
              <span className="status-pill">{plan.audience}</span>
              <h2>{plan.name}</h2>
              <p>{plan.description}</p>
              <strong>
                {plan.monthly_price_zar === null ? "Custom" : `R${plan.monthly_price_zar}/month`}
              </strong>
            </article>
          ))}
        </div>
      </DataState>
    </AppShell>
  );
}
