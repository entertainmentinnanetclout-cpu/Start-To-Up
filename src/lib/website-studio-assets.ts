import { supabase } from "../integrations/supabase/client";

const BUCKET = "website-studio-assets";
const MAX_BYTES = 15 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/svg+xml"]);
const BRAND_MATERIAL_TYPES = new Set([...IMAGE_TYPES, "application/pdf"]);

export type WebsiteStudioAssetSlot =
  | "logo"
  | "favicon"
  | "hero"
  | "gallery"
  | "og-image"
  | "brand-material";

export type UploadedWebsiteStudioAsset = {
  id?: string;
  path: string;
  publicUrl: string;
  originalName: string;
  contentType: string;
  bytes: number;
  slot?: WebsiteStudioAssetSlot;
};

function cleanFilename(name: string) {
  const dot = name.lastIndexOf(".");
  const ext = dot >= 0 ? name.slice(dot).toLowerCase().replace(/[^a-z0-9.]/g, "") : "";
  const stem = (dot >= 0 ? name.slice(0, dot) : name)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70) || "asset";
  return `${stem}${ext}`;
}

function validate(file: File, slot: WebsiteStudioAssetSlot) {
  if (!file || !file.size) throw new Error("EMPTY_FILE");
  if (file.size > MAX_BYTES) throw new Error("FILE_TOO_LARGE");
  const allowed = slot === "brand-material" ? BRAND_MATERIAL_TYPES : IMAGE_TYPES;
  if (!allowed.has(file.type)) throw new Error(slot === "brand-material" ? "UNSUPPORTED_BRAND_FILE" : "IMAGE_REQUIRED");
}

export async function uploadWebsiteStudioAsset(file: File, slot: WebsiteStudioAssetSlot, projectId?: string): Promise<UploadedWebsiteStudioAsset> {
  validate(file, slot);
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) throw new Error("SIGN_IN_REQUIRED");

  const filename = cleanFilename(file.name);
  const path = `${authData.user.id}/${slot}/${Date.now()}-${crypto.randomUUID()}-${filename}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: false,
    cacheControl: "3600",
    contentType: file.type,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  if (!data.publicUrl) {
    await supabase.storage.from(BUCKET).remove([path]).catch(() => undefined);
    throw new Error("PUBLIC_URL_FAILED");
  }

  // The generated Database type may lag a new migration during local development,
  // so this narrow cast is intentionally isolated to the just-added asset library.
  const database = supabase as any;
  const { data: row, error: recordError } = await database.from("website_studio_assets").insert({
    owner_id: authData.user.id,
    project_id: projectId || null,
    slot,
    storage_path: path,
    public_url: data.publicUrl,
    original_filename: file.name,
    mime_type: file.type,
    byte_size: file.size,
  }).select("id").single();

  if (recordError) {
    await supabase.storage.from(BUCKET).remove([path]).catch(() => undefined);
    throw recordError;
  }

  return {
    id: row?.id,
    path,
    publicUrl: data.publicUrl,
    originalName: file.name,
    contentType: file.type,
    bytes: file.size,
    slot,
  };
}

export async function uploadWebsiteStudioAssets(files: FileList | File[], slot: WebsiteStudioAssetSlot = "gallery", projectId?: string) {
  const input = Array.from(files);
  const uploaded: UploadedWebsiteStudioAsset[] = [];
  for (const file of input) uploaded.push(await uploadWebsiteStudioAsset(file, slot, projectId));
  return uploaded;
}

export async function listWebsiteStudioAssets(limit = 36): Promise<UploadedWebsiteStudioAsset[]> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) return [];
  const database = supabase as any;
  const { data, error } = await database.from("website_studio_assets")
    .select("id,slot,storage_path,public_url,original_filename,mime_type,byte_size")
    .eq("owner_id", authData.user.id)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []).map((row: any) => ({
    id: row.id,
    path: row.storage_path,
    publicUrl: row.public_url,
    originalName: row.original_filename,
    contentType: row.mime_type,
    bytes: Number(row.byte_size || 0),
    slot: row.slot,
  }));
}

export function websiteStudioAssetErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || "");
  if (message === "SIGN_IN_REQUIRED") return "Sign in before uploading website assets.";
  if (message === "FILE_TOO_LARGE") return "Each asset must be 15 MB or smaller.";
  if (message === "IMAGE_REQUIRED") return "Use PNG, JPG, WebP or SVG for this image slot.";
  if (message === "UNSUPPORTED_BRAND_FILE") return "Brand material must be PNG, JPG, WebP, SVG or PDF.";
  if (message === "EMPTY_FILE") return "Choose a non-empty file.";
  return "Asset upload failed. Check the file and try again.";
}
