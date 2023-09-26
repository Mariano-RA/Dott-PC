import axios from "axios";
import { NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { apiPythonUrl, apiUrl } from "../../utils/utils";

export async function GET(req) {
  const skip = req.nextUrl.searchParams.get("skip");
  const take = req.nextUrl.searchParams.get("take");
  const orderBy = req.nextUrl.searchParams.get("orderBy");
  process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
  const response = await axios
    .get(
      `${apiUrl}/api/productos?skip=${skip}&take=${take}&orderBy=${orderBy}`,
      {
        headers: {
          "content-type": "application/json",
        },
      }
    )
    .then((response) => {
      return response.data;
    });
  process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 1;
  return NextResponse.json({ response });
}

export async function POST(request) {
  const formData = await request.formData();
  const file = formData.get("file");
  const proveedor = formData.get("proveedor");
  console.log(proveedor);

  try {
    const { accessToken } = await getSession(request, null, {
      authorizationParams: {
        scope: "create:tablas offline_access",
      },
    });

    const config = {
      headers: {
        Authorization: "Bearer " + accessToken,
      },
    };

    process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
    const response = await axios.post(
      `${apiPythonUrl}/procesar_archivo_${proveedor}`,
      file,
      config
    );

    process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 1;
    return NextResponse.json({ response: response.data });
  } catch (error) {
    console.error("Error en la solicitud POST:", error);

    return NextResponse.error("Error en la solicitud POST", 500);
  }
}
