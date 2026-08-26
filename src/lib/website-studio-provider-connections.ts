import { supabase } from "../integrations/supabase/client";
import type { StudioIntegrationProvider } from "./website-studio-integration-guides";

export type ProviderConnectionState = {
  provider: StudioIntegrationProvider;
  hasCredential: boolean;
  credentialHint?: string | null;
  status: string;
  config: Record<string, unknown>;
  externalUrl?: string | null;
  updatedAt?: string | null;
  lastError?: string | null;
};

async function invoke(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("website-studio-credentials", { body });
  if (error) throw error;
  return data;
}

export function providerConnectionStatus(projectId: string, provider: StudioIntegrationProvider): Promise<ProviderConnectionState> {
  return invoke({ action: "status", projectId, provider });
}

export function saveProviderConnection(projectId: string, provider: StudioIntegrationProvider, config: Record<string, unknown>, secret = "") {
  return invoke({ action: "save", projectId, provider, config, secret });
}

export function testProviderConnection(projectId: string, provider: StudioIntegrationProvider, config: Record<string, unknown>, secret = "") {
  return invoke({ action: "test", projectId, provider, config, secret });
}

export function removeProviderConnection(projectId: string, provider: StudioIntegrationProvider) {
  return invoke({ action: "remove", projectId, provider });
}
