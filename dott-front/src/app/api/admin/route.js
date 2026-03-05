import {
  withApiAuthRequired,
  getSession,
} from "@auth0/nextjs-auth0";
import { NextResponse } from "next/server";

const IS_LOCAL_AUTH_BYPASS =
  process.env.NODE_ENV === "development" && process.env.LOCAL_DEV_AUTH_BYPASS === "true";

const LOCAL_DEV_BEARER_TOKEN = process.env.LOCAL_DEV_AUTH_BEARER_TOKEN || "";

if (IS_LOCAL_AUTH_BYPASS) {
  console.warn("[auth] LOCAL_DEV_AUTH_BYPASS habilitado en /api/admin");
}

const getAdminToken = async (req, res) => {
  try {
    if (IS_LOCAL_AUTH_BYPASS) {
      return NextResponse.json({ token: LOCAL_DEV_BEARER_TOKEN }, { status: 200 });
    }

    const { accessToken } = await getSession(req, res, {
      authorizationParams: {
        scope: "create:tablas offline_access",
      },
    });

    return NextResponse.json({ token: accessToken });
  } catch (error) {
    const message = "Something went wrong";

    return NextResponse.json(message, { status: 500 });
  }
};

const GET = IS_LOCAL_AUTH_BYPASS ? getAdminToken : withApiAuthRequired(getAdminToken);

export { GET };
