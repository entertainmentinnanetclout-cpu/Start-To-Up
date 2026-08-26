import { supabase } from "../integrations/supabase/client";
import { imageSha256 } from "./website-studio-image-tools";

const BUCKET = "website-studio-assets";
const MAX_BYTES = 15 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/svg+xml"]);
const BRAND_MATERIAL_TYPES = new Set([...IMAGE_TYPES, "application/pdf"]);

export type WebsiteStudioAssetSlot =
  | "logo" | "favicon" | "hero" | "gallery" | "og-image" | "brand-material"
  | "product" | "property" | "room" | "menu" | "course" | "team" | "practitioner" | "article" | "section";

export type UploadedWebsiteStudioAsset = {
  id?: string;
  path: string;
  publicUrl: string;
  originalName: string;
  contentType: string;
  bytes: number;
  slot?: WebsiteStudioAssetSlot;
  altText?: string;
  focalX?: number;
  focalY?: number;
  checksum?: string;
  transform?: Record<string, unknown>;
  source?: string;
};

function cleanFilename(name: string) {
  const dot = name.lastIndexOf(".");
  const ext = dot >= 0 ? name.slice(dot).toLowerCase().replace(/[^a-z0-9.]/g, "") : "";
  const stem = (dot >= 0 ? name.slice(0, dot) : name).toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70) || "asset";
  return `${stem}${ext}`;
}

function validate(file: File, slot: WebsiteStudioAssetSlot) {
  if (!file || !file.size) throw new Error("EMPTY_FILE");
  if (file.size > MAX_BYTES) throw new Error("FILE_TOO_LARGE");
  const allowed = slot === "brand-material" ? BRAND_MATERIAL_TYPES : IMAGE_TYPES;
  if (!allowed.has(file.type)) throw new Error(slot === "brand-material" ? "UNSUPPORTED_BRAND_FILE" : "IMAGE_REQUIRED");
}

export async function uploadWebsiteStudioAsset(file: File, slot: WebsiteStudioAssetSlot, projectId?: string, metadata?: { altText?: string; focalX?: number; focalY?: number; transform?: Record<string, unknown>; source?: string }): Promise<UploadedWebsiteStudioAsset> {
  validate(file, slot);
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) throw new Error("SIGN_IN_REQUIRED");

  const filename = cleanFilename(file.name);
  const path = `${authData.user.id}/${slot}/${Date.now()}-${crypto.randomUUID()}-${filename}`;
  const checksum = await imageSha256(file).catch(() => "");
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false, cacheControl: "31536000", contentType: file.type });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  if (!data.publicUrl) {
    await supabase.storage.from(BUCKET).remove([path]).catch(() => undefined);
    throw new Error("PUBLIC_URL_FAILED");
  }

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
    alt_text: metadata?.altText || "",
    focal_x: metadata?.focalX ?? .5,
    focal_y: metadata?.focalY ?? .5,
    checksum_sha256: checksum || null,
    source: metadata?.source || "upload",
    transform_config: metadata?.transform || {},
  }).select("*").single();

  if (recordError) {
    await supabase.storage.from(BUCKET).remove([path]).catch(() => undefined);
    throw recordError;
  }

  return rowToAsset(row);
}

export async function uploadWebsiteStudioAssets(files: FileList | File[], slot: WebsiteStudioAssetSlot = "gallery", projectId?: string) {
  const input = Array.from(files); const uploaded: UploadedWebsiteStudioAsset[] = [];
  for (const file of input) uploaded.push(await uploadWebsiteStudioAsset(file, slot, projectId));
  return uploaded;
}

function rowToAsset(row: any): UploadedWebsiteStudioAsset {
  return {
    id: row.id, path: row.storage_path, publicUrl: row.public_url, originalName: row.original_filename, contentType: row.mime_type, bytes: Number(row.byte_size || 0), slot: row.slot,
    altText: row.alt_text || "", focalX: Number(row.focal_x ?? .5), focalY: Number(row.focal_y ?? .5), checksum: row.checksum_sha256 || "", transform: row.transform_config || {}, source: row.source || "upload",
  };
}

export async function listWebsiteStudioAssets(limit = 72, projectId?: string): Promise<UploadedWebsiteStudioAsset[]> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) return [];
  const database = supabase as any;
  let query = database.from("website_studio_assets").select("*").eq("owner_id", authData.user.id).order("created_at", { ascending: false }).limit(limit);
  if (projectId) query = query.or(`project_id.eq.${projectId},project_id.is.null`);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(rowToAsset);
}

export async function updateWebsiteStudioAsset(assetId: string, patch: { altText?: string; focalX?: number; focalY?: number; transform?: Record<string, unknown> }) {
  const { data: authData } = await supabase.auth.getUser(); if (!authData.user) throw new Error("SIGN_IN_REQUIRED");
  const database = supabase as any;
  const payload: Record<string, unknown> = {};
  if (patch.altText !== undefined) payload.alt_text = patch.altText;
  if (patch.focalX !== undefined) payload.focal_x = patch.focalX;
  if (patch.focalY !== undefined) payload.focal_y = patch.focalY;
  if (patch.transform !== undefined) payload.transform_config = patch.transform;
  const { data, error } = await database.from("website_studio_assets").update(payload).eq("id", assetId).eq("owner_id", authData.user.id).select("*").single();
  if (error) throw error; return rowToAsset(data);
}

export async function saveWebsiteStudioAssetVariant(assetId: string, projectId: string | undefined, variant: { key: string; file: File; width: number; height: number }) {
  const { data: authData } = await supabase.auth.getUser(); if (!authData.user) throw new Error("SIGN_IN_REQUIRED");
  const filename = cleanFilename(variant.file.name);
  const path = `${authData.user.id}/variants/${assetId}/${variant.key}-${filename}`;
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, variant.file, { upsert: true, cacheControl: "31536000", contentType: variant.file.type });
  if (uploadError) throw uploadError;
  const publicUrl = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  const database = supabase as any;
  const { data, error } = await database.from("website_studio_asset_variants").upsert({ asset_id: assetId, project_id: projectId || null, variant_key: variant.key, format: variant.file.type, width: variant.width, height: variant.height, byte_size: variant.file.size, storage_path: path, public_url: publicUrl, metadata: {} }, { onConflict: "asset_id,variant_key" }).select("*").single();
  if (error) throw error; return data;
}

export async function removeWebsiteStudioAsset(asset: UploadedWebsiteStudioAsset) {
  if (!asset.id) return;
  const { data: authData } = await supabase.auth.getUser(); if (!authData.user) throw new Error("SIGN_IN_REQUIRED");
  const database = supabase as any;
  const { error } = await database.from("website_studio_assets").delete().eq("id", asset.id).eq("owner_id", authData.user.id);
  if (error) throw error;
  await supabase.storage.from(BUCKET).remove([asset.path]).catch(() => undefined);
}

export function websiteStudioAssetErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || "");
  if (message === "SIGN_IN_REQUIRED") return "Sign in before uploading website assets.";
  if (message === "FILE_TOO_LARGE") return "Each asset must be 15 MB or smaller.";
  if (message === "IMAGE_REQUIRED") return "Use PNG, JPG, WebP, AVIF or SVG for this image slot.";
  if (message === "UNSUPPORTED_BRAND_FILE") return "Brand material must be PNG, JPG, WebP, AVIF, SVG or PDF.";
  if (message === "EMPTY_FILE") return "Choose a non-empty file.";
  return "Asset operation failed. Check the file and try again.";
}
