import axios from "axios";
import { apiUrl } from "../utils/utils";
import { NextResponse } from "next/server";
import {
  withApiAuthRequired,
  getAccessToken,
  getSession,
} from "@auth0/nextjs-auth0";
import https from "https";
const fs = require("fs");

// const httpsAgent = new https.Agent({
//   rejectUnauthorized: false, // Esto desactiva la verificación del certificado (no recomendado en producción)
//   // Other options for configuring the agent as needed
// });

export async function POST(request) {
  // const { headers } = await request;
  // const precioDolar = await request.json();

  // const accessToken = headers.get("authorization");

  // process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
  // let response = await axios
  //   .post(`${apiUrl}/api/dolar`, {
  //     // httpsAgent: httpsAgent,
  //     headers: {
  //       Authorization: accessToken,
  //     },
  //     body: precioDolar,
  //   })
  //   .then((response) => {
  //     return response.data;
  //   })
  //   .catch((err) => {
  //     return err.response.data;
  //   });
  // process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 1;

  // return NextResponse.json({ response });

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

    const precioDolar = await request.json();

    process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
    const response = await axios.post(
      `${apiUrl}/api/dolar`,
      JSON.stringify(precioDolar),
      config
    );

    console.log(response.data);

    process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 1;
    return NextResponse.json({ response: response.data });
  } catch (error) {
    console.error("Error en la solicitud POST:", error);

    return NextResponse.error("Error en la solicitud POST", 500);
  }
}
