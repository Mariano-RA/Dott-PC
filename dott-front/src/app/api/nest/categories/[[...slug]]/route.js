export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { apiUrl } from "../../utils/utils";
import {
  getAccessTokenForWrite,
  getUpstreamErrorMessage,
  isLocalAuthBypassEnabled,
  proxyDelete,
  proxyGet,
  proxyPost,
} from "../../_shared/upstream";

/** Proxy a /categories/new, /categories/dictionary o /categories/sql/master según el segmento. */
export async function GET(request, context) {
  const slug = context.params?.slug || [];
  const segment = slug[0]; // "new" | "dictionary" | "sql"

  if (segment === "new") {
    try {
      const data = await proxyGet(`${apiUrl}/categories/new`);
      return NextResponse.json(data);
    } catch (error) {
      const status = error?.response?.status || 500;
      const message = getUpstreamErrorMessage(error, "Error al obtener categorías nuevas");
      return NextResponse.json({ error: message }, { status });
    }
  }

  if (segment === "dictionary" && slug[1] === "export") {
    try {
      // Necesitamos headers upstream para Content-Disposition, así que usamos axios directo con el mismo agent centralizado.
      const axiosModule = (await import("axios")).default;
      const { getHttpsAgent } = await import("../../_shared/upstream");
      const res = await axiosModule.get(`${apiUrl}/categories/dictionary/export`, { httpsAgent: getHttpsAgent() });
      const nextRes = NextResponse.json(res.data);
      if (res.headers?.["content-disposition"]) {
        nextRes.headers.set("Content-Disposition", res.headers["content-disposition"]);
      }
      return nextRes;
    } catch (error) {
      const status = error?.response?.status || 500;
      const message = getUpstreamErrorMessage(error, "Error al exportar");
      return NextResponse.json({ error: message }, { status });
    }
  }

  if (segment === "dictionary") {
    try {
      const data = await proxyGet(`${apiUrl}/categories/dictionary`);
      return NextResponse.json(data);
    } catch (error) {
      const status = error?.response?.status || 500;
      const message = getUpstreamErrorMessage(error, "Error al obtener diccionario");
      return NextResponse.json({ error: message }, { status });
    }
  }

  if (segment === "sql" && slug[1] === "master-tree") {
    try {
      const data = await proxyGet(`${apiUrl}/categories/sql/master-tree`);
      return NextResponse.json(data);
    } catch (error) {
      const status = error?.response?.status || 500;
      const message = getUpstreamErrorMessage(error, "Error al obtener árbol de categorías");
      return NextResponse.json({ error: message }, { status });
    }
  }

  if (segment === "sql" && slug[1] === "master-flat") {
    try {
      const data = await proxyGet(`${apiUrl}/categories/sql/master-flat`);
      return NextResponse.json(data);
    } catch (error) {
      const status = error?.response?.status || 500;
      const message = getUpstreamErrorMessage(error, "Error al obtener lista de subcategorías");
      return NextResponse.json({ error: message }, { status });
    }
  }

  if (segment === "sql" && slug[1] === "master") {
    try {
      const data = await proxyGet(`${apiUrl}/categories/sql/master`);
      return NextResponse.json(data);
    } catch (error) {
      const status = error?.response?.status || 500;
      const message = getUpstreamErrorMessage(error, "Error al obtener categorías maestras");
      return NextResponse.json({ error: message }, { status });
    }
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function POST(request, context) {
  const slug = context.params?.slug || [];
  if (slug[0] !== "dictionary") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  try {
    const accessToken = await getAccessTokenForWrite(request);
    if (!isLocalAuthBypassEnabled() && !accessToken) {
      return NextResponse.json({ error: "Acceso no autorizado" }, { status: 401 });
    }
    const body = await request.json();
    const data = await proxyPost(`${apiUrl}/categories/dictionary`, body, { accessToken });
    return NextResponse.json(data);
  } catch (error) {
    const status = error?.response?.status || 500;
    const message = getUpstreamErrorMessage(error, "Error al agregar mapeo");
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request, context) {
  const slug = context.params?.slug || [];
  if (slug[0] !== "new") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  try {
    const accessToken = await getAccessTokenForWrite(request);
    if (!isLocalAuthBypassEnabled() && !accessToken) {
      return NextResponse.json({ error: "Acceso no autorizado" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const proveedor = searchParams.get("proveedor") || "";
    const categoriaRaw = searchParams.get("categoriaRaw") || "";
    const data = await proxyDelete(`${apiUrl}/categories/new`, {
      accessToken,
      params: { proveedor, categoriaRaw },
    });
    return NextResponse.json(data);
  } catch (error) {
    const status = error?.response?.status || 500;
    const message = getUpstreamErrorMessage(error, "Error al descartar");
    return NextResponse.json({ error: message }, { status });
  }
}
