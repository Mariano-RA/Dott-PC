import {
  IMAGE_CACHE_PROVIDERS,
  hasImageCache,
} from "../proveedor/proveedor.capabilities";

export const GALLERY_PROVIDERS = new Set(["elit", "air"]);
/** Proveedores que mandan el array de fotos en el listado (no AIR). */
export const LISTING_GALLERY_PROVIDERS = new Set(["elit"]);
export const MAX_GALLERY_IMAGES = 8;
export { IMAGE_CACHE_PROVIDERS, hasImageCache };
export type ImageCacheProveedor = (typeof IMAGE_CACHE_PROVIDERS)[number];

export function supportsGallery(proveedor: string): boolean {
  return GALLERY_PROVIDERS.has(String(proveedor || "").trim().toLowerCase());
}

export function normalizeImageUrls(raw: unknown, max = MAX_GALLERY_IMAGES): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    const url = String(item ?? "").trim();
    if (!url || seen.has(url)) continue;
    seen.add(url);
    out.push(url);
    if (out.length >= max) break;
  }
  return out;
}
