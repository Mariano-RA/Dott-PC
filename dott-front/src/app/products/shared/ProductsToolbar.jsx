import React from "react";
import { ListBulletIcon, Squares2X2Icon, XMarkIcon } from "@heroicons/react/20/solid";
import Dropdown from "@/app/components/Dropdown";
import ProveedorDropdown from "@/app/components/ProveedorDropdown";
import { Badge, Button } from "@/app/components/ui";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function ProductsToolbar({
  badgeLabel,
  title,
  showTypeGrid,
  onChangeView,
  sortType,
  onSortChange,
  proveedor,
  onProveedorChange,
  activeFilters = [],
}) {
  return (
    <div className="space-y-4">
      <div className="flex w-full flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full items-center justify-between gap-3 md:w-auto md:justify-start">
          <div className="min-w-0 flex items-center gap-3">
            <Badge variant="neutral">{badgeLabel}</Badge>
            <p className="truncate text-lg font-semibold text-foreground">{title}</p>
          </div>
          <div className="flex items-center gap-1 md:hidden">
            <Button
              onClick={() => onChangeView("list")}
              className={classNames(
                !showTypeGrid ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                "h-8 w-8 rounded-sm px-0"
              )}
              variant="ghost"
              size="sm"
              aria-label="Vista lista"
            >
              <ListBulletIcon className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              onClick={() => onChangeView("grid")}
              className={classNames(
                showTypeGrid ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                "h-8 w-8 rounded-sm px-0"
              )}
              variant="ghost"
              size="sm"
              aria-label="Vista grilla"
            >
              <Squares2X2Icon className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end md:w-auto">
          <div className="hidden items-center gap-1 md:flex">
            <Button
              onClick={() => onChangeView("list")}
              className={classNames(
                !showTypeGrid ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                "h-8 w-8 rounded-sm px-0"
              )}
              variant="ghost"
              size="sm"
              aria-label="Vista lista"
            >
              <ListBulletIcon className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              onClick={() => onChangeView("grid")}
              className={classNames(
                showTypeGrid ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                "h-8 w-8 rounded-sm px-0"
              )}
              variant="ghost"
              size="sm"
              aria-label="Vista grilla"
            >
              <Squares2X2Icon className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
          <Dropdown selectedKey={sortType} onChange={onSortChange} />
          <ProveedorDropdown selectedKey={proveedor} onChange={onProveedorChange} />
        </div>
      </div>

      {activeFilters.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {activeFilters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={filter.onRemove}
              className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-medium text-red-900 hover:bg-red-100"
            >
              {filter.label}
              <XMarkIcon className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
