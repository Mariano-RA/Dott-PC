import axios from "axios";
import https from "https";
import { apiUrl } from "../utils/utils";
import { NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";

const agent = new https.Agent({
  rejectUnauthorized: false,
});

export async function GET() {
  try {
    const { data: cuotas } = await axios.get(`${apiUrl}/cuota`, {
      httpsAgent: agent,
      headers: { "content-type": "application/json" },
    });

    return NextResponse.json({ cuotas }, { status: 200 });
  } catch (error) {
    console.error("Error en GET cuotas:", error?.response?.data || error.message);
    return NextResponse.json({ error: "Error al obtener cuotas" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { accessToken } = await getSession(request, null, {
      authorizationParams: {
        scope: "create:tablas offline_access",
      },
    });

    const datosCuotas = await request.json();

    const config = {
      httpsAgent: agent,
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + accessToken,
      },
    };

    const { data } = await axios.post(
      `${apiUrl}/cuota`,
      datosCuotas.arrayCuotas,
      config
    );

    return NextResponse.json({ response: data }, { status: 200 });
  } catch (error) {
    console.error("Error en POST cuotas:", error?.response?.data || error.message);
    return NextResponse.json(
      { error: "Error en la solicitud POST" },
      { status: 500 }
    );
  }
}
