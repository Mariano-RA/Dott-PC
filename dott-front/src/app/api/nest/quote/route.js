import { apiUrl } from "../utils/utils";
import { NextResponse } from "next/server";
import {
  finalizeResponse,
  getAccessTokenForWrite,
  getUpstreamErrorMessage,
  isLocalAuthBypassEnabled,
  proxyDelete,
  proxyGet,
  proxyPost,
} from "../_shared/upstream";

export async function GET() {
  try {
    const plans = await proxyGet(`${apiUrl}/cuota/plans`, {
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
  let cookieJar = null;
  try {
    const auth = await getAccessTokenForWrite(request);
    cookieJar = auth.cookieJar;
    const { accessToken } = auth;
    const body = await request.json();

    const plans = await proxyGet(`${apiUrl}/cuota/plans`, {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      params: { active: body?.active ? "true" : undefined },
    });

    return finalizeResponse(cookieJar, NextResponse.json({ plans }, { status: 200 }));
  } catch (error) {
    console.error("Error en PATCH cuotas/plans:", error?.response?.data || error.message);
    return finalizeResponse(
      cookieJar,
      NextResponse.json({ error: "Error al obtener planes" }, { status: 500 })
    );
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
  let cookieJar = null;
  try {
    const auth = await getAccessTokenForWrite(request);
    cookieJar = auth.cookieJar;
    const { accessToken } = auth;

    if (!isLocalAuthBypassEnabled() && !accessToken) {
      return finalizeResponse(
        cookieJar,
        NextResponse.json({ error: "Acceso no autorizado" }, { status: 401 })
      );
    }

    const body = await request.json();

    const data = await proxyPost(`${apiUrl}/cuota/plans`, body?.plans || [], { accessToken });

    return finalizeResponse(cookieJar, NextResponse.json({ response: data }, { status: 200 }));
  } catch (error) {
    console.error("Error en PUT cuotas/plans:", error?.response?.data || error.message);
    const upstreamStatus = error?.response?.status || 500;
    const message = getUpstreamErrorMessage(error, "Error al guardar planes");
    return finalizeResponse(cookieJar, NextResponse.json({ error: message }, { status: upstreamStatus }));
  }
}

export async function DELETE(request) {
  let cookieJar = null;
  try {
    const auth = await getAccessTokenForWrite(request);
    cookieJar = auth.cookieJar;
    const { accessToken } = auth;

    if (!isLocalAuthBypassEnabled() && !accessToken) {
      return finalizeResponse(
        cookieJar,
        NextResponse.json({ error: "Acceso no autorizado" }, { status: 401 })
      );
    }

    const body = await request.json();
    const planKey = String(body?.planKey || "").trim();

    if (!planKey) {
      return finalizeResponse(
        cookieJar,
        NextResponse.json({ error: "planKey es requerido" }, { status: 400 })
      );
    }

    const data = await proxyDelete(`${apiUrl}/cuota/plans/${encodeURIComponent(planKey)}`, {
      accessToken,
    });

    return finalizeResponse(cookieJar, NextResponse.json({ response: data }, { status: 200 }));
  } catch (error) {
    console.error("Error en DELETE cuotas/plans:", error?.response?.data || error.message);
    const upstreamStatus = error?.response?.status || 500;
    const message = getUpstreamErrorMessage(error, "Error al borrar plan");
    return finalizeResponse(cookieJar, NextResponse.json({ error: message }, { status: upstreamStatus }));
  }
}
