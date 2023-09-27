import axios from "axios";
import { NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { apiPythonUrl, apiUrl } from "../../utils/utils";
import { error } from "console";

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
  try {
    const { accessToken } = await getSession(request, null, {
      authorizationParams: {
        scope: "create:tablas offline_access",
      },
    });

    const formData = await request.formData();
    const file = formData.get("file");
    const proveedor = formData.get("proveedor");

    const formDataToSend = new FormData();
    formDataToSend.append("file", file);

    const config = {
      method: "POST",
      url: `${apiPythonUrl}/procesar_archivo_${proveedor}`,
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: "Bearer " + accessToken,
      },
    };
    config.data = formDataToSend;

    process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
    const response = await axios.request(config);
    process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 1;

    const arrayFormateado = [];

    for (const objeto of response.data) {
      const objetoFormateado = {
        proveedor: objeto.proveedor,
        producto: objeto.producto,
        categoria: objeto.categoria,
        precio: objeto.precio,
      };
      arrayFormateado.push(objetoFormateado);
    }

    const configTest = {
      method: "POST",
      url: `${apiUrl}/api/productos`,
      headers: {
        Authorization: "Bearer " + accessToken,
      },
    };

    configTest.data = arrayFormateado;

    process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
    // const data = await axios
    //   .request(configTest)
    //   .then((response) => {
    //     return response;
    //   })
    //   .catch((error) => {
    //     return error;
    //   });

    const configTestTest = {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + accessToken,
      },
    };
    const datita = await axios.post(
      `${apiUrl}/api/productos`,
      JSON.stringify(arrayFormateado),
      configTestTest
    );
    process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 1;

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.error("Error en la solicitud POST", error);
  }
}
