import { NextResponse } from "next/server";
import { apiUrl } from "../../utils/utils";
import {
  getAccessTokenForWrite,
  getUpstreamErrorMessage,
  isLocalAuthBypassEnabled,
  proxyPost,
} from "../../_shared/upstream";

/** POST: dispara la descarga automática del listado desde la web del proveedor. Body opcional: { proveedor?: string }. */
export async function POST(request) {
  try {
    const accessToken = await getAccessTokenForWrite(request);

    if (!isLocalAuthBypassEnabled() && !accessToken) {
      return NextResponse.json({ error: "Acceso no autorizado" }, { status: 401 });
    }

    let body = {};
    try {
      const text = await request.text();
      if (text) body = JSON.parse(text);
    } catch {
      // body vacío o inválido: se envía {} (todos los proveedores)
    }

    const data = await proxyPost(`${apiUrl}/productos/fetch-prices`, body, { accessToken });

    return NextResponse.json({ response: data }, { status: 200 });
  } catch (error) {
    const upstreamStatus = error?.response?.status;
    const upstreamData = error?.response?.data;
    const message = getUpstreamErrorMessage(error, error?.message || "Error al solicitar descarga de listados");

    console.error("Error en POST /productos/fetch-prices:", upstreamData || error);
    return NextResponse.json(
      { error: message },
      { status: upstreamStatus || 500 }
    );
  }
}
