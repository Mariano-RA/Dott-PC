import { Fragment, useEffect, useState } from "react";
import { Menu, Transition } from "@headlessui/react";
import Link from "next/link";

export default function Category() {
  const [categorys, setCategorys] = useState([]);

  async function handleLoadCategorys() {
    const response = await fetch(
      `http://vps-3587040-x.dattaweb.com:3000/api/productos/categorias`
    );
    const data = await response.json();
    setCategorys(data);
  }

  useEffect(() => {
    handleLoadCategorys();
  }, []);

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="inline-flex w-full justify-center rounded-md bg-red-950 px-3 py-2 font-medium text-gray-300 hover:bg-red-700 hover:text-white">
          Category
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
