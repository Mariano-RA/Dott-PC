export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { apiUrl } from "../../../utils/utils";
import {
  finalizeResponse,
  getAccessTokenForWrite,
  getUpstreamErrorMessage,
  isLocalAuthBypassEnabled,
  proxyDelete,
  proxyPut,
} from "../../../_shared/upstream";

export async function PUT(request, { params }) {
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
    const { key } = await params;
    const body = await request.json();
    const settings = await proxyPut(
      `${apiUrl}/calculator-settings/gateways/${encodeURIComponent(key)}`,
      body,
      { accessToken }
    );
    return finalizeResponse(cookieJar, NextResponse.json({ settings }, { status: 200 }));
  } catch (error) {
    const status = error?.response?.status || 500;
    const message = getUpstreamErrorMessage(error, "Error al actualizar pasarela");
    return finalizeResponse(cookieJar, NextResponse.json({ error: message }, { status }));
  }
}

export async function DELETE(request, { params }) {
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
    const { key } = await params;
    const settings = await proxyDelete(
      `${apiUrl}/calculator-settings/gateways/${encodeURIComponent(key)}`,
      { accessToken }
    );
    return finalizeResponse(cookieJar, NextResponse.json({ settings }, { status: 200 }));
  } catch (error) {
    const status = error?.response?.status || 500;
    const message = getUpstreamErrorMessage(error, "Error al eliminar pasarela");
    return finalizeResponse(cookieJar, NextResponse.json({ error: message }, { status }));
  }
}
