"use client";
import { Fragment, useState, useEffect, useContext, useRef } from "react";
import { Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { ContextGlobal } from "./utils/global.context";
import CartCard from "./CartCard";
import Alert from "../components/Alert";

export default function Cart({ action, handleCloseCart }) {
  const [open, setOpen] = useState(false);
  const closeButtonRef = useRef(null);
  const { state, removeCart } = useContext(ContextGlobal);
  const [totalCart, setTotalCart] = useState(0);
  const [arrSubtotal, setArrSubtotal] = useState([]);
  const [valorCuota, setValorCuota] = useState([]);
  const [valorDolar, setValorDolar] = useState(0);

  const [clientName, setClientName] = useState("");
  const [clientWsp, setClientWsp] = useState("");

  const [alerta, setAlerta] = useState({
    show: false,
    message: "",
    type: "error", // Valor inicial
  });

  // Función para CERRAR la alerta (se la pasamos al componente Alert)
  const handleCloseAlert = () => {
    setAlerta((prev) => ({ ...prev, show: false }));
  };

  const closeCart = () => {
    setOpen(false);
    handleCloseCart(false);
  };

  useEffect(() => {
    if (action) {
      setOpen(true);
    }
  }, [action]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        closeCart();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, handleCloseCart]);

  useEffect(() => {
    if (open) {
      closeButtonRef.current?.focus();
    }
  }, [open]);

  // function handleRemoveFromCart(productId) {
  //   const updatedSubtotals = arrSubtotal.filter((sub) => sub.id !== productId);
  //   setArrSubtotal(updatedSubtotals);
  // }

  const calcularPlan = (precio, tasa, planKey) => {
    const total = Math.round(precio * (1 + Number(tasa || 0) / 100));
    const cuotas = Number.parseInt(String(planKey), 10);

    if (Number.isFinite(cuotas) && cuotas > 0) {
      return {
        cuotas,
        total,
        porCuota: Math.round(total / cuotas),
      };
    }

    return {
      cuotas: 0,
      total,
      porCuota: total,
    };
  };

  // function handleSubtotal(data) {
  //   if (!arrSubtotal.find((prod) => prod.id === data.id)) {
  //     setArrSubtotal((arr) => [...arr, data]);
  //   } else {
  //     const newArr = arrSubtotal.map((product) => {
  //       if (product.id === data.id) {
  //         return { ...product, subtotal: data.subtotal };
  //       }
  //       return product;
  //     });

  //     setArrSubtotal(newArr);
  //   }
  // }

  useEffect(() => {
    const getSubtotal = async () => {
      const resVal = await fetch("/api/nest/quote");
      const { plans } = await resVal.json();
      setValorCuota(plans || []);
    };
    getSubtotal();
  }, [state]);

  function handleTotalProduct() {
    let total = state.productCart.reduce(
      (acc, item) => acc + item.precioEfectivo * item.quantity,
      0
    );
    // let total = arrSubtotal.reduce((acc, item) => acc + item.subtotal, 0);
    setTotalCart(total);
  }

  useEffect(() => {
    const getValorDolar = async () => {
      const resVal = await fetch("/api/nest/dolar");
      const { dolar } = await resVal.json();
      setValorDolar(dolar);
    };
    getValorDolar();
  }, []);

  useEffect(() => {
    const getCuotas = async () => {
      const resVal = await fetch("/api/nest/quote");
      const { plans } = await resVal.json();
      setValorCuota(plans || []);
    };
    getCuotas();
  }, []);

  useEffect(() => {
    handleTotalProduct();
  }, [state, setTotalCart]);

  // function getTotalForSend(itemId){
  //   var mount = 0;
  //   state.productCart.map((product) => {
  //     if (product.id === itemId) {
  //       mount = product.subtotal;
  //     }
  //   });
  //   return mount;
  // }

  // function handlePresupuesto() {
  //   let message = `Hola!\n Productos de interes:\n\n${state.productCart
  //     .map(
  //       (item) =>
  //         `${item.producto} - ${item.quantity} - ${item.proveedor} - $${item.quantity * item.precioEfectivo}`
  //     )
  //     .join("\n")}`;

  //   // message += "\n\nPrecios de Cuotas";
  //   // valorCuota.forEach((cuota, index) => {
  //   //   const cuotaPrice = calcularCuota(totalCart, cuota.valorTarjeta, cuota.id);
  //   //   message += `\n${cuota.id} cuotas de: $${cuotaPrice}`;
  //   // });

  //   // Agregar el total de la compra al mensaje
  //   message += `\ntotal en efectivo: $${totalCart}`;
  //   const whatsappLink = `https://wa.me/5493512861992?text=${encodeURIComponent(
  //     message
  //   )}`;
  //   // window.location.href = whatsappLink;
  //   window.open(whatsappLink, "_blank");
  // }

  async function handlePresupuesto() {
    // 1. Leemos los datos de los inputs (del estado de React)
    const nombre = clientName.trim();
    const whatsapp = clientWsp.trim();

    // 2. Validamos que no estén vacíos
    if (!nombre || !whatsapp) {
      setAlerta({
        show: true,
        message:
          "Por favor, completa tu nombre y WhatsApp para enviar el presupuesto. ",
        type: "error",
      });
      return; // Cortamos la ejecución
    }

    // 3. Preparamos los datos
    // 3. Preparamos los datos
    const budgetData = {
      subject: `Presupuesto para ${nombre}`,
      cliente_nombre: nombre,
      cliente_whatsapp: whatsapp,

      // --- CAMBIO SUGERIDO AQUÍ ---
      productos: state.productCart
        .map(
          (item) =>
            // Usamos un formato más claro para cada ítem
            `Producto: ${item.producto}\n` +
            `Cantidad: ${item.quantity}\n` +
            `Proveedor: ${item.proveedor}\n` +
            `Precio en efectivo: $${item.quantity * item.precioEfectivo}`
        )
        .join("\n====================\n"), // <-- Une todo con un separador
      // --- FIN DEL CAMBIO ---

      total_efectivo: `$${totalCart}`,
    };

    // 4. Enviamos a Formspree
    try {
      const response = await fetch("https://formspree.io/f/xqagravw", {
        method: "POST",
        body: JSON.stringify(budgetData),
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      // 5. Manejamos la respuesta
      if (response.ok) {
        setAlerta({
          show: true,
          message: `¡Gracias ${nombre}! Tu presupuesto fue enviado. Te contactaremos por WhatsApp a la brevedad.`,
          type: "success",
        });
        // Limpiamos los campos
        setClientName("");
        setClientWsp("");
      } else {
        setAlerta({
          show: true,
          message:
            "Hubo un problema al enviar el presupuesto. Por favor, intenta de nuevo más tarde.",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error de conexión:", error);
      setAlerta({
        show: true,
        message:
          "Error de conexión. No se pudo enviar el presupuesto, revisa tu internet.",
        type: "error",
      });
    }
  }

  return (
    <>
      <Transition.Root show={open} as={Fragment}>
        <div className="relative z-20" role="dialog" aria-modal="true" aria-label="Carrito de compras">
          <Transition.Child
            as={Fragment}
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
              <div className="pointer-events-none absolute inset-y-0 right-0 flex max-w-full pl-0 sm:pl-10">
                <Transition.Child
                  as={Fragment}
                  enter="transform transition ease-in-out duration-500 sm:duration-700"
                  enterFrom="translate-x-full"
                  enterTo="translate-x-0"
                  leave="transform transition ease-in-out duration-500 sm:duration-700"
                  leaveFrom="translate-x-0"
                  leaveTo="translate-x-full"
                >
                  <div className="pointer-events-auto w-screen max-w-none sm:max-w-lg">
                    <div className="flex h-full flex-col overflow-hidden border-l border-red-100 bg-white shadow-2xl">
                      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
                        <div className="flex items-start justify-between">
                          <h2 className="text-lg font-semibold text-neutral-900">
                            Carrito ({state.productCart?.length || 0})
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
                              <XMarkIcon
                                className="h-6 w-6"
                                aria-hidden="true"
                              />
                            </button>
                          </div>
                        </div>

                        <div className="mt-8">
                          <div className="flow-root">
                            {!state.productCart?.length ? (
                              <div className="rounded-xl border border-red-100 bg-gradient-to-b from-red-50 to-white p-8 text-center">
                                <p className="text-base font-semibold text-red-950">Tu carrito esta vacio</p>
                                <p className="mt-2 text-sm text-neutral-600">
                                  Agrega productos para ver el resumen y enviar tu pedido.
                                </p>
                              </div>
                            ) : (
                              <ul role="list" className="divide-y divide-neutral-200">
                                {state.productCart.map((product) => (
                                  <li
                                    key={product.id}
                                    className="py-4 transition-colors hover:bg-red-50/30"
                                  >
                                    <CartCard
                                      product={product}
                                      // subTotalProduct={handleSubtotal}
                                      // removeFromArr={handleRemoveFromCart}
                                    />
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="sticky bottom-0 border-t border-red-100 bg-white/95 px-4 py-6 backdrop-blur sm:px-6">
                        <div className="flex justify-between text-base font-semibold text-neutral-900">
                          <p>Subtotal</p>
                          <p>
                            ${new Intl.NumberFormat("es-AR").format(totalCart)}
                          </p>
                        </div>
                        <div className="my-3 rounded-md border border-neutral-200 bg-neutral-50 p-3">
                          <p className="text-sm font-semibold text-neutral-900">Valor en cuotas</p>
                          {valorCuota.map((plan) => {
                            const calculo = calcularPlan(totalCart, plan.tasa, plan.planKey);
                            const label = plan.label || plan.planKey;

                            return (
                              <div
                                className="mt-2 flex items-center justify-end gap-2"
                                key={plan.planKey || label}
                              >
                                <p className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-900">
                                  {calculo.cuotas > 0 ? `${calculo.cuotas} cuotas de:` : `${label}:`}
                                </p>
                                <p className="flex-grow text-right text-sm text-neutral-700">
                                  $
                                  {new Intl.NumberFormat("es-AR").format(
                                    calculo.cuotas > 0 ? calculo.porCuota : calculo.total
                                  )}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                        <p className="mt-0.5 text-sm text-neutral-600">
                          Gastos de envío calculados al pagar.
                        </p>

                        <div className="mt-6 space-y-4">
                          <div>
                            <label
                              htmlFor="cliente_nombre"
                              className="block text-sm font-medium text-neutral-800"
                            >
                              Tu Nombre
                            </label>
                            <div className="mt-1">
                              <input
                                className="w-full rounded-md border border-neutral-300 p-2 text-red-950 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
                                type="text"
                                value={clientName}
                                onChange={(e) => setClientName(e.target.value)}
                                placeholder="Nombre"
                              />
                            </div>
                          </div>
                          <div>
                            <label
                              htmlFor="cliente_wsp"
                              className="block text-sm font-medium text-neutral-800"
                            >
                              Tu WhatsApp
                            </label>
                            <div className="mt-1">
                              <input
                                className="w-full rounded-md border border-neutral-300 p-2 text-red-950 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
                                type="text"
                                value={clientWsp}
                                onChange={(e) => setClientWsp(e.target.value)}
                                placeholder="Telefono"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="mt-6">
                          <button
                            type="button"
                            className="flex w-full items-center justify-center rounded-md border border-transparent bg-red-950 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-red-900"
                            onClick={handlePresupuesto}
                          >
                            Enviar pedido
                          </button>
                        </div>
                        <div className="mt-6 flex justify-center text-center text-sm text-neutral-600">
                          <p>
                            or
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
        type={alerta.type} // Aquí pasas el tipo dinámicamente
      />
    </>
  );
}
