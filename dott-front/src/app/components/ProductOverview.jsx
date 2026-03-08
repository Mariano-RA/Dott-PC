"use client";
import { Fragment, useContext, useEffect, useMemo, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { ContextGlobal } from "@/contexts/global.context";
import { useUser } from "@auth0/nextjs-auth0/client";
import { getUserRoles } from "@/lib/auth0Roles";

function formatCurrency(value) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

export default function ProductOverview({ action, close, product }) {
  const [open, setOpen] = useState(false);
  const { state, addCart, removeCart } = useContext(ContextGlobal);
  const { user } = useUser();

  const usrRoles = useMemo(() => getUserRoles(user), [user]);
  const isSelected = useMemo(
    () => state.productCart.some((prodCart) => prodCart.id === product?.id),
    [state.productCart, product?.id]
  );

  const cuotas = useMemo(() => {
    return Array.isArray(product?.precioCuotas) ? product.precioCuotas : [];
  }, [product?.precioCuotas]);

  const cuotaDesde = useMemo(() => {
    const primeraCuota = cuotas.find((cuota) => Number(cuota?.CantidadCuotas) > 0);
    if (!primeraCuota) {
      return "Sin cuotas disponibles";
    }

    const cantidad = Number(primeraCuota.CantidadCuotas);
    const porCuota = cantidad > 0 ? Math.round((Number(primeraCuota.Total) || 0) / cantidad) : Number(primeraCuota.Total) || 0;
    return `${cantidad}x ${formatCurrency(porCuota)}`;
  }, [cuotas]);

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
    if (isSelected) {
      removeCart(product.id);
    } else {
      addCart({ ...product, quantity: 1 });
    }
  }

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
          <div className="fixed inset-0 hidden bg-neutral-900/60 transition-opacity md:block" />
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
              <Dialog.Panel className="flex w-full transform text-left text-base transition md:my-8 md:max-w-2xl md:px-4 lg:max-w-3xl">
                <div className="relative flex w-full flex-col overflow-hidden rounded-xl border border-red-100 bg-white shadow-2xl">
                  <button
                    type="button"
                    className="absolute right-4 top-4 rounded-md p-1 text-neutral-500 transition hover:bg-red-50 hover:text-red-900"
                    onClick={() => setOpen(false)}
                  >
                    <span className="sr-only">Cerrar</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>

                  <div className="w-full space-y-5 px-5 pb-6 pt-12 sm:px-7 sm:pt-10">
                    <div className="border-b border-red-100 pb-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-red-700">Detalle del producto</p>
                      <h3 className="mt-1 text-xl font-semibold text-neutral-900">{product?.producto || "Producto"}</h3>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded-full bg-red-100 px-2 py-1 font-medium text-red-900">
                          {product?.categoria || "Sin categoria"}
                        </span>
                        {usrRoles.includes("admin") ? (
                          <span className="rounded-full border border-red-200 bg-white px-2 py-1 font-medium text-red-900">
                            Proveedor: {product?.proveedor?.toUpperCase() || "-"}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-lg border border-red-100 bg-red-50 p-4">
                        <p className="text-xs uppercase tracking-wide text-red-700">Precio contado</p>
                        <p className="mt-1 text-2xl font-semibold text-red-950">{formatCurrency(product?.precioEfectivo)}</p>
                      </div>
                      <div className="rounded-lg border border-red-100 bg-white p-4">
                        <p className="text-xs uppercase tracking-wide text-red-700">Cuotas desde</p>
                        <p className="mt-1 text-lg font-semibold text-neutral-900">{cuotaDesde}</p>
                      </div>
                    </div>

                    <div className="rounded-lg border border-red-100 bg-white p-4">
                      <p className="text-sm font-semibold text-neutral-900">Planes de cuotas</p>
                      {cuotas.length === 0 ? (
                        <p className="mt-2 text-sm text-neutral-600">Este producto no tiene planes de cuotas disponibles.</p>
                      ) : (
                        <ul role="list" className="mt-3 space-y-2">
                          {cuotas.map((datoCuota) => {
                            const cantidadCuotas = Number(datoCuota.CantidadCuotas) || 0;
                            const total = Number(datoCuota.Total) || 0;
                            const porCuota = cantidadCuotas > 0 ? Math.round(total / cantidadCuotas) : total;
                            const planLabel = cantidadCuotas > 0
                              ? `${cantidadCuotas} cuotas`
                              : datoCuota.planLabel || "Plan";

                            return (
                              <li
                                key={datoCuota.planKey || datoCuota.CantidadCuotas}
                                className="flex items-center justify-between rounded-md border border-red-100 px-3 py-2"
                              >
                                <span className="text-sm font-medium text-neutral-800">{planLabel}</span>
                                <span className="text-sm font-semibold text-red-900">{formatCurrency(porCuota)}</span>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2 border-t border-red-100 pt-4">
                      <button
                        type="button"
                        className="rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-900 transition hover:bg-red-50"
                        onClick={() => setOpen(false)}
                      >
                        Cerrar
                      </button>
                      <button
                        type="button"
                        className="rounded-md bg-red-950 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-900"
                        onClick={handleCart}
                      >
                        {isSelected ? "Quitar del carrito" : "Agregar al carrito"}
                      </button>
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
