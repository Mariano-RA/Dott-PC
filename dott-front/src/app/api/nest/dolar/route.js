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

const agent = new https.Agent({ rejectUnauthorized: false });

export async function GET() {
  try {
    const { data: dolar } = await axios.get(`${apiUrl}/dolar`, {
      httpsAgent: agent,
      headers: { "content-type": "application/json" },
    });

    return NextResponse.json({ dolar }, { status: 200 });
  } catch (error) {
    console.error("Error en GET /dolar:", error?.response?.data || error.message);
    return NextResponse.json(
      { error: "Error al obtener el valor del dólar" },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const params = {
      proveedor: body?.proveedor || undefined,
      limit: body?.limit || 100,
    };

    const { data: history } = await axios.get(`${apiUrl}/dolar/history`, {
      httpsAgent: agent,
      headers: { "content-type": "application/json" },
      params,
    });

    return NextResponse.json({ history }, { status: 200 });
  } catch (error) {
    console.error("Error en PATCH /dolar history:", error?.response?.data || error.message);
    return NextResponse.json(
      { error: "Error al obtener historial del dólar" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const accessToken = await getAccessTokenForWrite(request);

    if (!IS_LOCAL_AUTH_BYPASS && !accessToken) {
      return NextResponse.json({ error: "Acceso no autorizado" }, { status: 401 });
    }

    const datosDolar = await request.json();

    const { data: response } = await axios.post(
      `${apiUrl}/dolar`,
      datosDolar.arrayDolar,
      {
        httpsAgent: agent,
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: "Bearer " + accessToken } : {}),
        },
      }
    );

    return NextResponse.json({ response }, { status: 200 });
  } catch (error) {
    console.error("Error en POST /dolar:", error?.response?.data || error.message);
    const upstreamStatus = error?.response?.status || 500;
    const message = error?.response?.data?.message || error?.response?.data?.error || "Error en la solicitud POST";
    return NextResponse.json(
      { error: message },
      { status: upstreamStatus }
    );
  }
}

export async function PUT(request) {
  try {
    const accessToken = await getAccessTokenForWrite(request);

    if (!IS_LOCAL_AUTH_BYPASS && !accessToken) {
      return NextResponse.json({ error: "Acceso no autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const proveedor = body?.proveedor;

    if (!proveedor) {
      return NextResponse.json({ error: "Proveedor es requerido" }, { status: 400 });
    }

    if (!body?.precioDolar || Number(body.precioDolar) <= 0) {
      return NextResponse.json({ error: "Precio del dólar inválido" }, { status: 400 });
    }

    const { data: response } = await axios.post(
      `${apiUrl}/dolar/${encodeURIComponent(proveedor)}`,
      {
        precioDolar: body?.precioDolar,
        fechaVigencia: body?.fechaVigencia,
        usuario: body?.usuario,
        motivo: body?.motivo,
      },
      {
        httpsAgent: agent,
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: "Bearer " + accessToken } : {}),
        },
      }
    );

    return NextResponse.json({ response }, { status: 200 });
  } catch (error) {
    console.error("Error en PUT /dolar:", error?.response?.data || error.message);
    const errorMessage = error?.response?.data?.message || error?.response?.data?.error || error.message || "Error al guardar proveedor";
    return NextResponse.json({ error: errorMessage }, { status: error?.response?.status || 500 });
  }
}

export async function DELETE(request) {
  try {
    const accessToken = await getAccessTokenForWrite(request);

    if (!IS_LOCAL_AUTH_BYPASS && !accessToken) {
      return NextResponse.json({ error: "Acceso no autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const proveedor = String(body?.proveedor || "").trim();

    if (!proveedor) {
      return NextResponse.json({ error: "Proveedor es requerido" }, { status: 400 });
    }

    const { data: response } = await axios.delete(
      `${apiUrl}/dolar/${encodeURIComponent(proveedor)}`,
      {
        httpsAgent: agent,
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: "Bearer " + accessToken } : {}),
        },
      }
    );

    return NextResponse.json({ response }, { status: 200 });
  } catch (error) {
    console.error("Error en DELETE /dolar:", error?.response?.data || error.message);
    const upstreamStatus = error?.response?.status || 500;
    const message = error?.response?.data?.message || error?.response?.data?.error || "Error al borrar proveedor";
    return NextResponse.json({ error: message }, { status: upstreamStatus });
  }
}
