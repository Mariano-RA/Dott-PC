"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import ProductCard from "@/app/components/ProductCard";
import Pagination from "@/app/components/Pagination";
import CategoryColumn from "@/app/components/CategoryColumn";
import TableProducts from "@/app/components/TableProducts";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/app/components/ui";
import { LISTING_TAKE } from "@/app/products/shared/listingData";
import { fetchProductsListing } from "@/app/products/shared/listingApi";
import ProductsToolbar from "@/app/products/shared/ProductsToolbar";
import { ProductsGridSkeleton, ProductsTableSkeleton } from "@/app/products/shared/ProductsSkeletons";
import ProductsErrorState from "@/app/products/shared/ProductsErrorState";
import ProductsEmptyState from "@/app/products/shared/ProductsEmptyState";

const Page = ({ params }) => {
  const [products, setProducts] = useState([]);
  const [sortType, setSortType] = useState("nombreAsc");
  const [productLength, setProductLength] = useState(0);
  const [page, setPage] = useState(1);
  const [showLoading, setShowLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [showTypeGrid, setShowTypeGrid] = useState(false);
  const [filterProveedor, setFilterProveedor] = useState("");
  const router = useRouter();
  const decodedKeywords = decodeURIComponent(params.keywords || "");

  useEffect(() => {
    setPage(1);
  }, [params.keywords]);

  const keywordsParam = useMemo(() => {
    return decodedKeywords.trim().split(/\s+/).filter(Boolean).join(",");
  }, [decodedKeywords]);

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

  function handleSelectedSort(nextSortType) {
    setPage(1);
    setSortType(nextSortType);
  }

  function handlePagination(newPage) {
    setPage(newPage);
  }

  function handleSelectProveedor(proveedorKey) {
    setPage(1);
    setFilterProveedor(proveedorKey);
  }

  function handleVisualizer(visualizerType) {
    setShowTypeGrid(visualizerType === "grid");
  }

  const renderProducts = () => {
    if (showTypeGrid) {
      return (
        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard product={product} key={product.id} />
          ))}
        </div>
      );
    }

    return <TableProducts products={products} />;
  };

  const handleClearAll = useCallback(() => {
    router.push("/products/list");
  }, [router]);

  const handleRetry = useCallback(() => {
    setRetryKey((current) => current + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function handleLoadProducts() {
      setShowLoading(true);
      setLoadError("");

      try {
        const response = await fetchProductsListing({
          endpoint: "/api/nest/products/keywords",
          page,
          take: LISTING_TAKE,
          sortType,
          proveedor: filterProveedor,
          extraParams: { keywords: keywordsParam },
          signal: controller.signal,
        });

        setProducts(response.products);
        setProductLength(response.totalResults);
      } catch (error) {
        if (error?.name === "AbortError") {
          return;
        }

        setProducts([]);
        setProductLength(0);
        setLoadError("No pudimos cargar la busqueda. Intenta nuevamente.");
      } finally {
        if (!controller.signal.aborted) {
          setShowLoading(false);
        }
      }
    }

    handleLoadProducts();

    return () => {
      controller.abort();
    };
  }, [page, sortType, filterProveedor, keywordsParam, retryKey]);

  return (
    <div className="container-page max-w-none py-8 md:py-10 2xl:px-10">
      <div className="flex w-full items-start justify-center gap-4">
        <CategoryColumn />
        <Card className="flex min-w-0 w-full flex-grow flex-col justify-between">
          <CardContent className="space-y-6 px-4 py-6 md:px-8">
            <ProductsToolbar
              badgeLabel="Busqueda"
              title="Resultados de busqueda"
              showTypeGrid={showTypeGrid}
              onChangeView={handleVisualizer}
              sortType={sortType}
              onSortChange={handleSelectedSort}
              proveedor={filterProveedor}
              onProveedorChange={handleSelectProveedor}
              activeFilters={activeFilters}
            />

            {showLoading ? showTypeGrid ? <ProductsGridSkeleton /> : <ProductsTableSkeleton /> : null}

            {!showLoading && loadError ? <ProductsErrorState message={loadError} onRetry={handleRetry} /> : null}

            {!showLoading && !loadError && products.length === 0 ? (
              <ProductsEmptyState
                title="No hay resultados para tu busqueda"
                description="Prueba con otros terminos o vuelve al listado completo."
              />
            ) : null}

            {!showLoading && !loadError && products.length > 0 ? (
              <div className="flex w-full flex-grow flex-wrap content-start items-start justify-evenly gap-x-[3%] px-0 md:justify-start">
                {renderProducts()}
              </div>
            ) : null}

            {!showLoading && !loadError && productLength > 0 ? (
              <div>
                <Pagination
                  actualPage={page}
                  cantItems={productLength}
                  itemsPerPage={LISTING_TAKE}
                  newPage={handlePagination}
                />
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Page;
