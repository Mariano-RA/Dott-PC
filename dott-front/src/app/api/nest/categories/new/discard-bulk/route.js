export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { apiUrl } from "../../../utils/utils";
import {
  finalizeResponse,
  getAccessTokenForWrite,
  getUpstreamErrorMessage,
  isLocalAuthBypassEnabled,
  proxyPost,
} from "../../../_shared/upstream";

export async function POST(request) {
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
    const body = await request.json();
    const data = await proxyPost(`${apiUrl}/categories/new/discard-bulk`, body, { accessToken });
    return finalizeResponse(cookieJar, NextResponse.json(data));
  } catch (error) {
    const status = error?.response?.status || 500;
    const message = getUpstreamErrorMessage(error, "Error al descartar en lote");
    return finalizeResponse(cookieJar, NextResponse.json({ error: message }, { status }));
  }
}
