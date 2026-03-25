"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LISTING_TAKE } from "./listingData";
import { fetchProductsListing } from "./listingApi";
import { isApiError } from "@/lib/http/fetchJson";

const DEFAULT_ERROR_MESSAGE = "No pudimos cargar el listado. Intenta nuevamente.";

/**
 * Hook unificado para listado de productos (list, category, keywords).
 * @param {{ endpoint: string, extraParams?: Record<string, string>, errorMessage?: string }} options
 * @returns Estado y handlers para la UI del listado.
 */
export function useProductsListing({ endpoint, extraParams = {}, errorMessage = DEFAULT_ERROR_MESSAGE } = {}) {
  const [products, setProducts] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [warnings, setWarnings] = useState([]);
  const [sortType, setSortType] = useState("nombreAsc");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [showTypeGrid, setShowTypeGrid] = useState(false);
  const [filterProveedor, setFilterProveedor] = useState("");

  const activeFilters = useMemo(() => {
    const filters = [];
    if (filterProveedor) {
      filters.push({
        key: "proveedor",
        label: `Proveedor: ${filterProveedor.toUpperCase()}`,
        onRemove: () => {
          setFilterProveedor("");
          setPage(1);
        },
      });
    }
    return filters;
  }, [filterProveedor]);

  const handleSortChange = useCallback((nextSortType) => {
    setPage(1);
    setSortType(nextSortType);
  }, []);

  const handleProveedorChange = useCallback((proveedorKey) => {
    setPage(1);
    setFilterProveedor(proveedorKey);
  }, []);

  const handleViewChange = useCallback((visualizerType) => {
    setShowTypeGrid(visualizerType === "grid");
  }, []);

  const handlePagination = useCallback((newPage) => {
    setPage(newPage);
  }, []);

  const handleRetry = useCallback(() => {
    setRetryKey((k) => k + 1);
  }, []);

  const clearFilters = useCallback(() => {
    setPage(1);
    setSortType("nombreAsc");
    setFilterProveedor("");
  }, []);

  const extraParamsKey = JSON.stringify(extraParams);

  useEffect(() => {
    const controller = new AbortController();
    const params = extraParamsKey ? JSON.parse(extraParamsKey) : {};

    async function load() {
      setLoading(true);
      setError("");
      setWarnings([]);
      try {
        const response = await fetchProductsListing({
          endpoint,
          page,
          take: LISTING_TAKE,
          sortType,
          proveedor: filterProveedor,
          extraParams: params,
          signal: controller.signal,
        });
        setProducts(response.products);
        setTotalResults(response.totalResults);
        setWarnings(Array.isArray(response.warnings) ? response.warnings : []);
      } catch (err) {
        if (err?.name === "AbortError") return;
        setProducts([]);
        setTotalResults(0);
        if (isApiError(err)) {
          if (err.status === 0) setError("No pudimos conectarnos con el backend. Revisá tu conexión o el servidor.");
          else if (err.status === 401) setError("Necesitás iniciar sesión para ver este contenido.");
          else if (err.status === 403) setError("No tenés permisos para ver este contenido.");
          else if (err.status >= 500) setError("El backend tuvo un problema al responder. Intentá nuevamente.");
          else setError(err.message || errorMessage);
        } else {
          setError(errorMessage);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    load();
    return () => controller.abort();
  }, [endpoint, page, sortType, filterProveedor, retryKey, extraParamsKey, errorMessage]);

  return {
    products,
    totalResults,
    warnings,
    page,
    setPage,
    sortType,
    filterProveedor,
    showTypeGrid,
    loading,
    error,
    activeFilters,
    handleSortChange,
    handleProveedorChange,
    handleViewChange,
    handlePagination,
    handleRetry,
    clearFilters,
  };
}
