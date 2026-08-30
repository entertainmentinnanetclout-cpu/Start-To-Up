import { supabase } from "../integrations/supabase/client";

const db = supabase as any;

export function metaAdLibraryUrl(companyName: string, country = "ZA") {
  const url = new URL("https://www.facebook.com/ads/library/");
  url.searchParams.set("active_status", "active");
  url.searchParams.set("ad_type", "all");
  url.searchParams.set("country", country || "ZA");
  url.searchParams.set("q", companyName.trim());
  url.searchParams.set("search_type", "keyword_unordered");
  return url.toString();
}

export async function saveMetaAdLibraryObservation(
  organizationId: string,
  intelligenceId: string,
  state: "active_observed" | "none_observed" | "unknown",
  evidenceUrl: string,
) {
  if (!organizationId || !intelligenceId) throw new Error("Company intelligence record required");
  const { data: current, error: readError } = await db
    .from("company_intelligence_records")
    .select("id,evidence")
    .eq("organization_id", organizationId)
    .eq("id", intelligenceId)
    .maybeSingle();
  if (readError) throw readError;
  if (!current) throw new Error("Company intelligence record not found");

  const previousEvidence = current.evidence && typeof current.evidence === "object" ? current.evidence : {};
  const nextEvidence = {
    ...previousEvidence,
    metaAdLibrary: {
      state,
      source: "Meta Ad Library",
      evidenceUrl,
      checkedAt: new Date().toISOString(),
      confidence: "observed",
      limitation: "This records a public Ad Library observation only. It does not provide private spend, CTR, CPA, conversions or ROAS.",
    },
  };
  const { data, error } = await db
    .from("company_intelligence_records")
    .update({
      meta_ads_status: state,
      meta_ads_evidence_url: evidenceUrl,
      meta_ads_checked_at: new Date().toISOString(),
      evidence: nextEvidence,
      updated_at: new Date().toISOString(),
    })
    .eq("organization_id", organizationId)
    .eq("id", intelligenceId)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}
