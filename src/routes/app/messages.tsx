import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import { AppShell } from "../../components/app-shell";
import { AuthDeferred, DataState } from "../../components/live-data-ui";
import { usePrivateTrustData, useSessionState } from "../../lib/start-to-up-data";

export const Route = createFileRoute("/app/messages")({ component: MessagesPage });
function MessagesPage() {
  const { session, loading } = useSessionState();
  const records = usePrivateTrustData(session?.user.id);
  return (
    <AppShell title="Messages" eyebrow="PRIVATE PARTICIPANT-ONLY CONVERSATIONS">
      {!loading && !session ? (
        <AuthDeferred />
      ) : (
        <DataState
          loading={loading || records.loading}
          error={records.error}
          empty={!records.data.conversations.length}
        >
          <div className="trust-list">
            {records.data.conversations.map((conversation) => (
              <article className="trust-row" key={conversation.id}>
                <MessageCircle />
                <div>
                  <strong>{conversation.subject || "Project conversation"}</strong>
                  <span>Created {new Date(conversation.created_at).toLocaleDateString()}</span>
                </div>
                <button>Open</button>
              </article>
            ))}
          </div>
        </DataState>
      )}
    </AppShell>
  );
}
