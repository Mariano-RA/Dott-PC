import {
  withApiAuthRequired,
  getAccessToken,
  getSession,
} from "@auth0/nextjs-auth0";
import { NextResponse } from "next/server";

const GET = withApiAuthRequired(async (req, res) => {
  try {
    const { accessToken } = await getSession(req, res, {
      authorizationParams: {
        scope: "create:tablas",
      },
    });

    return NextResponse.json({ token: accessToken });
  } catch (error) {
    const message = "Something went wrong";

    return NextResponse.json(message, { status: 500 });
  }
});

export { GET };
