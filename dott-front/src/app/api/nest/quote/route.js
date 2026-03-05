import axios from "axios";
import https from "https";
import { apiUrl } from "../utils/utils";
import { NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";

const IS_LOCAL_AUTH_BYPASS =
  process.env.NODE_ENV === "development" && process.env.LOCAL_DEV_AUTH_BYPASS === "true";

const LOCAL_DEV_BEARER_TOKEN = process.env.LOCAL_DEV_AUTH_BEARER_TOKEN || "";

async function getAccessTokenForWrite(request) {
  if (IS_LOCAL_AUTH_BYPASS) {
    return LOCAL_DEV_BEARER_TOKEN;
  }

  const session = await getSession(request, null, {
    authorizationParams: {
      scope: "create:tablas offline_access",
    },
  });

  return session?.accessToken || "";
}

const agent = new https.Agent({
  rejectUnauthorized: false,
});

export async function GET() {
  try {
    const { data: plans } = await axios.get(`${apiUrl}/cuota/plans`, {
      httpsAgent: agent,
      headers: { "content-type": "application/json" },
      params: { active: "true" },
    });

    return NextResponse.json({ plans }, { status: 200 });
  } catch (error) {
    console.error("Error en GET planes:", error?.response?.data || error.message);
    return NextResponse.json({ error: "Error al obtener planes" }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const accessToken = await getAccessTokenForWrite(request);
    const body = await request.json();

    const { data: plans } = await axios.get(`${apiUrl}/cuota/plans`, {
      httpsAgent: agent,
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: "Bearer " + accessToken } : {}),
      },
      params: { active: body?.active ? "true" : undefined },
    });

    return NextResponse.json({ plans }, { status: 200 });
  } catch (error) {
    console.error("Error en PATCH cuotas/plans:", error?.response?.data || error.message);
    return NextResponse.json({ error: "Error al obtener planes" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    return NextResponse.json(
      { error: "Endpoint legacy deshabilitado. Usar PUT /api/nest/quote con { plans }." },
      { status: 410 }
    );
  } catch (error) {
    console.error("Error en POST quote:", error?.response?.data || error.message);
    return NextResponse.json(
      { error: "Error en la solicitud POST" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const accessToken = await getAccessTokenForWrite(request);
    const body = await request.json();

    const { data } = await axios.post(`${apiUrl}/cuota/plans`, body?.plans || [], {
      httpsAgent: agent,
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: "Bearer " + accessToken } : {}),
      },
    });

    return NextResponse.json({ response: data }, { status: 200 });
  } catch (error) {
    console.error("Error en PUT cuotas/plans:", error?.response?.data || error.message);
    return NextResponse.json({ error: "Error al guardar planes" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const accessToken = await getAccessTokenForWrite(request);
    const body = await request.json();
    const planKey = String(body?.planKey || "").trim();

    const { data } = await axios.delete(`${apiUrl}/cuota/plans/${encodeURIComponent(planKey)}`, {
      httpsAgent: agent,
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: "Bearer " + accessToken } : {}),
      },
    });

    return NextResponse.json({ response: data }, { status: 200 });
  } catch (error) {
    console.error("Error en DELETE cuotas/plans:", error?.response?.data || error.message);
    return NextResponse.json({ error: "Error al borrar plan" }, { status: 500 });
  }
}
