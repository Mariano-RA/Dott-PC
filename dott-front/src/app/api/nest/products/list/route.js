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
        audience: process.env.NEXT_PUBLIC_AUDIENCE || "https://be.dott-pc.com.ar",
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
    const { data: response } = await axios.get(
          `${apiUrl}/productos`,
          {
            httpsAgent: agent,
            headers: {
              "content-type": "application/json",
            },
            params: { skip, take, orderBy, proveedor },
          }
        );

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
  try {
    const accessToken = await getAccessTokenForWrite(request);

    if (!IS_LOCAL_AUTH_BYPASS && !accessToken) {
      return NextResponse.json({ error: "Acceso no autorizado" }, { status: 401 });
    }

    const datoRequest = await request.json();
    const config = {
      httpsAgent: agent,
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: "Bearer " + accessToken } : {}),
      },
    };

    // Realizar la solicitud POST
    const { data } = await axios.post(`${apiUrl}/productos`, datoRequest, config);

    return NextResponse.json({ response: data }, { status: 200 });
  } catch (error) {
    const upstreamStatus = error?.response?.status;
    const upstreamData = error?.response?.data;
    const message =
      upstreamData?.message ||
      upstreamData?.error ||
      error?.message ||
      "Error al crear el producto";

    console.error("Error en la solicitud POST:", upstreamData || error);
    return NextResponse.json(
      { error: message },
      { status: upstreamStatus || 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const accessToken = await getAccessTokenForWrite(request);

    if (!IS_LOCAL_AUTH_BYPASS && !accessToken) {
      return NextResponse.json({ error: "Acceso no autorizado" }, { status: 401 });
    }

    const { proveedor } = await request.json();

    if (!proveedor) {
      return NextResponse.json({ error: "Proveedor es requerido" }, { status: 400 });
    }

    const config = {
      httpsAgent: agent,
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: "Bearer " + accessToken } : {}),
      },
    };

    const { data } = await axios.delete(
      `${apiUrl}/productos/${encodeURIComponent(proveedor)}`,
      config
    );

    return NextResponse.json({ response: data }, { status: 200 });
  } catch (error) {
    console.error("Error en la solicitud DELETE:", error?.response?.data || error.message);
    const upstreamStatus = error?.response?.status || 500;
    const message = error?.response?.data?.message || error?.response?.data?.error || "Error al eliminar el producto";
    return NextResponse.json(
      { error: message },
      { status: upstreamStatus }
    );
  }
}
