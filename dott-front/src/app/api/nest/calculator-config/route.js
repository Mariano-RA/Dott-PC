import { NextResponse } from "next/server";
import { apiUrl } from "../utils/utils";
import {
  getAccessTokenForWrite,
  getUpstreamErrorMessage,
  isLocalAuthBypassEnabled,
  proxyGet,
  proxyPost,
} from "../_shared/upstream";

export async function GET() {
  try {
    const settings = await proxyGet(`${apiUrl}/calculator-settings`, {
      headers: { "content-type": "application/json" },
    });

    return NextResponse.json({ settings }, { status: 200 });
  } catch (error) {
    console.error("Error en GET calculator-config:", error?.response?.data || error.message);
    return NextResponse.json({ error: "Error al obtener configuración" }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const accessToken = await getAccessTokenForWrite(request);

    if (!isLocalAuthBypassEnabled() && !accessToken) {
      return NextResponse.json({ error: "Acceso no autorizado" }, { status: 401 });
    }

    const body = await request.json();

    const payload = {
      cardFee: body?.cardFee,
      advanceFee: body?.advanceFee,
      vat: body?.vat,
    };
    if (body?.gateways != null && typeof body.gateways === "object") {
      payload.gateways = body.gateways;
    }

    const settings = await proxyPost(`${apiUrl}/calculator-settings`, payload, {
      accessToken,
    });

    return NextResponse.json({ settings }, { status: 200 });
  } catch (error) {
    const message = getUpstreamErrorMessage(error, "Error al guardar configuración");
    const statusCode = error?.response?.status || 500;

    console.error("Error en PUT calculator-config:", error?.response?.data || error.message);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
