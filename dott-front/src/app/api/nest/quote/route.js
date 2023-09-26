import axios from "axios";
import { apiUrl } from "../utils/utils";
import { NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";

export async function GET() {
  process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
  const cuotas = await axios
    .get(`${apiUrl}/api/cuota`, {
      headers: {
        "content-type": "application/json",
      },
    })
    .then((response) => {
      return response.data;
    });

  process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 1;
  return NextResponse.json({ cuotas });
}

export async function POST(request) {
  try {
    const { accessToken } = await getSession(request, null, {
      authorizationParams: {
        scope: "create:tablas offline_access",
      },
    });

    const config = {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + accessToken,
      },
    };

    const datosCuotas = await request.json();

    process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
    const response = await axios.post(
      `${apiUrl}/api/cuota`,
      datosCuotas.arrayCuotas,
      config
    );

    process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 1;
    return NextResponse.json({ response: response.data });
  } catch (error) {
    console.error("Error en la solicitud POST:", error);

    return NextResponse.error("Error en la solicitud POST", 500);
  }
}
