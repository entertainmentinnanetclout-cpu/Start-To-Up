import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "../../components/app-shell";
import { AuthDeferred, DataState } from "../../components/live-data-ui";
import { useProfiles, useSessionState } from "../../lib/start-to-up-data";

export const Route = createFileRoute("/app/profile")({ component: ProfilePage });
function ProfilePage() {
  const { session, loading: sessionLoading } = useSessionState();
  const profiles = useProfiles();
  const profile = profiles.data.find((item) => item.id === session?.user.id);
  return (
    <AppShell title="Innovation Passport" eyebrow="VERIFIABLE BUILD RECORD">
      {!sessionLoading && !session ? (
        <AuthDeferred />
      ) : (
        <DataState
          loading={profiles.loading || sessionLoading}
          error={profiles.error}
          empty={!profile}
        >
          {profile ? (
            <section className="profile-card">
              <div className="profile-cover">
                <div className="profile-pattern" />
              </div>
              <div className="profile-main">
                <div className="profile-avatar">
                  {profile.display_name.slice(0, 2).toUpperCase()}
                </div>
                <div className="profile-identity">
                  <div>
                    <h2>{profile.display_name}</h2>
                    <span>@{profile.username}</span>
                  </div>
                  <p>{profile.bio || "No biography published."}</p>
                </div>
              </div>
              <div className="profile-stats">
                <div>
                  <strong>{profile.is_verified ? "Verified" : "Unverified"}</strong>
                  <span>Trust status</span>
                </div>
                <div>
                  <strong>{profile.open_to_collaboration ? "Open" : "Closed"}</strong>
                  <span>Collaboration</span>
                </div>
              </div>
            </section>
          ) : null}
        </DataState>
      )}
    </AppShell>
  );
}
