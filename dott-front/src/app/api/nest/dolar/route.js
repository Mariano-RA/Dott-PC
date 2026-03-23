import { apiUrl } from "../utils/utils";
import { NextResponse } from "next/server";
import {
  finalizeResponse,
  getAccessTokenForWrite,
  getUpstreamErrorMessage,
  isLocalAuthBypassEnabled,
  proxyDelete,
  proxyGet,
  proxyPost,
} from "../_shared/upstream";

export async function GET() {
  try {
    const dolar = await proxyGet(`${apiUrl}/dolar`, {
      headers: { "content-type": "application/json" },
    });
    return NextResponse.json({ dolar }, { status: 200 });
  } catch (error) {
    console.error("Error en GET /dolar:", error?.response?.data || error.message);
    return NextResponse.json(
      { error: "Error al obtener el valor del dólar" },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const params = {
      proveedor: body?.proveedor || undefined,
      limit: body?.limit || 100,
    };

    const history = await proxyGet(`${apiUrl}/dolar/history`, {
      headers: { "content-type": "application/json" },
      params,
    });

    return NextResponse.json({ history }, { status: 200 });
  } catch (error) {
    console.error("Error en PATCH /dolar history:", error?.response?.data || error.message);
    return NextResponse.json(
      { error: "Error al obtener historial del dólar" },
      { status: 500 }
    );
  }
}

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

    const datosDolar = await request.json();

    const response = await proxyPost(`${apiUrl}/dolar`, datosDolar.arrayDolar, {
      accessToken,
    });

    return finalizeResponse(cookieJar, NextResponse.json({ response }, { status: 200 }));
  } catch (error) {
    console.error("Error en POST /dolar:", error?.response?.data || error.message);
    const upstreamStatus = error?.response?.status || 500;
    const message = getUpstreamErrorMessage(error, "Error en la solicitud POST");
    return finalizeResponse(
      cookieJar,
      NextResponse.json({ error: message }, { status: upstreamStatus })
    );
  }
}

export async function PUT(request) {
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
    const proveedor = body?.proveedor;

    if (!proveedor) {
      return finalizeResponse(
        cookieJar,
        NextResponse.json({ error: "Proveedor es requerido" }, { status: 400 })
      );
    }

    if (!body?.precioDolar || Number(body.precioDolar) <= 0) {
      return finalizeResponse(
        cookieJar,
        NextResponse.json({ error: "Precio del dólar inválido" }, { status: 400 })
      );
    }

    const response = await proxyPost(
      `${apiUrl}/dolar/${encodeURIComponent(proveedor)}`,
      {
        precioDolar: body?.precioDolar,
        fechaVigencia: body?.fechaVigencia,
        usuario: body?.usuario,
        motivo: body?.motivo,
      },
      { accessToken }
    );

    return finalizeResponse(cookieJar, NextResponse.json({ response }, { status: 200 }));
  } catch (error) {
    console.error("Error en PUT /dolar:", error?.response?.data || error.message);
    const errorMessage = getUpstreamErrorMessage(error, error?.message || "Error al guardar proveedor");
    return finalizeResponse(
      cookieJar,
      NextResponse.json({ error: errorMessage }, { status: error?.response?.status || 500 })
    );
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

    const body = await request.json();
    const proveedor = String(body?.proveedor || "").trim();

    if (!proveedor) {
      return finalizeResponse(
        cookieJar,
        NextResponse.json({ error: "Proveedor es requerido" }, { status: 400 })
      );
    }

    const response = await proxyDelete(`${apiUrl}/dolar/${encodeURIComponent(proveedor)}`, {
      accessToken,
    });

    return finalizeResponse(cookieJar, NextResponse.json({ response }, { status: 200 }));
  } catch (error) {
    console.error("Error en DELETE /dolar:", error?.response?.data || error.message);
    const upstreamStatus = error?.response?.status || 500;
    const message = getUpstreamErrorMessage(error, "Error al borrar proveedor");
    return finalizeResponse(cookieJar, NextResponse.json({ error: message }, { status: upstreamStatus }));
  }
}
