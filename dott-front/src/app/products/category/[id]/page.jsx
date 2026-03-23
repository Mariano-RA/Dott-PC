"use client";

import React, { use, useEffect } from "react";
import ProductCard from "@/app/components/ProductCard";
import Pagination from "@/app/components/Pagination";
import CategoryColumn from "@/app/components/CategoryColumn";
import TableProducts from "@/app/components/TableProducts";
import { Card, CardContent } from "@/components/ui";
import { LISTING_TAKE } from "@/app/products/shared/listingData";
import { useProductsListing } from "@/app/products/shared/useProductsListing";
import { api } from "@/constants/routes";
import ProductsToolbar from "@/app/products/shared/ProductsToolbar";
import { ProductsGridSkeleton, ProductsTableSkeleton } from "@/app/products/shared/ProductsSkeletons";
import ProductsErrorState from "@/app/products/shared/ProductsErrorState";
import ProductsEmptyState from "@/app/products/shared/ProductsEmptyState";

const Page = ({ params }) => {
  const { id: categoryParam } = use(
    params instanceof Promise ? params : Promise.resolve(params)
  );
  const categoryName = decodeURIComponent(categoryParam || "");

  const {
    products,
    totalResults,
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
  } = useProductsListing({
    endpoint: api.nest.products.category,
    extraParams: { category: categoryParam },
    errorMessage: "No pudimos cargar esta categoria. Intenta nuevamente.",
  });

  useEffect(() => {
    setPage(1);
  }, [categoryParam, setPage]);

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
              badgeLabel="Categoria"
              title={categoryName}
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
                title={`No hay resultados en ${categoryName}`}
                description="Prueba explorando el catalogo completo."
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
