import https from "https";
import axios from "axios";
import { NextResponse } from "next/server";

import { auth0 } from "@/lib/auth0";

const IS_LOCAL_AUTH_BYPASS =
  process.env.NODE_ENV === "development" && process.env.LOCAL_DEV_AUTH_BYPASS === "true";

const LOCAL_DEV_BEARER_TOKEN = process.env.LOCAL_DEV_BEARER_TOKEN || "";

const apiAudience =
  process.env.AUTH0_AUDIENCE?.trim() || process.env.NEXT_PUBLIC_AUDIENCE?.trim() || undefined;

export function isLocalAuthBypassEnabled() {
  return IS_LOCAL_AUTH_BYPASS;
}

/**
 * Copia cabeceras Set-Cookie de una respuesta intermedia (p. ej. refresh de token) a la respuesta final.
 */
export function forwardAuthCookies(fromResponse, toResponse) {
  if (!fromResponse || !toResponse) return;
  const h = fromResponse.headers;
  const raw =
    typeof h.getSetCookie === "function" ? h.getSetCookie() : [];
  for (const cookie of raw) {
    toResponse.headers.append("Set-Cookie", cookie);
  }
}

/** Adjunta cookies de sesión Auth0 (p. ej. tras refresh) y devuelve la misma respuesta. */
export function finalizeResponse(cookieJar, response) {
  forwardAuthCookies(cookieJar, response);
  return response;
}

/**
 * Token para endpoints de escritura (cuando Auth0 está activo).
 * Si hubo refresh de token, `cookieJar` tendrá Set-Cookie; usar forwardAuthCookies(cookieJar, resFinal).
 */
export async function getAccessTokenForWrite(request) {
  if (IS_LOCAL_AUTH_BYPASS) {
    return { accessToken: LOCAL_DEV_BEARER_TOKEN, cookieJar: null };
  }

  const cookieJar = new NextResponse();

  try {
    const session = await auth0.getSession(request);
    const fromSession = session?.tokenSet?.accessToken;
    if (fromSession) {
      return { accessToken: fromSession, cookieJar: null };
    }

    const { token } = await auth0.getAccessToken(request, cookieJar, {
      ...(apiAudience ? { audience: apiAudience } : {}),
      scope: "create:tablas offline_access",
    });

    const jarCookies =
      typeof cookieJar.headers.getSetCookie === "function"
        ? cookieJar.headers.getSetCookie()
        : [];
    const hasCookies = jarCookies.length > 0;
    return {
      accessToken: token || "",
      cookieJar: hasCookies ? cookieJar : null,
    };
  } catch {
    return { accessToken: "", cookieJar: null };
  }
}

function shouldAllowInsecureTls() {
  if (process.env.ALLOW_INSECURE_TLS === "true") return true;
  return process.env.NODE_ENV === "development";
}

export function getHttpsAgent() {
  return new https.Agent({ rejectUnauthorized: !shouldAllowInsecureTls() });
}

export function getUpstreamErrorMessage(error, fallback) {
  const data = error?.response?.data;
  if (!data) return fallback;
  const msg = data.message ?? data.error;
  if (Array.isArray(msg)) return msg.join("; ");
  if (typeof msg === "string" && msg) return msg;
  return fallback;
}

export function createAxiosConfig({ accessToken, headers, params } = {}) {
  return {
    httpsAgent: getHttpsAgent(),
    headers: {
      "Content-Type": "application/json",
      ...(headers || {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    ...(params ? { params } : {}),
  };
}

export async function proxyGet(url, { headers, params } = {}) {
  const { data } = await axios.get(url, createAxiosConfig({ headers, params }));
  return data;
}

export async function proxyPost(url, body, { accessToken, headers, params } = {}) {
  const { data } = await axios.post(url, body, createAxiosConfig({ accessToken, headers, params }));
  return data;
}

export async function proxyPut(url, body, { accessToken, headers, params } = {}) {
  const { data } = await axios.put(url, body, createAxiosConfig({ accessToken, headers, params }));
  return data;
}

export async function proxyPatch(url, body, { accessToken, headers, params } = {}) {
  const { data } = await axios.patch(url, body, createAxiosConfig({ accessToken, headers, params }));
  return data;
}

export async function proxyDelete(url, { accessToken, headers, params, data } = {}) {
  const { data: response } = await axios.delete(url, {
    ...createAxiosConfig({ accessToken, headers, params }),
    ...(data !== undefined ? { data } : {}),
  });
  return response;
}
