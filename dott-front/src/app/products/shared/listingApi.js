import { fetchJson } from "@/lib/http/fetchJson";

function normalizeProductsResponse(payload) {
  const response = payload?.response ?? payload ?? {};

  return {
    products: Array.isArray(response.productos) ? response.productos : [],
    totalResults: Number(response.cantResultados) || 0,
    warnings: Array.isArray(response.warnings) ? response.warnings : [],
  };
}

export async function fetchProductsListing({
  endpoint,
  page,
  take,
  sortType,
  proveedor,
  extraParams = {},
  signal,
}) {
  const params = new URLSearchParams({
    skip: String(page),
    take: String(take),
    orderBy: sortType,
  });

  Object.entries(extraParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      params.append(key, String(value));
    }
  });

  if (proveedor) {
    params.append("proveedor", proveedor);
  }

  const payload = await fetchJson(`${endpoint}?${params.toString()}`, {
    cache: "no-store",
    signal,
    timeoutMs: 15_000,
  });
  return normalizeProductsResponse(payload);
}
