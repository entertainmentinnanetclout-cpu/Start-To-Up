import { createFileRoute } from "@tanstack/react-router";
import { BadgeCheck, Building2 } from "lucide-react";
import { AppShell } from "../../components/app-shell";
import { DataState } from "../../components/live-data-ui";
import { usePublicTrustData } from "../../lib/start-to-up-data";

export const Route = createFileRoute("/app/organizations")({ component: OrganizationsPage });
function OrganizationsPage() {
  const trust = usePublicTrustData();
  return (
    <AppShell title="Organizations" eyebrow="INNOVATION ECOSYSTEM DIRECTORY">
      <DataState
        loading={trust.loading}
        error={trust.error}
        empty={!trust.data.organizations.length}
      >
        <div className="trust-grid">
          {trust.data.organizations.map((organization) => (
            <article className="trust-card" key={organization.id}>
              <Building2 />
              <h2>{organization.name}</h2>
              <span>{organization.organization_type}</span>
              <p>{organization.description || "No public organization description."}</p>
              <small>
                {organization.is_verified ? (
                  <>
                    <BadgeCheck /> Verified organization
                  </>
                ) : (
                  "Verification pending"
                )}
              </small>
            </article>
          ))}
        </div>
      </DataState>
    </AppShell>
  );
}
