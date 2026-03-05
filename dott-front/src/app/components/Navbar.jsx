"use client";

import { useState } from "react";
import { Bars3Icon, XMarkIcon, ShoppingCartIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Category from "./Category";
import Cart from "./Cart";
import Searchbar from "./Searchbar";
import Login from "./Login";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function Navbar() {
  const pathname = usePathname();
  const navigation = [
    { name: "Productos", href: "/products/list/", current: false },
    { name: "Calculadora", href: "/calculadora", current: false },
  ];
  const [show, setShow] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleCart = () => {
    setShow((prev) => {
      const next = !prev;
      if (next) {
        setMobileOpen(false);
      }
      return next;
    });
  };

  const handleMobileMenu = () => {
    setMobileOpen((prev) => {
      const next = !prev;
      if (next) {
        setShow(false);
      }
      return next;
    });
  };

  function handleClose(action) {
    setShow(action);
  }

  function isCurrentPath(href) {
    if (href === "/") {
      return pathname === "/";
    }

    const normalizedHref = href.endsWith("/") ? href : `${href}/`;
    const normalizedPathname = pathname?.endsWith("/") ? pathname : `${pathname}/`;

    return normalizedPathname?.startsWith(normalizedHref);
  }

  return (
    <>
      <header className="fixed top-0 z-30 w-full border-b border-red-900/80 bg-red-950/95 backdrop-blur">
        <nav aria-label="Principal" className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
          <div className="relative flex h-16 items-center justify-between">
            <div className="absolute inset-y-0 left-0 z-10 flex items-center sm:hidden">
              <button
                type="button"
                className="relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-red-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={handleMobileMenu}
                aria-label="Abrir menu principal"
              >
                <span className="absolute -inset-0.5" />
                {mobileOpen ? (
                  <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>

            <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
              <div className="flex flex-shrink-0 items-center">
                <Link href="/">
                  <img
                    className="h-8 w-auto rounded-md bg-red-700"
                    src="/logo/logoLetras.png"
                    alt="Logo DottPC"
                  />
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:block">
                <div className="flex space-x-4">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={classNames(
                        isCurrentPath(item.href)
                          ? "bg-red-800 text-white"
                          : "text-gray-300 hover:bg-red-700 hover:text-white",
                        "rounded-md px-3 py-2 font-medium"
                      )}
                      aria-current={isCurrentPath(item.href) ? "page" : undefined}
                    >
                      {item.name}
                    </Link>
                  ))}
                  <Category />
                </div>
              </div>
              <div className="hidden w-full items-center justify-center sm:flex">
                <Searchbar />
              </div>
            </div>

            <div className="absolute inset-y-0 right-0 z-10 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
              <button
                type="button"
                className="relative rounded-full bg-red-800 p-1 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-red-800"
                onClick={handleCart}
                aria-label="Ver carrito"
              >
                <span className="absolute -inset-1.5" />
                <span className="sr-only">Ver carrito</span>
                <ShoppingCartIcon className="h-6 w-6" aria-hidden="true" />
              </button>

              <Login />
            </div>
          </div>
        </nav>

        {mobileOpen ? (
          <div className="sm:hidden">
            <div className="space-y-1 px-2 pb-3 pt-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={classNames(
                    isCurrentPath(item.href)
                      ? "bg-red-900 text-white"
                      : "text-gray-300 hover:bg-red-700 hover:text-white",
                    "block rounded-md px-3 py-2 text-base font-medium"
                  )}
                  aria-current={isCurrentPath(item.href) ? "page" : undefined}
                  onClick={() => setMobileOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <Category />
              <div className="px-2 w-100">
                <Searchbar />
              </div>
            </div>
          </div>
        ) : null}
      </header>

      <Cart action={show} handleCloseCart={handleClose} />
    </>
  );
}
