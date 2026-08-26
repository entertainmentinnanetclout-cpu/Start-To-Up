type AdminClient = any;
function base64ToBytes(value: string) { const raw = atob(value); return Uint8Array.from(raw, (char) => char.charCodeAt(0)); }
async function cryptoKey(serviceRole: string, projectId: string, provider: string) {
  const material = new TextEncoder().encode(`${serviceRole}|website-studio-provider-v1|${projectId}|${provider}`);
  const digest = await crypto.subtle.digest("SHA-256", material);
  return crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, ["decrypt"]);
}
export async function getWebsiteStudioProviderCredential(admin: AdminClient, serviceRole: string, projectId: string, provider: string) {
  const { data } = await admin.from("website_studio_provider_credentials").select("ciphertext,iv").eq("project_id", projectId).eq("provider", provider).maybeSingle();
  if (!data?.ciphertext || !data?.iv) return "";
  try {
    const key = await cryptoKey(serviceRole, projectId, provider);
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: base64ToBytes(data.iv) }, key, base64ToBytes(data.ciphertext));
    return new TextDecoder().decode(plain);
  } catch {
    return "";
  }
}
