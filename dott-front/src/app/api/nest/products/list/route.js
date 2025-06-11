import { NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { apiUrl } from "../../utils/utils";
import axios from "axios";
import https from "https";

const agent = new https.Agent({
  rejectUnauthorized: false,
});

export async function GET(req) {
  try {
    const skip = req.nextUrl.searchParams.get("skip");
    const take = req.nextUrl.searchParams.get("take");
    const orderBy = req.nextUrl.searchParams.get("orderBy");


    if (!skip || !take) {
      return NextResponse.json(
        { error: "Parámetros requeridos faltantes (skip, take)" },
        { status: 400 }
      );
    }

    // Realizar la solicitud GET
    const { data: response } = await axios.get(
          `${apiUrl}/productos`,
          {
            httpsAgent: agent,
            headers: {
              "content-type": "application/json",
            },
            params: { skip, take, orderBy },
          }
        );

    return NextResponse.json({ response }, { status: 200 });
  } catch (error) {
    console.error("Error en GET /productos:", error?.response?.data || error.message);
    return NextResponse.json(
      { error: "Error al buscar productos" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getSession(request, null, {
      authorizationParams: {
        scope: "create:tablas offline_access",
      },
    });

    if (!session || !session.accessToken) {
      return NextResponse.json({ error: "Acceso no autorizado" }, { status: 401 });
    }

    const datoRequest = await request.json();
    const config = {
      httpsAgent: agent,
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + accessToken,
      },
    };

    // Realizar la solicitud POST
    const { data } = await axios.post(`${apiUrl}/productos`, datoRequest, config);

    return NextResponse.json({ response: data }, { status: 200 });
  } catch (error) {
    console.error("Error en la solicitud POST:", error);
    return NextResponse.json(
      { error: "Error al crear el producto" },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const session = await getSession(request, null, {
      authorizationParams: {
        scope: "create:tablas offline_access",
      },
    });

    if (!session || !session.accessToken) {
      return NextResponse.json({ error: "Acceso no autorizado" }, { status: 401 });
    }

    const { proveedor } = await request.json();

    const config = {
      httpsAgent: agent,
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + session.accessToken,
      },
    };

    const { data } = await axios.delete(
      `${apiUrl}/productos/${encodeURIComponent(proveedor)}`,
      config
    );

    return NextResponse.json({ response: data }, { status: 200 });
  } catch (error) {
    console.error("Error en la solicitud DELETE:", error.response?.data || error.message);
    return NextResponse.json(
      { error: "Error al eliminar el producto" },
      { status: 500 }
    );
  }
}
