import { NextResponse } from "next/server";
import { apiUrl } from "../../utils/utils";
import axios from "axios";

export async function GET(req) {
  const category = req.nextUrl.searchParams.get("category");
  const skip = req.nextUrl.searchParams.get("skip");
  const take = req.nextUrl.searchParams.get("take");
  const orderBy = req.nextUrl.searchParams.get("orderBy");

  process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
  let response = await axios
    .get(
      `${apiUrl}/api/productos/categoria?category=${category}&skip=${skip}&take=${take}&orderBy=${orderBy}`,
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
