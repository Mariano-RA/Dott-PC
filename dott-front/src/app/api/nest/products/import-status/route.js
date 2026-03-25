import { NextResponse } from "next/server";
import { apiUrl } from "../../utils/utils";
import { proxyGet } from "../../_shared/upstream";

export async function GET(req) {
  try {
    const proveedor = req.nextUrl.searchParams.get("proveedor") || "";
    const response = await proxyGet(`${apiUrl}/productos/import-status`, {
      headers: { "content-type": "application/json" },
      params: { proveedor },
    });
    return NextResponse.json({ response }, { status: 200 });
  } catch (error) {
    const upstreamStatus = error?.response?.status || 500;
    return NextResponse.json({ error: "Error al consultar estado de importación" }, { status: upstreamStatus });
  }
}

