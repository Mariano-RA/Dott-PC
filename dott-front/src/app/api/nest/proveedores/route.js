import axios from "axios";
import https from "https";
import { apiUrl } from "../utils/utils";
import { NextResponse } from "next/server";
import { getAccessToken, getSession } from "@auth0/nextjs-auth0";

const IS_LOCAL_AUTH_BYPASS =
  process.env.NODE_ENV === "development" && process.env.LOCAL_DEV_AUTH_BYPASS === "true";

const LOCAL_DEV_BEARER_TOKEN = process.env.LOCAL_DEV_AUTH_BEARER_TOKEN || "";

async function getAccessTokenForWrite(request) {
  if (IS_LOCAL_AUTH_BYPASS) {
    return LOCAL_DEV_BEARER_TOKEN;
  }

  try {
    // 1) Try session token first (fast path when already present in appSession).
    const session = await getSession(request);
    if (session?.accessToken) {
      return session.accessToken;
    }

    // 2) Fallback to SDK token resolver for App Router handlers.
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

// Contrato backend: POST /proveedores body { nombre: string, activo?: boolean }
function normalizeProveedorBody(body) {
  const nombre = body?.nombre ?? body?.proveedor;
  if (nombre == null || String(nombre).trim() === "") return null;
  return {
    nombre: String(nombre).trim().toLowerCase(),
    ...(body?.activo !== undefined && { activo: Boolean(body.activo) }),
  };
}

function getBackendErrorMessage(error, fallback) {
  const data = error?.response?.data;
  if (!data) return fallback;
  const msg = data.message ?? data.error;
  if (Array.isArray(msg)) return msg.join("; ");
  if (typeof msg === "string" && msg) return msg;
  return fallback;
}

export async function POST(request) {
  try {
    const accessToken = await getAccessTokenForWrite(request);

    if (!IS_LOCAL_AUTH_BYPASS && !accessToken) {
      return NextResponse.json({ error: "Acceso no autorizado" }, { status: 401 });
    }

    let body = {};
    try {
      body = await request.json();
    } catch {
      // body vacío o ya consumido
    }
    const payload = normalizeProveedorBody(body);

    if (!payload) {
      return NextResponse.json({ error: "Nombre es requerido" }, { status: 400 });
    }

    const { data: response } = await axios.post(
      `${apiUrl}/proveedores`,
      payload,
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
    const errorMessage = getBackendErrorMessage(error, "Error al crear proveedor");
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
    const errorMessage = getBackendErrorMessage(error, "Error al actualizar proveedor");
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
    const errorMessage = getBackendErrorMessage(error, "Error al eliminar proveedor");
    return NextResponse.json({ error: errorMessage }, { status: error?.response?.status || 500 });
  }
}
