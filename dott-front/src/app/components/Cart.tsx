"use client";

import { Fragment, useState, useEffect, useRef } from "react";
import { Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import CartCard from "./CartCard";
import Alert from "./Alert";
import { useCartData } from "./hooks/useCartData";

export interface CartProps {
  action: boolean;
  handleCloseCart: (open: boolean) => void;
}

export default function Cart({ action, handleCloseCart }: CartProps) {
  const [open, setOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const {
    productCart,
    totalCart,
    displayPlans,
    clientName,
    setClientName,
    clientWsp,
    setClientWsp,
    alerta,
    handleCloseAlert,
    handlePresupuesto,
  } = useCartData(open);

  const closeCart = () => {
    setOpen(false);
    handleCloseCart(false);
  };

  useEffect(() => {
    if (action) setOpen(true);
  }, [action]);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeCart();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, handleCloseCart]);

  useEffect(() => {
    if (open) closeButtonRef.current?.focus();
  }, [open]);

  return (
    <>
      <Transition.Root show={open} as={Fragment}>
        <div className="relative z-20" role="dialog" aria-modal="true" aria-label="Carrito de compras">
          <Transition.Child
            as="div"
            className="contents"
            enter="ease-in-out duration-500"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in-out duration-500"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div
              className="fixed inset-x-0 bottom-0 top-16 bg-neutral-900/60 transition-opacity"
              onClick={closeCart}
            />
          </Transition.Child>

          <div className="fixed inset-x-0 bottom-0 top-16 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="pointer-events-none absolute inset-y-0 right-0 flex h-full max-w-full pl-0 sm:pl-10">
                <Transition.Child
                  as="div"
                  className="contents"
                  enter="transform transition ease-in-out duration-500 sm:duration-700"
                  enterFrom="translate-x-full"
                  enterTo="translate-x-0"
                  leave="transform transition ease-in-out duration-500 sm:duration-700"
                  leaveFrom="translate-x-0"
                  leaveTo="translate-x-full"
                >
                  <div className="pointer-events-auto flex h-full w-screen max-w-none flex-col sm:max-w-lg">
                    <div className="flex min-h-0 flex-1 flex-col overflow-hidden border-l border-red-100 bg-white shadow-2xl">
                      <div className="flex shrink-0 items-start justify-between border-b border-red-100 px-4 py-4 sm:px-6">
                        <h2 className="text-lg font-semibold text-neutral-900">
                          Carrito ({productCart?.length ?? 0})
                        </h2>
                        <div className="ml-3 flex h-7 items-center">
                          <button
                            ref={closeButtonRef}
                            type="button"
                            className="relative -m-2 rounded-md p-2 text-neutral-500 hover:bg-red-50 hover:text-red-900"
                            onClick={closeCart}
                          >
                            <span className="absolute -inset-0.5" />
                            <span className="sr-only">Cerrar carrito</span>
                            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                          </button>
                        </div>
                      </div>

                      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6">
                        {!productCart?.length ? (
                          <div className="rounded-xl border border-red-100 bg-gradient-to-b from-red-50 to-white p-8 text-center">
                            <p className="text-base font-semibold text-red-950">Tu carrito esta vacio</p>
                            <p className="mt-2 text-sm text-neutral-600">
                              Agrega productos para ver el resumen y enviar tu pedido.
                            </p>
                          </div>
                        ) : (
                          <ul role="list" className="divide-y divide-neutral-200">
                            {productCart.map((product) => (
                              <li
                                key={product.id}
                                className="py-4 transition-colors hover:bg-red-50/30"
                              >
                                <CartCard product={product} subTotalProduct={undefined} removeFromArr={undefined} />
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <div className="shrink-0 border-t border-red-100 bg-white px-4 py-4 sm:px-6">
                        <div className="flex justify-between text-base font-semibold text-neutral-900">
                          <p>Subtotal</p>
                          <p>${new Intl.NumberFormat("es-AR").format(totalCart)}</p>
                        </div>
                        <details className="my-3 rounded-md border border-neutral-200 bg-neutral-50 open:pb-1">
                          <summary className="cursor-pointer list-none px-3 py-2 text-sm font-semibold text-neutral-900 marker:content-none [&::-webkit-details-marker]:hidden">
                            <span className="flex items-center justify-between gap-2">
                              <span>Valor en cuotas</span>
                              <span className="text-xs font-medium text-neutral-500">Ver planes</span>
                            </span>
                          </summary>
                          <div className="max-h-36 overflow-y-auto px-3 pb-2">
                            <p className="text-xs text-neutral-500">Referencia (misma fórmula que la calculadora)</p>
                            {displayPlans.map((plan) => (
                              <div
                                className="mt-2 flex items-center justify-end gap-2"
                                key={plan.planKey || plan.label}
                              >
                                <p className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-900">
                                  {plan.cuotas > 0
                                    ? `${plan.label || `${plan.cuotas} cuotas`} de:`
                                    : `${plan.label}:`}
                                </p>
                                <p className="flex-grow text-right text-sm text-neutral-700">
                                  ${new Intl.NumberFormat("es-AR").format(plan.cuotas > 0 ? plan.porCuota : plan.total)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </details>
                        <p className="text-xs text-neutral-600">Gastos de envío calculados al pagar.</p>

                        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div>
                            <label
                              htmlFor="cliente_nombre"
                              className="block text-sm font-medium text-neutral-800"
                            >
                              Tu Nombre
                            </label>
                            <input
                              id="cliente_nombre"
                              className="mt-1 w-full rounded-md border border-neutral-300 p-2 text-red-950 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
                              type="text"
                              value={clientName}
                              onChange={(e) => setClientName(e.target.value)}
                              placeholder="Nombre"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="cliente_wsp"
                              className="block text-sm font-medium text-neutral-800"
                            >
                              Tu WhatsApp
                            </label>
                            <input
                              id="cliente_wsp"
                              className="mt-1 w-full rounded-md border border-neutral-300 p-2 text-red-950 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
                              type="text"
                              value={clientWsp}
                              onChange={(e) => setClientWsp(e.target.value)}
                              placeholder="Telefono"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          className="mt-4 flex w-full items-center justify-center rounded-md border border-transparent bg-red-950 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-red-900"
                          onClick={handlePresupuesto}
                        >
                          Enviar pedido
                        </button>
                        <div className="mt-3 flex justify-center text-center text-sm text-neutral-600">
                          <p>
                            o
                            <button
                              type="button"
                              className="ms-1 font-medium text-red-700 hover:text-red-600"
                              onClick={closeCart}
                            >
                              Continuar comprando
                              <span aria-hidden="true"> &rarr;</span>
                            </button>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Transition.Child>
              </div>
            </div>
          </div>
        </div>
      </Transition.Root>
      <Alert
        alertText={alerta.message}
        action={alerta.show}
        handleCloseAlert={handleCloseAlert}
        type={alerta.type}
      />
    </>
  );
}
