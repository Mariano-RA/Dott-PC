import { NextResponse } from "next/server";
import { apiUrl } from "../../utils/utils";
import { proxyGet } from "../../_shared/upstream";

export async function GET(req) {
  try {
    const keywords = req.nextUrl.searchParams.get("keywords");
    const skip = req.nextUrl.searchParams.get("skip");
    const take = req.nextUrl.searchParams.get("take");
    const orderBy = req.nextUrl.searchParams.get("orderBy");
    const proveedor = req.nextUrl.searchParams.get("proveedor");

    if (!keywords || !skip || !take) {
      return NextResponse.json(
        { error: "Parámetros requeridos faltantes (keywords, skip, take)" },
        { status: 400 }
      );
    }

    const response = await proxyGet(`${apiUrl}/productos/buscarPorPalabrasClaves`, {
      headers: { "content-type": "application/json" },
      params: { keywords, skip, take, orderBy, proveedor },
    });

    return NextResponse.json({ response }, { status: 200 });
  } catch (error) {
    console.error("Error en GET /productos/buscarPorPalabrasClaves:", error?.response?.data || error.message);
    return NextResponse.json(
      { error: "Error al buscar productos por palabras claves" },
      { status: 500 }
    );
  }
}
