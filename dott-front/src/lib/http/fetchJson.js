/**
 * Fetch JSON helper with consistent error shape.
 * Works in both client and server (Next) environments.
 */

export class ApiError extends Error {
  /**
   * @param {string} message
   * @param {{ status?: number, data?: any, url?: string, method?: string }} [meta]
   */
  constructor(message, meta = {}) {
    super(message);
    this.name = "ApiError";
    this.status = meta.status;
    this.data = meta.data;
    this.url = meta.url;
    this.method = meta.method;
  }
}

/**
 * @param {unknown} err
 * @returns {err is ApiError}
 */
export function isApiError(err) {
  return Boolean(err && typeof err === "object" && /** @type {any} */ (err).name === "ApiError");
}

function pickMessage(data, fallback) {
  if (!data) return fallback;
  if (typeof data === "string") return data;
  if (typeof data?.error === "string" && data.error.trim()) return data.error;
  // Nest default: { statusCode, message, error }
  if (typeof data?.message === "string" && data.message.trim()) return data.message;
  if (Array.isArray(data?.message) && data.message.length) return String(data.message[0] ?? fallback);
  return fallback;
}

/**
 * @param {string} url
 * @param {RequestInit & { timeoutMs?: number }} [init]
 * @returns {Promise<any>}
 */
export async function fetchJson(url, init = {}) {
  const { timeoutMs, ...rest } = init;
  const controller = new AbortController();
  const signal = rest.signal ?? controller.signal;
  const method = (rest.method || "GET").toUpperCase();

  /** @type {any} */
  let timeoutId = null;
  if (typeof timeoutMs === "number" && timeoutMs > 0) {
    timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  }

  try {
    const res = await fetch(url, { ...rest, signal });
    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const data = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);

    if (!res.ok) {
      const msg = pickMessage(data, `Error ${res.status} al llamar a la API.`);
      throw new ApiError(msg, { status: res.status, data, url, method });
    }
    return data;
  } catch (err) {
    // fetch network errors: TypeError in browsers
    if (err?.name === "AbortError") {
      throw new ApiError("Tiempo de espera agotado o solicitud cancelada.", { status: 0, url, method });
    }
    if (isApiError(err)) throw err;
    throw new ApiError("No se pudo conectar con el servidor.", { status: 0, url, method, data: err });
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

