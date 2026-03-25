"use client";

import React from "react";
import ProductCard from "@/app/components/ProductCard";
import Pagination from "@/app/components/Pagination";
import CategoryColumn from "@/app/components/CategoryColumn";
import TableProducts from "@/app/components/TableProducts";
import { Card, CardContent } from "@/components/ui";
import { LISTING_TAKE } from "@/app/products/shared/listingData";
import { useProductsListing } from "@/app/products/shared/useProductsListing";
import ProductsToolbar from "@/app/products/shared/ProductsToolbar";
import { ProductsGridSkeleton, ProductsTableSkeleton } from "@/app/products/shared/ProductsSkeletons";
import ProductsErrorState from "@/app/products/shared/ProductsErrorState";
import ProductsEmptyState from "@/app/products/shared/ProductsEmptyState";
import { api } from "@/constants/routes";

const Page = () => {
  const {
    products,
    totalResults,
    warnings,
    page,
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
  } = useProductsListing({ endpoint: api.nest.products.list });

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

  return (
    <div className="container-page max-w-none py-8 md:py-10 2xl:px-10">
      <div className="flex w-full items-start justify-center gap-4">
        <CategoryColumn />
        <Card className="flex min-w-0 w-full flex-grow flex-col justify-between">
          <CardContent className="space-y-6 px-4 py-6 md:px-8">
            <ProductsToolbar
              badgeLabel="Listado"
              title="Todos los productos"
              showTypeGrid={showTypeGrid}
              onChangeView={handleViewChange}
              sortType={sortType}
              onSortChange={handleSortChange}
              proveedor={filterProveedor}
              onProveedorChange={handleProveedorChange}
              activeFilters={activeFilters}
            />

            {loading ? (showTypeGrid ? <ProductsGridSkeleton /> : <ProductsTableSkeleton />) : null}

            {!loading && error ? (
              <ProductsErrorState message={error} onRetry={handleRetry} />
            ) : null}

            {!loading && !error && products.length === 0 ? (
              <ProductsEmptyState
                title="No hay productos para mostrar"
                description={
                  warnings?.some((w) => w?.code === "PROVIDER_EMPTY")
                    ? "Este proveedor no tiene productos cargados (o la importación falló / todavía no terminó)."
                    : "Prueba con otro proveedor u orden de resultados."
                }
              />
            ) : null}

            {!loading && !error && products.length > 0 ? (
              <div className="flex w-full flex-grow flex-wrap content-start items-start justify-evenly gap-x-[3%] px-0 md:justify-start">
                {renderProducts()}
              </div>
            ) : null}

            {!loading && !error && totalResults > 0 ? (
              <div>
                <Pagination
                  actualPage={page}
                  cantItems={totalResults}
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
