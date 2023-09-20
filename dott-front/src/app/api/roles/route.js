import { withApiAuthRequired, getSession } from "@auth0/nextjs-auth0";
import { NextResponse } from "next/server";

const GET = withApiAuthRequired(async (req, res) => {
  try {
    const { user } = await getSession(req, res, {
      authorizationParams: {
        scope: "create:tablas",
      },
    });
    const roles = user["http://localhost:3000/roles"];

    return NextResponse.json({ roles: roles });
  } catch (error) {
    const message = "Something went wrong";

    return NextResponse.json(message, { status: 500 });
  }
});

export { GET };
