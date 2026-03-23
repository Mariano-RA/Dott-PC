export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { apiUrl } from "../../utils/utils";
import {
  finalizeResponse,
  getAccessTokenForWrite,
  getUpstreamErrorMessage,
  isLocalAuthBypassEnabled,
  proxyDelete,
  proxyGet,
} from "../../_shared/upstream";

export async function GET() {
  try {
    const data = await proxyGet(`${apiUrl}/categories/new`);
    return NextResponse.json(data);
  } catch (error) {
    const status = error?.response?.status || 500;
    const message =
      error?.response?.data?.message || error?.message || "Error al obtener categorías nuevas";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request) {
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
    const { searchParams } = new URL(request.url);
    const proveedor = searchParams.get("proveedor") || "";
    const categoriaRaw = searchParams.get("categoriaRaw") || "";
    const data = await proxyDelete(`${apiUrl}/categories/new`, {
      accessToken,
      params: { proveedor, categoriaRaw },
    });
    return finalizeResponse(cookieJar, NextResponse.json(data));
  } catch (error) {
    const status = error?.response?.status || 500;
    const message = getUpstreamErrorMessage(error, "Error al descartar");
    return finalizeResponse(cookieJar, NextResponse.json({ error: message }, { status }));
  }
}
