import { apiUrl } from "../utils/utils";
import { NextResponse } from "next/server";
import {
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
  try {
    const accessToken = await getAccessTokenForWrite(request);

    if (!isLocalAuthBypassEnabled() && !accessToken) {
      return NextResponse.json({ error: "Acceso no autorizado" }, { status: 401 });
    }

    const datosDolar = await request.json();

    const response = await proxyPost(`${apiUrl}/dolar`, datosDolar.arrayDolar, {
      accessToken,
    });

    return NextResponse.json({ response }, { status: 200 });
  } catch (error) {
    console.error("Error en POST /dolar:", error?.response?.data || error.message);
    const upstreamStatus = error?.response?.status || 500;
    const message = getUpstreamErrorMessage(error, "Error en la solicitud POST");
    return NextResponse.json(
      { error: message },
      { status: upstreamStatus }
    );
  }
}

export async function PUT(request) {
  try {
    const accessToken = await getAccessTokenForWrite(request);

    if (!isLocalAuthBypassEnabled() && !accessToken) {
      return NextResponse.json({ error: "Acceso no autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const proveedor = body?.proveedor;

    if (!proveedor) {
      return NextResponse.json({ error: "Proveedor es requerido" }, { status: 400 });
    }

    if (!body?.precioDolar || Number(body.precioDolar) <= 0) {
      return NextResponse.json({ error: "Precio del dólar inválido" }, { status: 400 });
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

    return NextResponse.json({ response }, { status: 200 });
  } catch (error) {
    console.error("Error en PUT /dolar:", error?.response?.data || error.message);
    const errorMessage = getUpstreamErrorMessage(error, error?.message || "Error al guardar proveedor");
    return NextResponse.json({ error: errorMessage }, { status: error?.response?.status || 500 });
  }
}

export async function DELETE(request) {
  try {
    const accessToken = await getAccessTokenForWrite(request);

    if (!isLocalAuthBypassEnabled() && !accessToken) {
      return NextResponse.json({ error: "Acceso no autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const proveedor = String(body?.proveedor || "").trim();

    if (!proveedor) {
      return NextResponse.json({ error: "Proveedor es requerido" }, { status: 400 });
    }

    const response = await proxyDelete(`${apiUrl}/dolar/${encodeURIComponent(proveedor)}`, {
      accessToken,
    });

    return NextResponse.json({ response }, { status: 200 });
  } catch (error) {
    console.error("Error en DELETE /dolar:", error?.response?.data || error.message);
    const upstreamStatus = error?.response?.status || 500;
    const message = getUpstreamErrorMessage(error, "Error al borrar proveedor");
    return NextResponse.json({ error: message }, { status: upstreamStatus });
  }
}
