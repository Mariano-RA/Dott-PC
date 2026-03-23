/**
 * Roles y permisos expuestos en el perfil de sesión (ID token / user de useUser()).
 *
 * El panel admin y la UI condicionada usan canAccessAdmin(), alineado con la API Nest
 * (permiso create:tablas). El rol "admin" en claims custom sigue siendo válido por compatibilidad.
 *
 * --- Auth0: Post-Login Action (Login flow) ---
 * Sin esto, RBAC suele ir solo al access token y useUser() no verá permisos.
 *
 * exports.onExecutePostLogin = async (event, api) => {
 *   const namespace = "https://be.dott-pc.com.ar/";
 *   const raw = event.authorization?.permissions || [];
 *   const permissions = raw.map((p) =>
 *     typeof p === "string" ? p : p.permission_name
 *   ).filter(Boolean);
 *   api.idToken.setCustomClaim(namespace + "permissions", permissions);
 * };
 *
 * Ajustá el namespace si tu API Identifier en Auth0 es distinto (debe coincidir con NEXT_PUBLIC_AUDIENCE).
 */

/** Mismo permiso que exige el backend para operaciones de carga / tablas. */
export const ADMIN_PANEL_PERMISSION = "create:tablas";

const ROLE_CLAIM_KEYS = [
  "http://localhost:3000/roles",
  "roles",
  "https://dott-pc.com/roles",
  "https://dott-pc.com.ar/roles",
];

/**
 * Audience de la API (Auth0 API identifier). En cliente solo está disponible NEXT_PUBLIC_*.
 */
function permissionsClaimKeys() {
  const audience =
    (typeof process !== "undefined" &&
      process.env.NEXT_PUBLIC_AUDIENCE?.trim()) ||
    "";
  const keys = [];
  if (audience) {
    const base = audience.replace(/\/+$/, "");
    keys.push(`${base}/permissions`);
  }
  keys.push("https://be.dott-pc.com.ar/permissions");
  return keys;
}

export function getUserRoles(user) {
  if (!user) {
    return [];
  }

  for (const key of ROLE_CLAIM_KEYS) {
    const roles = user[key];
    if (Array.isArray(roles) && roles.length > 0) {
      return roles;
    }
  }

  return [];
}

/**
 * Permisos RBAC visibles en el objeto user (ID token).
 * Requiere Post-Login Action que copie event.authorization.permissions al ID token.
 */
export function getUserPermissions(user) {
  if (!user) return [];

  const out = new Set();

  if (Array.isArray(user.permissions)) {
    user.permissions.forEach((p) => {
      if (typeof p === "string" && p) out.add(p);
    });
  }

  for (const key of permissionsClaimKeys()) {
    const v = user[key];
    if (Array.isArray(v)) {
      v.forEach((p) => {
        if (typeof p === "string" && p) out.add(p);
      });
    }
  }

  if (typeof user.scope === "string" && user.scope.trim()) {
    user.scope
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .forEach((s) => out.add(s));
  }

  return [...out];
}

/**
 * Acceso al panel /admin y UI de administración: rol legacy "admin" o permiso de API.
 */
export function canAccessAdmin(user) {
  if (!user) return false;
  if (getUserRoles(user).includes("admin")) return true;
  return getUserPermissions(user).includes(ADMIN_PANEL_PERMISSION);
}

export function hasRole(user, roleName) {
  const roles = getUserRoles(user);
  return roles.includes(roleName);
}

/**
 * @deprecated Usar canAccessAdmin() para alinear con permisos de API.
 */
export function isAdmin(user) {
  return canAccessAdmin(user);
}
