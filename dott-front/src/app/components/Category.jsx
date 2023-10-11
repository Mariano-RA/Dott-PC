"use client";
import { Fragment, useContext, useEffect, useState } from "react";
import { Menu, Transition } from "@headlessui/react";
import Link from "next/link";
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

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="inline-flex w-full justify-center rounded-md bg-red-950 px-3 py-2 font-medium text-gray-300 hover:bg-red-700 hover:text-white">
          Categorías
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
        <Menu.Items className="absolute  z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="overflow-y-scroll h-96">
            {categorys?.map((category, index) => (
              <Link
                href={`/products/category/${category}`}
                className="bg-gray-200 hover:bg-gray-50 text-red-800 block px-4 py-2 text-sm"
                key={index}
              >
                {category}
              </Link>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
