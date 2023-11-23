import { NextResponse } from "next/server";
import { apiUrl } from "../utils/utils";
import axios from "axios";

export async function GET() {
  process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
  let categorys;
  try {
    categorys = await axios
    .get(`${apiUrl}/productos/categorias`)
    .then((response) => {
      return response.data;
    });
  } catch (error) {
    console.log(categorys);
  }
    process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 1;
  return NextResponse.json({ categorys });
}
