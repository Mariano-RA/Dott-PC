import { apiUrl } from "../utils/utils";
import { NextResponse } from "next/server";
import {
  getAccessTokenForWrite,
  getUpstreamErrorMessage,
  isLocalAuthBypassEnabled,
  proxyDelete,
  proxyGet,
  proxyPost,
  proxyPut,
} from "../_shared/upstream";

export async function GET(request) {
  try {
    const id = request.nextUrl.searchParams.get("id");

    const endpoint = id ? `${apiUrl}/proveedores/${encodeURIComponent(id)}` : `${apiUrl}/proveedores`;

    const proveedores = await proxyGet(endpoint, {
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
  return getUpstreamErrorMessage(error, fallback);
}

export async function POST(request) {
  try {
    const accessToken = await getAccessTokenForWrite(request);

    if (!isLocalAuthBypassEnabled() && !accessToken) {
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

    const response = await proxyPost(`${apiUrl}/proveedores`, payload, { accessToken });

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

    if (!isLocalAuthBypassEnabled() && !accessToken) {
      return NextResponse.json({ error: "Acceso no autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const id = body?.id;

    if (!id) {
      return NextResponse.json({ error: "ID es requerido" }, { status: 400 });
    }

    const response = await proxyPut(`${apiUrl}/proveedores/${encodeURIComponent(id)}`, body, {
      accessToken,
    });

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

    if (!isLocalAuthBypassEnabled() && !accessToken) {
      return NextResponse.json({ error: "Acceso no autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const id = body?.id;

    if (!id) {
      return NextResponse.json({ error: "ID es requerido" }, { status: 400 });
    }

    const response = await proxyDelete(`${apiUrl}/proveedores/${encodeURIComponent(id)}`, {
      accessToken,
    });

    return NextResponse.json({ response }, { status: 200 });
  } catch (error) {
    console.error("Error en DELETE /proveedores:", error?.response?.data || error.message);
    const errorMessage = getBackendErrorMessage(error, "Error al eliminar proveedor");
    return NextResponse.json({ error: errorMessage }, { status: error?.response?.status || 500 });
  }
}
