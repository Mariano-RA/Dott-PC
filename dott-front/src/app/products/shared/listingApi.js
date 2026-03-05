function normalizeProductsResponse(payload) {
  const response = payload?.response ?? payload ?? {};

  return {
    products: Array.isArray(response.productos) ? response.productos : [],
    totalResults: Number(response.cantResultados) || 0,
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

  const response = await fetch(`${endpoint}?${params.toString()}`, {
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    throw new Error("No se pudieron cargar los productos.");
  }

  const payload = await response.json();
  return normalizeProductsResponse(payload);
}
