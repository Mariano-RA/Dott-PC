"use client";
import Link from "next/link";
import { useEffect, useState, useContext, useMemo } from "react";
import { usePathname } from "next/navigation";
import { ChevronRightIcon, ChevronDownIcon } from "@heroicons/react/20/solid";
import { ContextGlobal } from "@/contexts/global.context";
import { buildCategoryHref, useCategoriesNavigation } from "@/app/components/hooks/useCategoriesNavigation";

export default function CategoryColumn() {
  const [expandedIds, setExpandedIds] = useState(() => new Set());
  const pathname = usePathname();

  const { categoryTree, categorys, useTree } = useCategoriesNavigation();

  const currentCategoryName = useMemo(() => {
    if (!pathname?.startsWith("/products/category/")) return "";
    const slug = pathname.replace(/^\/products\/category\//, "").split("?")[0];
    return decodeURIComponent(slug || "");
  }, [pathname]);

  useEffect(() => {
    if (!useTree || !currentCategoryName) return;
    for (const cat of categoryTree) {
      const isParent = cat.nombre === currentCategoryName;
      const isChild = Array.isArray(cat.subcategorias) && cat.subcategorias.includes(currentCategoryName);
      if (isParent || isChild) {
        setExpandedIds((prev) => new Set(prev).add(cat.id));
        break;
      }
    }
  }, [currentCategoryName, useTree, categoryTree]);

  function isActiveCategory(name) {
    return currentCategoryName && decodeURIComponent(currentCategoryName) === decodeURIComponent(name);
  }

  function toggleExpanded(id) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const linkClass = (active) =>
    `block rounded-md px-3 py-2 text-sm transition truncate ${
      active ? "bg-red-100 font-semibold text-red-900" : "text-red-900 hover:bg-red-50 hover:text-red-700"
    }`;

  if (useTree) {
    return (
      <aside className="sticky top-28 hidden w-64 shrink-0 self-start lg:block">
        <div className="overflow-hidden rounded-lg border border-red-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-red-100 bg-gradient-to-r from-red-50 to-white px-4 py-3">
            <p className="text-sm font-semibold uppercase tracking-wide text-red-900">Categorias</p>
          </div>

          <ul role="list" className="max-h-[68vh] space-y-0.5 overflow-y-auto p-2">
            {categoryTree.map((cat) => {
              const expanded = expandedIds.has(cat.id);
              const subs = Array.isArray(cat.subcategorias) ? cat.subcategorias : [];
              const hasSubs = subs.length > 0;

              return (
                <li key={cat.id}>
                  <div className="flex items-center gap-0.5 rounded-md">
                    {hasSubs ? (
                      <button
                        type="button"
                        onClick={() => toggleExpanded(cat.id)}
                        className="shrink-0 rounded p-1 text-red-700 hover:bg-red-50"
                        aria-expanded={expanded}
                        aria-label={expanded ? "Contraer" : "Expandir"}
                      >
                        {expanded ? (
                          <ChevronDownIcon className="h-4 w-4" />
                        ) : (
                          <ChevronRightIcon className="h-4 w-4" />
                        )}
                      </button>
                    ) : (
                      <span className="w-5 shrink-0" aria-hidden />
                    )}
                    <Link
                      href={buildCategoryHref(cat.nombre)}
                      className={`flex-1 min-w-0 ${linkClass(isActiveCategory(cat.nombre))}`}
                      title={cat.nombre}
                      aria-current={isActiveCategory(cat.nombre) ? "page" : undefined}
                    >
                      <span className="block truncate">{cat.nombre}</span>
                    </Link>
                  </div>
                  {hasSubs && expanded && (
                    <ul className="ml-5 mt-0.5 space-y-0.5 border-l border-red-100 pl-2" role="list">
                      {subs.map((sub) => (
                        <li key={sub}>
                          <Link
                            href={buildCategoryHref(sub)}
                            className={`block rounded-md px-2 py-1.5 text-sm transition truncate ${
                              isActiveCategory(sub)
                                ? "bg-red-100 font-semibold text-red-900"
                                : "text-red-800 hover:bg-red-50 hover:text-red-700"
                            }`}
                            title={sub}
                            aria-current={isActiveCategory(sub) ? "page" : undefined}
                          >
                            {sub}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </aside>
    );
  }

  return (
    <aside className="sticky top-28 hidden w-64 shrink-0 self-start lg:block">
      <div className="overflow-hidden rounded-lg border border-red-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-red-100 bg-gradient-to-r from-red-50 to-white px-4 py-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-red-900">Categorias</p>
        </div>

        <ul role="list" className="max-h-[68vh] space-y-1 overflow-y-auto p-2">
          {categorys?.map((category) => (
            <li key={category}>
              <Link
                href={buildCategoryHref(category)}
                className={linkClass(isActiveCategory(category))}
                title={category}
                aria-current={isActiveCategory(category) ? "page" : undefined}
              >
                <span className="block truncate">{category}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
