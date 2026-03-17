export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { apiUrl } from "../utils/utils";
import { proxyGet } from "../_shared/upstream";

export async function GET() {
  try {
    const categorys = await proxyGet(`${apiUrl}/productos/categorias`);
    return NextResponse.json({ categorys });
  } catch (error) {
    console.error("Error al obtener categorías:", error);
    return NextResponse.json({ error: "No se pudieron obtener las categorías" }, { status: 500 });
  }
}
