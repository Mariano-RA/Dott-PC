import { NextResponse } from "next/server";
import { apiUrl } from "../../utils/utils";
import axios from "axios";

const https = require("https");

const agent = new https.Agent({
  rejectUnauthorized: false,
});

export async function GET(req) {
  const skip = req.nextUrl.searchParams.get("skip");
  const take = req.nextUrl.searchParams.get("take");
  const orderBy = req.nextUrl.searchParams.get("orderBy");

  const response = await axios
    .get(
      `${apiUrl}/api/productos?skip=${skip}&take=${take}&orderBy=${orderBy}`,
      {
        headers: {
          "content-type": "application/json",
        },
        httpsAgent: agent,
      }
    )
    .then((response) => {
      return response.data;
    });
  return NextResponse.json({ response });
}

export async function POST(req) {
  let config = {
    method: "post",
    url: `${apiPythonUrl}/procesar_archivo_${proveedor}`,
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${accToken}`,
    },
  };
  config.data = formData;
  axios
    .request(config)
    .then((response) => {
      console.log(JSON.stringify(response.data));
    })
    .catch((error) => {
      console.log(error);
    });
}
