"use client";

import { Fragment, useState } from "react";
import { Disclosure, Menu, Transition } from "@headlessui/react";
import {
  Bars3Icon,
  BellIcon,
  XMarkIcon,
  ShoppingCartIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import Category from "./Category";
import Cart from "./Cart";
import Searchbar from "./Searchbar";
import Login from "./Login";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function Navbar() {
  const [navigation, setNavigation] = useState([
    { name: "Productos", href: "/products/list/", current: false },
  ]);

  const [modifyNavigation, setModifyNavigation] = useState([...navigation]);
  const [show, setShow] = useState(false);

  const handleCart = () => {
    setShow(true);
  };

  function handleClose(action) {
    setShow(action);
  }

  function handlePageChange(name) {
    const newArr = modifyNavigation.map((obj) => {
      if (obj.name == name) {
        return { ...obj, current: true };
      } else {
        return { ...obj, current: false };
      }
      return obj;
    });

    setModifyNavigation(newArr);
    setNavigation([...newArr]);
  }

  return (
    <Disclosure as="nav" className="bg-red-950 w-full fixed z-10">
      {({ open }) => (
        <>
          <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
            <div className="relative flex h-16 items-center justify-between">
              <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                {/* Mobile menu button*/}
                <Disclosure.Button className="relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-red-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                  <span className="absolute -inset-0.5" />
                  <span className="sr-only">Open main menu</span>
                  {open ? (
                    <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
              <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
                <div className="flex flex-shrink-0 items-center">
                  <Link href="/">
                    <img
                      className="h-8 w-auto bg-red-700 rounded-md"
                      src="/logo/logoLetras.png"
                      alt="Logo DottPC"
                    />
                  </Link>
                </div>
                <div className="hidden sm:ml-6 sm:block">
                  <div className="flex space-x-4">
                    {navigation.map((item) => (
                      <a
                        key={item.name}
                        href={item.href}
                        className={classNames(
                          item.current
                            ? "bg-red-800 text-white"
                            : "text-gray-300 hover:bg-red-700 hover:text-white",
                          "rounded-md px-3 py-2 font-medium"
                        )}
                        onClick={() => handlePageChange(item.name)}
                        aria-current={item.current ? "page" : undefined}
                      >
                        {item.name}
                      </a>
                    ))}
                    <Category />
                  </div>
                </div>
                <div className="w-full justify-center hidden sm:flex items-center ">
                  <Searchbar />
                </div>
              </div>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
                <button
                  type="button"
                  className="relative rounded-full bg-red-800 p-1 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-red-800"
                  onClick={() => handleCart()}
                >
                  <span className="absolute -inset-1.5" />
                  <span className="sr-only">View shopcart</span>
                  <ShoppingCartIcon className="h-6 w-6" aria-hidden="true" />
                </button>

                {/* Profile dropdown */}
                <Login />
              </div>
            </div>
          </div>

          <Disclosure.Panel className="sm:hidden">
            <div className="space-y-1 px-2 pb-3 pt-2">
              {navigation.map((item) => (
                <Disclosure.Button
                  key={item.name}
                  as="a"
                  href={item.href}
                  className={classNames(
                    item.current
                      ? "bg-red-900 text-white"
                      : "text-gray-300 hover:bg-red-700 hover:text-white",
                    "block rounded-md px-3 py-2 text-base font-medium"
                  )}
                  aria-current={item.current ? "page" : undefined}
                >
                  {item.name}
                </Disclosure.Button>
              ))}
              <Category />
            </div>
          </Disclosure.Panel>
          <Cart action={show} handleCloseCart={handleClose} />
        </>
      )}
    </Disclosure>
  );
}
