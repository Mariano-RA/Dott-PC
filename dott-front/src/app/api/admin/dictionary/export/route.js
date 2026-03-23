export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import axios from "axios";
import https from "https";

import { auth0 } from "@/lib/auth0";
import { apiUrl } from "../../../nest/utils/utils";

const agent = new https.Agent({ rejectUnauthorized: false });

const IS_LOCAL_AUTH_BYPASS =
  process.env.NODE_ENV === "development" && process.env.LOCAL_DEV_AUTH_BYPASS === "true";

/** GET: devuelve el JSON de diccionarios desde el backend (mismo formato que diccionarios.json). */
export async function GET(request) {
  if (!IS_LOCAL_AUTH_BYPASS) {
    try {
      const session = await auth0.getSession(request);
      if (!session?.user) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
      }
    } catch {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
  }

  try {
    const res = await axios.get(`${apiUrl}/categories/dictionary/export`, { httpsAgent: agent });
    const nextRes = NextResponse.json(res.data);
    if (res.headers?.["content-disposition"]) {
      nextRes.headers.set("Content-Disposition", res.headers["content-disposition"]);
    }
    return nextRes;
  } catch (error) {
    const status = error?.response?.status || 500;
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      "Error al exportar diccionario";
    return NextResponse.json({ error: message }, { status });
  }
}
