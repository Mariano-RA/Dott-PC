export const dynamic = "force-dynamic";

import axios from "axios";
import https from "https";
import { NextResponse } from "next/server";
import { apiUrl } from "../utils/utils";

const agent = new https.Agent({
  rejectUnauthorized: false,
});

export async function GET() {
  try {
    const categorys = await axios.get(`${apiUrl}/productos/categorias`, {
      httpsAgent: agent,
    });

    return NextResponse.json({ categorys: categorys.data });
  } catch (error) {
    console.error("Error al obtener categorías:", error);
    return NextResponse.json({ error: "No se pudieron obtener las categorías" }, { status: 500 });
  }
}
