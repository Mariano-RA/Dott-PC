import axios from "axios";
import { NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { apiUrl } from "../../utils/utils";
import { error } from "console";

export async function GET(req) {
  const skip = req.nextUrl.searchParams.get("skip");
  const take = req.nextUrl.searchParams.get("take");
  const orderBy = req.nextUrl.searchParams.get("orderBy");
  process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
  const response = await axios
    .get(`${apiUrl}/productos?skip=${skip}&take=${take}&orderBy=${orderBy}`, {
      headers: {
        "content-type": "application/json",
      },
    })
    .then((response) => {
      return response.data;
    });
  process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 1;
  return NextResponse.json({ response });
}

export async function POST(request) {
  try {
    const { accessToken } = await getSession(request, null, {
      authorizationParams: {
        scope: "create:tablas offline_access",
      },
    });

    const datoRequest = await request.json();

    const config = {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + accessToken,
      },
    };

    process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
    const response = await axios
      .post(`${apiUrl}/productos`, datoRequest, config)
      .then((response) => {
        return response.data;
      });

    process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 1;

    return NextResponse.json({ response });
  } catch (error) {
    return NextResponse.error("Error en la solicitud POST", error);
  }
}

export async function DELETE(request) {
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

    const proveedor = await request.json();

    process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
    const response = await axios.post(
      `${apiUrl}/productos/delete`,
      proveedor,
      config
    ).then(response => {return response.data});

    process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 1;
    
    return NextResponse.json({ response});
  } catch (error) {
    console.error("Error en la solicitud DELETE:", error);
    return NextResponse.error("Error en la solicitud DELETE", 500);
  }
}