import axios from "axios";
import https from "https";
import { apiUrl } from "../utils/utils";
import { NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";

const agent = new https.Agent({ rejectUnauthorized: false });

export async function GET() {
  try {
    const { data: dolar } = await axios.get(`${apiUrl}/dolar`, {
      httpsAgent: agent,
      headers: { "content-type": "application/json" },
    });

    return NextResponse.json({ dolar }, { status: 200 });
  } catch (error) {
    console.error("Error en GET /dolar:", error?.response?.data || error.message);
    return NextResponse.json(
      { error: "Error al obtener el valor del dólar" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { accessToken } = await getSession(request, null, {
      authorizationParams: {
        scope: "create:tablas offline_access",
      },
    });

    const datosDolar = await request.json();

    const { data: response } = await axios.post(
      `${apiUrl}/dolar`,
      datosDolar.arrayDolar,
      {
        httpsAgent: agent,
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + accessToken,
        },
      }
    );

    return NextResponse.json({ response }, { status: 200 });
  } catch (error) {
    console.error("Error en POST /dolar:", error?.response?.data || error.message);
    return NextResponse.json(
      { error: "Error en la solicitud POST" },
      { status: 500 }
    );
  }
}
