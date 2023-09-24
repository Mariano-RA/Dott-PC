import { NextResponse } from "next/server";
import { apiUrl } from "../../utils/utils";
import axios from "axios";

const https = require("https");

const agent = new https.Agent({
  rejectUnauthorized: false,
});

export async function GET(req) {
  const category = req.nextUrl.searchParams.get("category");
  const skip = req.nextUrl.searchParams.get("skip");
  const take = req.nextUrl.searchParams.get("take");
  const orderBy = req.nextUrl.searchParams.get("orderBy");

  let response = await axios
    .get(
      `${apiUrl}/api/productos/categoria?category=${category}&skip=${skip}&take=${take}&orderBy=${orderBy}`,
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
