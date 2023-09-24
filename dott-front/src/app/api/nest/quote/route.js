import { NextResponse } from "next/server";
import { apiUrl } from "../utils/utils";

import axios from "axios";
const https = require("https");

const agent = new https.Agent({
  rejectUnauthorized: false,
});

export async function GET() {
  const cuotas = await axios
    .get(`${apiUrl}/api/cuota`, {
      headers: {
        "content-type": "application/json",
      },
      httpsAgent: agent,
    })
    .then((response) => {
      return response.data;
    });

  return NextResponse.json({ cuotas });
}

export async function POST(request) {
  const { headers } = await request;
  const { precioDolar } = await request.json();

  const accessToken = headers.get("authorization");
  const valorDolar = precioDolar;

  let config = {
    method: "post",
    url: `${apiUrl}/api/cuota`,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    data: {
      arrCuotas,
    },
  };
  await axios
    .request(config)
    .then((response) => {
      console.log(JSON.stringify(response.data));
    })
    .catch((error) => {
      console.log(error);
    });
}
