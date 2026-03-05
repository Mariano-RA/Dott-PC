/**
 * Helper para extraer roles de Auth0 de forma segura
 * Maneja tanto desarrollo (localhost) como producción
 * 
 * En producción, Auth0 devuelve los roles bajo la clave:
 * "http://localhost:3000/roles" (configurado en Auth0 Actions)
 */
export function getUserRoles(user) {
  if (!user) {
    return [];
  }

  // Intentar diferentes namespaces comunes de Auth0
  // El principal es "http://localhost:3000/roles" que es lo configurado en nuestro Auth0
  const possibleKeys = [
    "http://localhost:3000/roles", // Nuestro namespace configurado
    "roles", // Algunos setups ponen roles directo en el root
    "https://dott-pc.com/roles", // Alternativa
    "https://dott-pc.com.ar/roles", // Alternativa con dominio completo
  ];

  for (const key of possibleKeys) {
    const roles = user[key];
    if (Array.isArray(roles) && roles.length > 0) {
      return roles;
    }
  }

  // Fallback: si no encuentra nada, devolver array vacío
  return [];
}

/**
 * Verifica si el usuario tiene un rol específico
 */
export function hasRole(user, roleName) {
  const roles = getUserRoles(user);
  return roles.includes(roleName);
}

/**
 * Verifica si el usuario es admin
 */
export function isAdmin(user) {
  return hasRole(user, "admin");
}
