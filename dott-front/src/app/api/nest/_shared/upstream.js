import https from "https";
import axios from "axios";
import { NextResponse } from "next/server";
import { getAccessToken, getSession } from "@auth0/nextjs-auth0";

const IS_LOCAL_AUTH_BYPASS =
  process.env.NODE_ENV === "development" && process.env.LOCAL_DEV_AUTH_BYPASS === "true";

const LOCAL_DEV_BEARER_TOKEN = process.env.LOCAL_DEV_AUTH_BEARER_TOKEN || "";

export function isLocalAuthBypassEnabled() {
  return IS_LOCAL_AUTH_BYPASS;
}

/**
 * Token para endpoints de escritura (cuando Auth0 está activo).
 * Mantiene el comportamiento existente (session fast-path + fallback SDK).
 */
export async function getAccessTokenForWrite(request) {
  if (IS_LOCAL_AUTH_BYPASS) return LOCAL_DEV_BEARER_TOKEN;

  try {
    const session = await getSession(request);
    if (session?.accessToken) return session.accessToken;

    const { accessToken } = await getAccessToken(request, new NextResponse(), {
      authorizationParams: {
        audience: process.env.AUTH0_AUDIENCE,
        scope: "create:tablas offline_access",
      },
    });

    return accessToken || "";
  } catch {
    return "";
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

