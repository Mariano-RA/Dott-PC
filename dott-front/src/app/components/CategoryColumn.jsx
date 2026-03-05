"use client";
import Link from "next/link";
import { useEffect, useState, useContext } from "react";
import { usePathname } from "next/navigation";
import { ContextGlobal } from "./utils/global.context";

export default function CategoryColumn() {
  const [categorys, setCategorys] = useState([]);
  const { state } = useContext(ContextGlobal);
  const pathname = usePathname();

  useEffect(() => {
    setCategorys(state.categorys);
  }, [state]);

  function isActiveCategory(category) {
    const targetPath = `/products/category/${category}`;
    return decodeURIComponent(pathname || "") === decodeURIComponent(targetPath);
  }

  return (
    <aside className="sticky top-28 hidden w-64 shrink-0 self-start lg:block">
      <div className="overflow-hidden rounded-lg border border-red-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-red-100 bg-gradient-to-r from-red-50 to-white px-4 py-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-red-900">Categorias</p>
        </div>

        <ul role="list" className="max-h-[68vh] space-y-1 overflow-y-auto p-2">
          {categorys?.map((category, index) => (
            <li key={index}>
              <Link
                href={`/products/category/${category}`}
                className={`block rounded-md px-3 py-2 text-sm transition ${
                  isActiveCategory(category)
                    ? "bg-red-100 font-semibold text-red-900"
                    : "text-red-900 hover:bg-red-50 hover:text-red-700"
                }`}
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
