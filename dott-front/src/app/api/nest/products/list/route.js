import { NextResponse } from "next/server";
import { apiUrl } from "../../utils/utils";
import {
  finalizeResponse,
  getAccessTokenForWrite,
  getUpstreamErrorMessage,
  isLocalAuthBypassEnabled,
  proxyDelete,
  proxyGet,
  proxyPost,
} from "../../_shared/upstream";

export async function GET(req) {
  try {
    const skip = req.nextUrl.searchParams.get("skip");
    const take = req.nextUrl.searchParams.get("take");
    const orderBy = req.nextUrl.searchParams.get("orderBy");
    const proveedor = req.nextUrl.searchParams.get("proveedor");


    if (!skip || !take) {
      return NextResponse.json(
        { error: "Parámetros requeridos faltantes (skip, take)" },
        { status: 400 }
      );
    }

    // Realizar la solicitud GET
    const response = await proxyGet(`${apiUrl}/productos`, {
      headers: { "content-type": "application/json" },
      params: { skip, take, orderBy, proveedor },
    });

    return NextResponse.json({ response }, { status: 200 });
  } catch (error) {
    console.error("Error en GET /productos:", error?.response?.data || error.message);
    return NextResponse.json(
      { error: "Error al buscar productos" },
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

    const datoRequest = await request.json();
    const data = await proxyPost(`${apiUrl}/productos`, datoRequest, { accessToken });

    return finalizeResponse(cookieJar, NextResponse.json({ response: data }, { status: 200 }));
  } catch (error) {
    const upstreamStatus = error?.response?.status;
    const upstreamData = error?.response?.data;
    const message = getUpstreamErrorMessage(error, "Error al crear el producto");

    console.error("Error en la solicitud POST:", upstreamData || error);
    return finalizeResponse(
      cookieJar,
      NextResponse.json({ error: message }, { status: upstreamStatus || 500 })
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

    const { proveedor } = await request.json();

    if (!proveedor) {
      return finalizeResponse(
        cookieJar,
        NextResponse.json({ error: "Proveedor es requerido" }, { status: 400 })
      );
    }

    const data = await proxyDelete(`${apiUrl}/productos/${encodeURIComponent(proveedor)}`, {
      accessToken,
    });

    return finalizeResponse(cookieJar, NextResponse.json({ response: data }, { status: 200 }));
  } catch (error) {
    console.error("Error en la solicitud DELETE:", error?.response?.data || error.message);
    const upstreamStatus = error?.response?.status || 500;
    const message = getUpstreamErrorMessage(error, "Error al eliminar el producto");
    return finalizeResponse(
      cookieJar,
      NextResponse.json({ error: message }, { status: upstreamStatus })
    );
  }
}
