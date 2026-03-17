"use client";
import { Fragment } from "react";
import { Menu, Transition } from "@headlessui/react";
import Link from "next/link";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { buildCategoryHref, useCategoriesNavigation } from "@/app/components/hooks/useCategoriesNavigation";

export default function Category() {
  const { categoryTree, categorys, useTree } = useCategoriesNavigation();

  function classNames(...classes) {
    return classes.filter(Boolean).join(" ");
  }

  const linkBase = "block px-4 py-2 text-sm leading-5";

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="inline-flex items-center justify-center gap-1 rounded-md px-3 py-2 font-medium text-gray-300 transition hover:bg-red-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/70">
          Categorias
          <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute z-20 mt-2 w-64 origin-top-right rounded-md border border-red-100 bg-white shadow-lg focus:outline-none">
          <div className="max-h-80 overflow-y-auto py-1">
            {useTree ? (
              <>
                {categoryTree.map((cat) => (
                  <div key={cat.id} className="border-b border-red-50 last:border-0">
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          href={buildCategoryHref(cat.nombre)}
                          className={classNames(
                            active ? "bg-red-50 text-red-900" : "text-red-800",
                            linkBase,
                            "font-semibold"
                          )}
                        >
                          {cat.nombre}
                        </Link>
                      )}
                    </Menu.Item>
                    {Array.isArray(cat.subcategorias) &&
                      cat.subcategorias.map((sub) => (
                        <Menu.Item key={sub}>
                          {({ active }) => (
                            <Link
                              href={buildCategoryHref(sub)}
                              className={classNames(
                                active ? "bg-red-50 text-red-900" : "bg-white text-red-800",
                                linkBase,
                                "pl-6 font-normal"
                              )}
                            >
                              {sub}
                            </Link>
                          )}
                        </Menu.Item>
                      ))}
                  </div>
                ))}
              </>
            ) : (
              categorys?.map((category) => (
                <Menu.Item key={category}>
                  {({ active }) => (
                    <Link
                      href={buildCategoryHref(category)}
                      className={classNames(
                        active ? "bg-red-50 text-red-900" : "bg-white text-red-800",
                        linkBase
                      )}
                    >
                      {category}
                    </Link>
                  )}
                </Menu.Item>
              ))
            )}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
