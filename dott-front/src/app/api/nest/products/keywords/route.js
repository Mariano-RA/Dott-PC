import { NextResponse } from "next/server";
import { apiUrl } from "../../utils/utils";
import axios from "axios";

const https = require("https");

const agent = new https.Agent({
  rejectUnauthorized: false,
});

export async function GET(req) {
  const keywords = req.nextUrl.searchParams.get("keywords");
  const skip = req.nextUrl.searchParams.get("skip");
  const take = req.nextUrl.searchParams.get("take");
  const orderBy = req.nextUrl.searchParams.get("orderBy");
  process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
  const response = await axios
    .get(
      `${apiUrl}/api/productos/buscarPorPalabrasClaves?keywords=${keywords}&skip=${skip}&take=${take}&orderBy=${orderBy}`,
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
