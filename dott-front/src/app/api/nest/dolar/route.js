import axios from "axios";
import { apiUrl } from "../utils/utils";
import { NextResponse } from "next/server";

import https from "https";
const fs = require("fs");

// const httpsAgent = new https.Agent({
//   rejectUnauthorized: false, // Esto desactiva la verificación del certificado (no recomendado en producción)
//   // Other options for configuring the agent as needed
// });

export async function POST(request) {
  const { headers } = await request;
  const precioDolar = await request.json();

  const accessToken = headers.get("authorization");

  process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
  let response = await axios
    .post(`${apiUrl}/api/dolar`, {
      // httpsAgent: httpsAgent,
      headers: {
        Authorization: accessToken,
      },
      body: precioDolar,
    })
    .then((response) => {
      return response.data;
    });
  return NextResponse.json({ response });
}
