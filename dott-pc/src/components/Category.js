import { Fragment } from "react";
import { Disclosure, Menu, Transition } from "@headlessui/react";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

const Category = () => {
  return (
    <Menu as="div" className="relative">
      <div>
        <Menu.Button className="text-gray-300 hover:bg-red-500 hover:text-white rounded-md px-3 py-2 text-sm font-medium">
          Categoria
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
        <Menu.Items className="absolute right-0 z-10 w-48 origin-top-right rounded-md bg-gray-800 shadow-lg py-1 ring-1 ring-black ring-opacity-5 focus:outline-none">
          <Menu.Item>
            {({ active }) => (
              <a
                href="#"
                className={classNames(
                  active ? "bg-gray-600" : "bg-gray-800",
                  "block px-4 py-2 text-white text-sm text-gray-700"
                )}
              >
                Your Profile
              </a>
            )}
          </Menu.Item>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

export default Category;
