export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { apiUrl } from "../../utils/utils";
import {
  getAccessTokenForWrite,
  getUpstreamErrorMessage,
  isLocalAuthBypassEnabled,
  proxyGet,
  proxyPost,
} from "../../_shared/upstream";

export async function GET() {
  try {
    const data = await proxyGet(`${apiUrl}/categories/dictionary`);
    return NextResponse.json(data);
  } catch (error) {
    const status = error?.response?.status || 500;
    const message =
      error?.response?.data?.message || error?.message || "Error al obtener diccionario";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request) {
  try {
    const accessToken = await getAccessTokenForWrite(request);
    if (!isLocalAuthBypassEnabled() && !accessToken) {
      return NextResponse.json({ error: "Acceso no autorizado" }, { status: 401 });
    }
    const body = await request.json();
    const data = await proxyPost(`${apiUrl}/categories/dictionary`, body, { accessToken });
    return NextResponse.json(data);
  } catch (error) {
    const status = error?.response?.status || 500;
    const message = getUpstreamErrorMessage(error, "Error al agregar mapeo");
    return NextResponse.json({ error: message }, { status });
  }
}
