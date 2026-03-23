import { Auth0Client } from "@auth0/nextjs-auth0/server";

function stripScheme(host: string) {
  return host.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

/** v4: APP_BASE_URL; compat: AUTH0_BASE_URL */
function resolveAppBaseUrl() {
  const v4 = process.env.APP_BASE_URL?.trim();
  if (v4) return v4;
  const legacy = process.env.AUTH0_BASE_URL?.trim();
  return legacy || undefined;
}

/** v4: AUTH0_DOMAIN sin esquema; compat: AUTH0_ISSUER_BASE_URL */
function resolveDomain() {
  const v4 = process.env.AUTH0_DOMAIN?.trim();
  if (v4) return stripScheme(v4);
  const legacy = process.env.AUTH0_ISSUER_BASE_URL?.trim();
  if (legacy) return stripScheme(legacy);
  return undefined;
}

const audience =
  process.env.AUTH0_AUDIENCE?.trim() ||
  process.env.NEXT_PUBLIC_AUDIENCE?.trim() ||
  undefined;

/**
 * Cliente Auth0 v4 (singleton).
 * Variables: AUTH0_SECRET, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, APP_BASE_URL, AUTH0_DOMAIN
 * (o legado AUTH0_BASE_URL + AUTH0_ISSUER_BASE_URL).
 */
export const auth0 = new Auth0Client({
  domain: resolveDomain(),
  appBaseUrl: resolveAppBaseUrl(),
  authorizationParameters: {
    ...(audience ? { audience } : {}),
    scope: "openid email profile offline_access create:tablas",
    prompt: "login",
  },
});
