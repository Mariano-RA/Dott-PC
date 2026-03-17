/**
 * Rutas centralizadas de la API (frontend).
 * Sustituye strings hardcodeados para que cambiar la URL base del backend sea trivial.
 *
 * Uso local (backend Nest en http://localhost:8090):
 * - Recomendado: no definir NEXT_PUBLIC_API_BASE_URL. Definir en .env.local:
 *   NEXT_PUBLIC_APP_API_SERVER_URL=http://localhost:8090
 *   Así el navegador llama a tu Next (ej. :3000) y Next hace proxy al 8090.
 * - Alternativa (llamadas directas del navegador al 8090): en .env.local:
 *   NEXT_PUBLIC_API_BASE_URL=http://localhost:8090
 *   El backend debe exponer las mismas rutas (/api/nest/...) y CORS habilitado.
 *
 * Variable de entorno opcional: NEXT_PUBLIC_API_BASE_URL
 * - Por defecto: "" (mismo origen).
 * - Si se define: el navegador llama a esa URL base (ej. "http://localhost:8090").
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

function path(segment: string): string {
  return API_BASE ? `${API_BASE}${segment}` : segment;
}

/** Endpoints del proxy Next.js hacia el backend Nest (/api/nest/...) */
export const api = {
  nest: {
    calculatorConfig: path("/api/nest/calculator-config"),
    quote: path("/api/nest/quote"),
    dolar: path("/api/nest/dolar"),
    categorys: path("/api/nest/categorys"),
    proveedores: path("/api/nest/proveedores"),
    products: {
      list: path("/api/nest/products/list"),
      category: path("/api/nest/products/category"),
      keywords: path("/api/nest/products/keywords"),
      fetchPrices: path("/api/nest/products/fetch-prices"),
    },
    categories: {
      new: path("/api/nest/categories/new"),
      newDiscardBulk: path("/api/nest/categories/new/discard-bulk"),
      dictionary: path("/api/nest/categories/dictionary"),
      dictionaryBulk: path("/api/nest/categories/dictionary/bulk"),
      masterList: path("/api/nest/categories/sql/master"),
      masterTree: path("/api/nest/categories/sql/master-tree"),
      masterFlat: path("/api/nest/categories/sql/master-flat"),
    },
  },
  /** Rutas de Auth0 (Next.js API routes) */
  auth: {
    login: path("/api/auth/login"),
    logout: path("/api/auth/logout"),
  },
} as const;

export type ApiRoutes = typeof api;
