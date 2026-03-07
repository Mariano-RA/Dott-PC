/**
 * Configuración centralizada de la API backend.
 * Usado por las route handlers en app/api/ (servidor) y por referencias en cliente.
 *
 * Variable de entorno: NEXT_PUBLIC_APP_API_SERVER_URL
 * - En servidor: base URL para llamadas desde route handlers al backend Nest.
 * - En cliente: no se expone la URL en llamadas directas; el cliente usa /api/nest/* (proxy).
 */
export const getApiBaseUrl = (): string =>
  process.env.NEXT_PUBLIC_APP_API_SERVER_URL || "http://localhost:3000";
