"use client";

import useSWR from "swr";

import { api } from "@/constants/routes";
import { fetchJson } from "@/lib/http/fetchJson";

const PROVEEDORES_ENDPOINT = api.nest.proveedores;

async function fetcher(url) {
  const data = await fetchJson(url, { timeoutMs: 10_000 });
  return data?.proveedores ?? [];
}

/**
 * Formato para el dropdown: { key: string, value: string }.
 * key vacío = "Todos"; el resto usa nombre en minúscula como key y nombre con mayúscula como value.
 */
function toOptions(proveedores) {
  if (!Array.isArray(proveedores)) return [];
  const active = proveedores.filter((p) => p?.activo !== false);
  const options = [{ key: "", value: "Proveedores" }];
  active.forEach((p) => {
    const nombre = String(p?.nombre ?? "").trim();
    if (nombre) {
      options.push({ key: nombre.toLowerCase(), value: nombre.charAt(0).toUpperCase() + nombre.slice(1) });
    }
  });
  return options;
}

/**
 * Hook para obtener la lista de proveedores desde la API (una sola fuente de verdad).
 * @returns {{ options: { key: string, value: string }[], isLoading: boolean, error: Error | null }}
 */
export function useProveedores() {
  const { data: proveedores = [], isLoading, error } = useSWR(PROVEEDORES_ENDPOINT, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  });

  const options = toOptions(proveedores);

  return { options, isLoading, error };
}
