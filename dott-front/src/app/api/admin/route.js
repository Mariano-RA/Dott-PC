import { NextResponse } from "next/server";

import { auth0 } from "@/lib/auth0";

const IS_LOCAL_AUTH_BYPASS =
  process.env.NODE_ENV === "development" && process.env.LOCAL_DEV_AUTH_BYPASS === "true";

const LOCAL_DEV_BEARER_TOKEN = process.env.LOCAL_DEV_BEARER_TOKEN || "";

if (IS_LOCAL_AUTH_BYPASS) {
  console.warn("[auth] LOCAL_DEV_AUTH_BYPASS habilitado en /api/admin");
}

export async function GET(request) {
  try {
    if (IS_LOCAL_AUTH_BYPASS) {
      return NextResponse.json({ token: LOCAL_DEV_BEARER_TOKEN }, { status: 200 });
    }

    const session = await auth0.getSession(request);
    const token = session?.tokenSet?.accessToken;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ token });
  } catch (error) {
    console.error("[api/admin] GET", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
