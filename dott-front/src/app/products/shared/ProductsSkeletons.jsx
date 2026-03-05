import React from "react";

export function ProductsGridSkeleton({ count = 8 }) {
  return (
    <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="h-44 animate-pulse rounded-lg border border-border bg-neutral-100" />
      ))}
    </div>
  );
}

export function ProductsTableSkeleton({ rows = 8 }) {
  return (
    <div className="w-full animate-pulse space-y-3">
      <div className="h-10 w-full rounded-md bg-neutral-100" />
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="h-12 w-full rounded-md bg-neutral-100" />
      ))}
    </div>
  );
}
