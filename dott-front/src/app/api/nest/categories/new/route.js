export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { apiUrl } from "../../utils/utils";
import {
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
  try {
    const accessToken = await getAccessTokenForWrite(request);
    if (!isLocalAuthBypassEnabled() && !accessToken) {
      return NextResponse.json({ error: "Acceso no autorizado" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const proveedor = searchParams.get("proveedor") || "";
    const categoriaRaw = searchParams.get("categoriaRaw") || "";
    const data = await proxyDelete(`${apiUrl}/categories/new`, {
      accessToken,
      params: { proveedor, categoriaRaw },
    });
    return NextResponse.json(data);
  } catch (error) {
    const status = error?.response?.status || 500;
    const message = getUpstreamErrorMessage(error, "Error al descartar");
    return NextResponse.json({ error: message }, { status });
  }
}
