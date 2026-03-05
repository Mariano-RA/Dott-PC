import axios from "axios";
import https from "https";
import { apiUrl } from "../utils/utils";
import { NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";

const IS_LOCAL_AUTH_BYPASS =
  process.env.NODE_ENV === "development" && process.env.LOCAL_DEV_AUTH_BYPASS === "true";

const LOCAL_DEV_BEARER_TOKEN = process.env.LOCAL_DEV_AUTH_BEARER_TOKEN || "";

async function getAccessTokenForWrite(request) {
  if (IS_LOCAL_AUTH_BYPASS) {
    return LOCAL_DEV_BEARER_TOKEN;
  }

  const session = await getSession(request, null, {
    authorizationParams: {
      scope: "create:tablas offline_access",
    },
  });

  return session?.accessToken || "";
}

const agent = new https.Agent({ rejectUnauthorized: false });

export async function GET(request) {
  try {
    const id = request.nextUrl.searchParams.get("id");

    const endpoint = id ? `${apiUrl}/proveedores/${encodeURIComponent(id)}` : `${apiUrl}/proveedores`;

    const { data: proveedores } = await axios.get(endpoint, {
      httpsAgent: agent,
      headers: { "content-type": "application/json" },
    });

    return NextResponse.json({ proveedores }, { status: 200 });
  } catch (error) {
    console.error("Error en GET /proveedores:", error?.response?.data || error.message);
    return NextResponse.json(
      { error: "Error al obtener proveedores" },
      { status: error?.response?.status || 500 }
    );
  }
}

export async function POST(request) {
  try {
    const accessToken = await getAccessTokenForWrite(request);

    if (!IS_LOCAL_AUTH_BYPASS && !accessToken) {
      return NextResponse.json({ error: "Acceso no autorizado" }, { status: 401 });
    }

    const body = await request.json();

    if (!body?.nombre) {
      return NextResponse.json({ error: "Nombre es requerido" }, { status: 400 });
    }

    const { data: response } = await axios.post(
      `${apiUrl}/proveedores`,
      body,
      {
        httpsAgent: agent,
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      }
    );

    return NextResponse.json({ response }, { status: 200 });
  } catch (error) {
    console.error("Error en POST /proveedores:", error?.response?.data || error.message);
    const errorMessage =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      "Error al crear proveedor";
    return NextResponse.json({ error: errorMessage }, { status: error?.response?.status || 500 });
  }
}

export async function PUT(request) {
  try {
    const accessToken = await getAccessTokenForWrite(request);

    if (!IS_LOCAL_AUTH_BYPASS && !accessToken) {
      return NextResponse.json({ error: "Acceso no autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const id = body?.id;

    if (!id) {
      return NextResponse.json({ error: "ID es requerido" }, { status: 400 });
    }

    const { data: response } = await axios.put(
      `${apiUrl}/proveedores/${encodeURIComponent(id)}`,
      body,
      {
        httpsAgent: agent,
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      }
    );

    return NextResponse.json({ response }, { status: 200 });
  } catch (error) {
    console.error("Error en PUT /proveedores:", error?.response?.data || error.message);
    const errorMessage =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      "Error al actualizar proveedor";
    return NextResponse.json({ error: errorMessage }, { status: error?.response?.status || 500 });
  }
}

export async function DELETE(request) {
  try {
    const accessToken = await getAccessTokenForWrite(request);

    if (!IS_LOCAL_AUTH_BYPASS && !accessToken) {
      return NextResponse.json({ error: "Acceso no autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const id = body?.id;

    if (!id) {
      return NextResponse.json({ error: "ID es requerido" }, { status: 400 });
    }

    const { data: response } = await axios.delete(
      `${apiUrl}/proveedores/${encodeURIComponent(id)}`,
      {
        httpsAgent: agent,
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      }
    );

    return NextResponse.json({ response }, { status: 200 });
  } catch (error) {
    console.error("Error en DELETE /proveedores:", error?.response?.data || error.message);
    const errorMessage =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      "Error al eliminar proveedor";
    return NextResponse.json({ error: errorMessage }, { status: error?.response?.status || 500 });
  }
}
