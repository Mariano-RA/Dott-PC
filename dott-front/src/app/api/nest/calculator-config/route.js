import axios from "axios";
import https from "https";
import { NextResponse } from "next/server";
import { getAccessToken, getSession } from "@auth0/nextjs-auth0";
import { apiUrl } from "../utils/utils";

const IS_LOCAL_AUTH_BYPASS =
  process.env.NODE_ENV === "development" && process.env.LOCAL_DEV_AUTH_BYPASS === "true";

const LOCAL_DEV_BEARER_TOKEN = process.env.LOCAL_DEV_AUTH_BEARER_TOKEN || "";

async function getAccessTokenForWrite(request) {
  if (IS_LOCAL_AUTH_BYPASS) {
    return LOCAL_DEV_BEARER_TOKEN;
  }

  try {
    const session = await getSession(request);
    if (session?.accessToken) {
      return session.accessToken;
    }

    const { accessToken } = await getAccessToken(request, new NextResponse(), {
      authorizationParams: {
        audience: process.env.NEXT_PUBLIC_AUDIENCE || "https://be.dott-pc.com.ar",
        scope: "create:tablas offline_access",
      },
    });

    return accessToken || "";
  } catch {
    return "";
  }
}

const agent = new https.Agent({ rejectUnauthorized: false });

export async function GET() {
  try {
    const { data: settings } = await axios.get(`${apiUrl}/calculator-settings`, {
      httpsAgent: agent,
      headers: { "content-type": "application/json" },
    });

    return NextResponse.json({ settings }, { status: 200 });
  } catch (error) {
    console.error("Error en GET calculator-config:", error?.response?.data || error.message);
    return NextResponse.json({ error: "Error al obtener configuración" }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const accessToken = await getAccessTokenForWrite(request);

    if (!IS_LOCAL_AUTH_BYPASS && !accessToken) {
      return NextResponse.json({ error: "Acceso no autorizado" }, { status: 401 });
    }

    const body = await request.json();

    const { data: settings } = await axios.post(
      `${apiUrl}/calculator-settings`,
      {
        cardFee: body?.cardFee,
        advanceFee: body?.advanceFee,
        vat: body?.vat,
      },
      {
        httpsAgent: agent,
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      }
    );

    return NextResponse.json({ settings }, { status: 200 });
  } catch (error) {
    const message =
      error?.response?.data?.message || error?.response?.data?.error || "Error al guardar configuración";
    const statusCode = error?.response?.status || 500;

    console.error("Error en PUT calculator-config:", error?.response?.data || error.message);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
