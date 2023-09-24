import { NextResponse } from "next/server";
import { apiUrl } from "../utils/utils";
import axios from "axios";
const https = require("https");

const agent = new https.Agent({
  rejectUnauthorized: false,
});

export async function GET() {
  const categorys = await axios
    .get(`${apiUrl}/api/productos/categorias`, {
      headers: {
        "content-type": "application/json",
      },
      httpsAgent: agent,
    })
    .then((response) => {
      return response.data;
    });

  return NextResponse.json({ categorys });
}
