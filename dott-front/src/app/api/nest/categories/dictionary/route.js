export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getAccessToken, getSession } from "@auth0/nextjs-auth0";
import { apiUrl } from "../../utils/utils";
import axios from "axios";
import https from "https";

const agent = new https.Agent({ rejectUnauthorized: false });

const IS_LOCAL_AUTH_BYPASS =
  process.env.NODE_ENV === "development" && process.env.LOCAL_DEV_AUTH_BYPASS === "true";
const LOCAL_DEV_BEARER_TOKEN = process.env.LOCAL_DEV_AUTH_BEARER_TOKEN || "";

async function getAccessTokenForWrite(request) {
  if (IS_LOCAL_AUTH_BYPASS) return LOCAL_DEV_BEARER_TOKEN;
  try {
    const session = await getSession(request);
    if (session?.accessToken) return session.accessToken;
    const { accessToken } = await getAccessToken(request, new NextResponse(), {
      authorizationParams: {
        audience: process.env.AUTH0_AUDIENCE,
        scope: "create:tablas offline_access",
      },
    });
    return accessToken || "";
  } catch {
    return "";
  }
}

export async function GET() {
  try {
    const { data } = await axios.get(`${apiUrl}/categories/dictionary`, { httpsAgent: agent });
    return NextResponse.json(data);
  } catch (error) {
    const status = error?.response?.status || 500;
    const message =
      error?.response?.data?.message || error?.message || "Error al obtener diccionario";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request) {
  try {
    const accessToken = await getAccessTokenForWrite(request);
    if (!IS_LOCAL_AUTH_BYPASS && !accessToken) {
      return NextResponse.json({ error: "Acceso no autorizado" }, { status: 401 });
    }
    const body = await request.json();
    const { data } = await axios.post(`${apiUrl}/categories/dictionary`, body, {
      httpsAgent: agent,
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
    });
    return NextResponse.json(data);
  } catch (error) {
    const status = error?.response?.status || 500;
    const message =
      error?.response?.data?.message || error?.message || "Error al agregar mapeo";
    return NextResponse.json({ error: message }, { status });
  }
}
