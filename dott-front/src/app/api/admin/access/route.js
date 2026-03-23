import { NextResponse } from "next/server";

import { getAccessTokenForWrite, isLocalAuthBypassEnabled } from "@/app/api/nest/_shared/upstream";
import { canAccessAdmin } from "@/lib/auth0Roles";

/** Payload del JWT (access token); los permisos RBAC suelen ir aquí, no en el perfil de useUser(). */
function decodeJwtPayload(accessToken) {
  if (!accessToken || typeof accessToken !== "string") return null;
  try {
    const parts = accessToken.split(".");
    if (parts.length < 2) return null;
    const payload = parts[1];
    const json = Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export async function GET(request) {
  try {
    if (isLocalAuthBypassEnabled()) {
      return NextResponse.json({ allowed: true });
    }

    const { accessToken } = await getAccessTokenForWrite(request);
    if (!accessToken) {
      return NextResponse.json({ allowed: false });
    }

    const payload = decodeJwtPayload(accessToken);
    const allowed = payload ? canAccessAdmin(payload) : false;
    return NextResponse.json({ allowed });
  } catch (error) {
    console.error("[api/admin/access]", error);
    return NextResponse.json({ allowed: false });
  }
}
