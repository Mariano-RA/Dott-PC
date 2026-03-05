"use client";
import { Fragment, useContext, useEffect, useState } from "react";
import { Menu, Transition } from "@headlessui/react";
import Link from "next/link";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { ContextGlobal } from "./utils/global.context";

export default function Category() {
  const [categorys, setCategorys] = useState([]);
  const { state } = useContext(ContextGlobal);

  // useEffect(() => {
  //   const getCategorys = async () => {
  //     const resVal = await fetch("/api/nest/categorys");
  //     const { categorys } = await resVal.json();
  //     setCategorys(categorys);
  //   };
  //   getCategorys();
  // }, []);
  useEffect(() => {
    setCategorys(state.categorys);
  }, [state]);

  function classNames(...classes) {
    return classes.filter(Boolean).join(" ");
  }

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
            {categorys?.map((category, index) => (
              <Menu.Item key={index}>
                {({ active }) => (
                  <Link
                    href={`/products/category/${category}`}
                    className={classNames(
                      active ? "bg-red-50 text-red-900" : "bg-white text-red-800",
                      "block px-4 py-2 text-sm leading-5"
                    )}
                  >
                    {category}
                  </Link>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
