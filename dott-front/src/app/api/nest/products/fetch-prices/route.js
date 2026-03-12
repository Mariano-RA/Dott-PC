import { NextResponse } from "next/server";
import { getAccessToken, getSession } from "@auth0/nextjs-auth0";
import { apiUrl } from "../../utils/utils";
import axios from "axios";
import https from "https";

const IS_LOCAL_AUTH_BYPASS =
  process.env.NODE_ENV === "development" && process.env.LOCAL_DEV_AUTH_BYPASS === "true";

const LOCAL_DEV_BEARER_TOKEN = process.env.LOCAL_DEV_AUTH_BEARER_TOKEN || "";

async function getAccessTokenForWrite(request) {
  if (IS_LOCAL_AUTH_BYPASS) {
    return LOCAL_DEV_BEARER_TOKEN;
  }

  try {
    const session = await getSession(request);
    if (session?.accessToken) {
      return session.accessToken;
    }

    const { accessToken } = await getAccessToken(request, new NextResponse(), {
      authorizationParams: {
        audience: process.env.AUTH0_AUDIENCE,
        scope: "create:tablas offline_access",
      },
    });

    return accessToken || "";
  } catch {
    return "";
  }
}

const agent = new https.Agent({
  rejectUnauthorized: false,
});

/** POST: dispara la descarga automática del listado desde la web del proveedor. Body opcional: { proveedor?: string }. */
export async function POST(request) {
  try {
    const accessToken = await getAccessTokenForWrite(request);

    if (!IS_LOCAL_AUTH_BYPASS && !accessToken) {
      return NextResponse.json({ error: "Acceso no autorizado" }, { status: 401 });
    }

    let body = {};
    try {
      const text = await request.text();
      if (text) body = JSON.parse(text);
    } catch {
      // body vacío o inválido: se envía {} (todos los proveedores)
    }

    const config = {
      httpsAgent: agent,
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: "Bearer " + accessToken } : {}),
      },
    };

    const { data } = await axios.post(`${apiUrl}/productos/fetch-prices`, body, config);

    return NextResponse.json({ response: data }, { status: 200 });
  } catch (error) {
    const upstreamStatus = error?.response?.status;
    const upstreamData = error?.response?.data;
    const message =
      upstreamData?.message ||
      upstreamData?.error ||
      error?.message ||
      "Error al solicitar descarga de listados";

    console.error("Error en POST /productos/fetch-prices:", upstreamData || error);
    return NextResponse.json(
      { error: message },
      { status: upstreamStatus || 500 }
    );
  }
}
