import { NextResponse } from "next/server";
import { apiUrl } from "../../utils/utils";
import {
  finalizeResponse,
  getAccessTokenForWrite,
  getUpstreamErrorMessage,
  isLocalAuthBypassEnabled,
} from "../../_shared/upstream";
import axios from "axios";
import { createAxiosConfig } from "../../_shared/upstream";

export async function GET(request) {
  let cookieJar = null;
  try {
    const auth = await getAccessTokenForWrite(request);
    cookieJar = auth.cookieJar;
    const { accessToken } = auth;

    if (!isLocalAuthBypassEnabled() && !accessToken) {
      return finalizeResponse(
        cookieJar,
        NextResponse.json({ error: "Acceso no autorizado" }, { status: 401 })
      );
    }

    const level = request.nextUrl.searchParams.get("level") || "";
    const source = request.nextUrl.searchParams.get("source") || "";
    const q = request.nextUrl.searchParams.get("q") || "";
    const limit = request.nextUrl.searchParams.get("limit") || "";

    const params = {
      ...(level ? { level } : {}),
      ...(source ? { source } : {}),
      ...(q ? { q } : {}),
      ...(limit ? { limit } : {}),
    };

    // Producción: según el reverse proxy, puede existir /admin/* o solo /api/nest/*.
    // Probamos ambas rutas y devolvemos la primera que responda OK.
    const candidates = [`${apiUrl}/admin/logs`, `${apiUrl}/api/nest/admin/logs`];

    let lastError = null;
    for (const endpoint of candidates) {
      try {
        const res = await axios.get(
          endpoint,
          createAxiosConfig({
            accessToken,
            headers: { "content-type": "application/json" },
            params,
          })
        );
        return finalizeResponse(cookieJar, NextResponse.json({ response: res.data }, { status: 200 }));
      } catch (err) {
        lastError = err;
        // Si el upstream no expone esa ruta (404), intentamos la alternativa.
        if (err?.response?.status === 404) continue;
        break;
      }
    }

    throw lastError;

  } catch (error) {
    const upstreamStatus = error?.response?.status;
    const message = getUpstreamErrorMessage(error, "Error al consultar logs");
    return finalizeResponse(
      cookieJar,
      NextResponse.json({ error: message }, { status: upstreamStatus || 500 })
    );
  }
}

