"use client";

import useSWR from "swr";
import { useUser } from "@auth0/nextjs-auth0";

import { canAccessAdmin } from "@/lib/auth0Roles";
import { fetchJson } from "@/lib/http/fetchJson";

const fetcher = (url) => fetchJson(url, { timeoutMs: 10_000 });

/**
 * useUser() refleja sobre todo el ID token; los permisos RBAC de la API suelen ir en el access token.
 * Combinamos el perfil con GET /api/admin/access para alinear con el backend (create:tablas / rol admin).
 */
export function useCanAccessAdmin() {
  const { user, isLoading: userLoading } = useUser();
  const fromProfile = user ? canAccessAdmin(user) : false;
  const needsApi = Boolean(user && !fromProfile);

  const { data, error } = useSWR(needsApi ? "/api/admin/access" : null, fetcher);

  const tokenAllowed = data?.allowed === true;
  const canAccess = Boolean(user && (fromProfile || tokenAllowed));

  const pending =
    userLoading ||
    (Boolean(user) && !fromProfile && needsApi && data === undefined && !error);

  return { canAccess, pending };
}
