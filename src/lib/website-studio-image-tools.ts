export type ImageFilterConfig = { brightness: number; contrast: number; saturation: number; grayscale: number; sepia: number };
export type ImageCrop = { x: number; y: number; width: number; height: number };
export type ImageEditOptions = {
  crop?: ImageCrop;
  focal?: { x: number; y: number };
  filters?: Partial<ImageFilterConfig>;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: "image/jpeg" | "image/png" | "image/webp" | "image/avif";
};
export type EditedImage = { blob: Blob; width: number; height: number; format: string; focal: { x: number; y: number } };

const defaults: ImageFilterConfig = { brightness: 100, contrast: 100, saturation: 100, grayscale: 0, sepia: 0 };

async function bitmap(file: Blob) {
  if (typeof createImageBitmap === "function") return createImageBitmap(file);
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error("IMAGE_DECODE_FAILED")); image.src = url; });
    return image;
  } finally { URL.revokeObjectURL(url); }
}

function cropPixels(sourceWidth: number, sourceHeight: number, crop?: ImageCrop) {
  if (!crop) return { x: 0, y: 0, width: sourceWidth, height: sourceHeight };
  const x = Math.max(0, Math.min(sourceWidth - 1, Math.round(crop.x * sourceWidth)));
  const y = Math.max(0, Math.min(sourceHeight - 1, Math.round(crop.y * sourceHeight)));
  const width = Math.max(1, Math.min(sourceWidth - x, Math.round(crop.width * sourceWidth)));
  const height = Math.max(1, Math.min(sourceHeight - y, Math.round(crop.height * sourceHeight)));
  return { x, y, width, height };
}

function targetSize(width: number, height: number, maxWidth = width, maxHeight = height) {
  const ratio = Math.min(1, maxWidth / width, maxHeight / height);
  return { width: Math.max(1, Math.round(width * ratio)), height: Math.max(1, Math.round(height * ratio)) };
}

function canvasBlob(canvas: HTMLCanvasElement, format: string, quality: number) {
  return new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("IMAGE_ENCODE_FAILED")), format, quality));
}

export async function editWebsiteStudioImage(file: Blob, options: ImageEditOptions = {}): Promise<EditedImage> {
  const source = await bitmap(file) as ImageBitmap & HTMLImageElement;
  const sourceWidth = source.width || source.naturalWidth;
  const sourceHeight = source.height || source.naturalHeight;
  const crop = cropPixels(sourceWidth, sourceHeight, options.crop);
  const size = targetSize(crop.width, crop.height, options.maxWidth || crop.width, options.maxHeight || crop.height);
  const canvas = document.createElement("canvas"); canvas.width = size.width; canvas.height = size.height;
  const context = canvas.getContext("2d", { alpha: true }); if (!context) throw new Error("CANVAS_UNAVAILABLE");
  const filter = { ...defaults, ...(options.filters || {}) };
  context.filter = `brightness(${filter.brightness}%) contrast(${filter.contrast}%) saturate(${filter.saturation}%) grayscale(${filter.grayscale}%) sepia(${filter.sepia}%)`;
  context.drawImage(source, crop.x, crop.y, crop.width, crop.height, 0, 0, size.width, size.height);
  const requested = options.format || "image/webp";
  let blob: Blob;
  try { blob = await canvasBlob(canvas, requested, options.quality ?? .82); }
  catch { blob = await canvasBlob(canvas, requested === "image/avif" ? "image/webp" : "image/png", options.quality ?? .82); }
  if ("close" in source && typeof source.close === "function") source.close();
  return { blob, width: size.width, height: size.height, format: blob.type, focal: options.focal || { x: .5, y: .5 } };
}

export async function generateResponsiveImageVariants(file: Blob, widths = [480, 768, 1280, 1920], preferAvif = true) {
  const variants: Array<{ key: string; blob: Blob; width: number; height: number; format: string }> = [];
  for (const width of widths) {
    for (const format of (preferAvif ? ["image/avif", "image/webp"] : ["image/webp"]) as Array<"image/avif" | "image/webp">) {
      const edited = await editWebsiteStudioImage(file, { maxWidth: width, maxHeight: width * 2, quality: format === "image/avif" ? .72 : .8, format });
      variants.push({ key: `${edited.width}w-${edited.format.includes("avif") ? "avif" : "webp"}`, blob: edited.blob, width: edited.width, height: edited.height, format: edited.format });
    }
  }
  return variants;
}

function colorDistance(r: number, g: number, b: number, target: [number, number, number]) {
  return Math.sqrt((r-target[0])**2 + (g-target[1])**2 + (b-target[2])**2);
}

export async function removeSolidBackground(file: Blob, target: [number, number, number] = [255,255,255], tolerance = 38) {
  const source = await bitmap(file) as ImageBitmap & HTMLImageElement;
  const width = source.width || source.naturalWidth, height = source.height || source.naturalHeight;
  const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true }); if (!context) throw new Error("CANVAS_UNAVAILABLE");
  context.drawImage(source,0,0,width,height);
  const image = context.getImageData(0,0,width,height);
  for (let i=0;i<image.data.length;i+=4) {
    if (colorDistance(image.data[i],image.data[i+1],image.data[i+2],target) <= tolerance) image.data[i+3] = 0;
  }
  context.putImageData(image,0,0);
  if ("close" in source && typeof source.close === "function") source.close();
  return canvasBlob(canvas,"image/png",1);
}

export async function imageSha256(file: Blob) {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2,"0")).join("");
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}
