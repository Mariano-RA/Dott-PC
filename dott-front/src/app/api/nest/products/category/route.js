import { NextResponse } from "next/server";
import { apiUrl } from "../../utils/utils";
import axios from "axios";
import https from "https";

const agent = new https.Agent({ rejectUnauthorized: false });

export async function GET(req) {
  try {
    const category = req.nextUrl.searchParams.get("category");
    const skip = req.nextUrl.searchParams.get("skip");
    const take = req.nextUrl.searchParams.get("take");
    const orderBy = req.nextUrl.searchParams.get("orderBy");
    const proveedor = req.nextUrl.searchParams.get("proveedor");

    if (!category || !skip || !take) {
      return NextResponse.json(
        { error: "Faltan parámetros obligatorios (category, skip, take)" },
        { status: 400 }
      );
    }

    const { data: response } = await axios.get(
      `${apiUrl}/productos/categoria`,
      {
        httpsAgent: agent,
        headers: {
          "content-type": "application/json",
        },
        params: {
          category,
          skip,
          take,
          orderBy,
          proveedor
        },
      }
    );

    return NextResponse.json({ response }, { status: 200 });
  } catch (error) {
    console.error("Error en GET /productos/categoria:", error?.response?.data || error.message);
    return NextResponse.json(
      { error: "Error al obtener productos por categoría" },
      { status: 500 }
    );
  }
}
