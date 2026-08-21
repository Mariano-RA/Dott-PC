/**
 * Capacidades de código (hay fetcher/parser/cache). El interruptor operativo
 * es Proveedores.activo: un proveedor inactivo no entra en descarga, dólar,
 * catálogo ni cache masivo aunque figure acá.
 */
export const FETCHER_PROVIDERS = ["air", "elit", "invid", "mega", "nb"] as const;
export const MANUAL_UPLOAD_PROVIDERS = ["eikon", "hdc"] as const;
export const IMAGE_CACHE_PROVIDERS = ["elit", "nb", "eikon", "mega", "air", "invid"] as const;

const fetcherSet = new Set<string>(FETCHER_PROVIDERS);
const manualSet = new Set<string>(MANUAL_UPLOAD_PROVIDERS);
const imageCacheSet = new Set<string>(IMAGE_CACHE_PROVIDERS);

export function normalizeProveedorNombre(nombre: string): string {
  return String(nombre || "")
    .trim()
    .toLowerCase();
}

export function hasFetcher(nombre: string): boolean {
  return fetcherSet.has(normalizeProveedorNombre(nombre));
}

export function hasManualUpload(nombre: string): boolean {
  return manualSet.has(normalizeProveedorNombre(nombre));
}

export function hasImageCache(nombre: string): boolean {
  return imageCacheSet.has(normalizeProveedorNombre(nombre));
}
