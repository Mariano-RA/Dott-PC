"use client";
import { Fragment, useEffect, useState, useContext } from "react";
import { Dialog, RadioGroup, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { ContextGlobal } from "./utils/global.context";
import { useUser } from "@auth0/nextjs-auth0/client";

export default function ProductOverview({ action, close, product }) {
  const [open, setOpen] = useState(false);
  const { state, addCart, removeCart } = useContext(ContextGlobal);
  const [IsSelected, setIsSelected] = useState(false);
  const [usrRoles, setUsrRoles] = useState([]);
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      const roles = user["http://localhost:3000/roles"];
      setUsrRoles(roles);
    } else {
      setUsrRoles([]);
    }
  }, [user]);

  useEffect(() => {
    const handleShow = () => {
      if (action) {
        setOpen(true);
      } else {
        setOpen(false);
      }
    };
    handleShow();
  }, [action]);

  useEffect(() => {
    const handleClose = () => {
      if (open == false) {
        close(open);
      }
    };
    handleClose();
  }, [open]);

  function handleCart() {
    if (
      state.productCart.filter((prodCart) => prodCart.id === product.id)
        .length > 0
    ) {
      removeCart(product.id);
      setIsSelected(false);
    } else {
      addCart(product);
      setIsSelected(true);
    }
  }

  useEffect(() => {
    const handleSelected = () => {
      if (
        state.productCart.filter((prodCart) => prodCart.id === product.id)
          .length > 0
      ) {
        setIsSelected(true);
      } else {
        setIsSelected(false);
      }
    };
    handleSelected();
  }, [product]);

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={setOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 hidden bg-gray-500 bg-opacity-75 transition-opacity md:block" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-stretch justify-center text-center md:items-center md:px-2 lg:px-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 md:translate-y-0 md:scale-95"
              enterTo="opacity-100 translate-y-0 md:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 md:scale-100"
              leaveTo="opacity-0 translate-y-4 md:translate-y-0 md:scale-95"
            >
              <Dialog.Panel className="flex w-full transform text-left text-base transition md:my-8 md:max-w-2xl md:px-4 lg:max-w-4xl">
                <div className="relative flex w-full items-center overflow-hidden bg-white px-4 pb-8 pt-14 shadow-2xl sm:px-6 sm:pt-8 md:p-6 lg:p-8">
                  <button
                    type="button"
                    className="absolute right-4 top-4 text-gray-400 hover:text-gray-500 sm:right-6 sm:top-8 md:right-6 md:top-6 lg:right-8 lg:top-8"
                    onClick={() => setOpen(false)}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>

                  <div className="w-full">
                    <div>
                      <div className="px-4 sm:px-0">
                        <h3 className="text-base font-semibold leading-7 text-gray-900">
                          Informacion del Producto
                        </h3>
                      </div>
                      <div className="mt-6 border-t border-gray-100">
                        <dl className="divide-y divide-gray-100">
                          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                            <dt className="text-sm font-medium leading-6 text-gray-900">
                              Descripcion
                            </dt>
                            <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                              {product?.producto}
                            </dd>
                          </div>
                          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                            <dt className="text-sm font-medium leading-6 text-gray-900">
                              Precio en efectivo
                            </dt>
                            <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                              ${" "}
                              {new Intl.NumberFormat("es-AR").format(
                                product?.precioEfectivo
                              )}
                            </dd>
                          </div>
                          {usrRoles.includes("admin") && (
                            <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                              <dt className="text-sm font-medium leading-6 text-gray-900">
                                Proveedor
                              </dt>
                              <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                                {product.proveedor?.toUpperCase()}
                              </dd>
                            </div>
                          )}
                          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                            <dt className="text-sm font-medium leading-6 text-gray-900">
                              Categoría
                            </dt>
                            <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                              {product.categoria}
                            </dd>
                          </div>
                          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                            <dt className="text-sm font-medium leading-6 text-gray-900">
                              Precio en cuotas
                            </dt>
                            <dd className="mt-2 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                              <ul
                                role="list"
                                className="divide-y divide-gray-100 rounded-md border border-gray-200"
                              >
                                {product.precioCuotas?.map((datoCuota) => (
                                  <li
                                    className="flex items-center justify-between py-4 pl-4 pr-5 text-sm leading-6"
                                    key={datoCuota.CantidadCuotas}
                                  >
                                    <div className="flex w-0 flex-1 items-center">
                                      <div className="ml-4 flex min-w-0 flex-1 gap-2">
                                        <span className="truncate font-medium">
                                          {datoCuota.CantidadCuotas} cuotas de
                                        </span>
                                        <span className="flex-shrink-0 text-gray-400">
                                          ${" "}
                                          {new Intl.NumberFormat(
                                            "es-AR"
                                          ).format(
                                            Math.round(
                                              datoCuota.Total /
                                                datoCuota.CantidadCuotas
                                            )
                                          )}
                                        </span>
                                      </div>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            </dd>
                          </div>

                          <div className="px-4 w-full py-6 sm:gap-4 sm:px-0 flex justify-center">
                            <button
                              className="text-xs leading-5 text-white bg-red-950 hover:bg-red-700 rounded-md p-2"
                              onClick={() => handleCart(product)}
                            >
                              {IsSelected
                                ? "Eliminar del carrito"
                                : " Agregar al carrito"}
                            </button>
                          </div>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
