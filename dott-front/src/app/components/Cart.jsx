"use client";
import { Fragment, useState, useEffect, useContext } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { ContextGlobal } from "./utils/global.context";
import CartCard from "./CartCard";

export default function Cart({ action, handleCloseCart }) {
  const [open, setOpen] = useState(false);
  const { state, removeCart } = useContext(ContextGlobal);
  const [totalCart, setTotalCart] = useState(0);
  const [arrSubtotal, setArrSubtotal] = useState([]);
  const [valorCuota, setValorCuota] = useState([]);
  const [valorDolar, setValorDolar] = useState(0);

  const [clientName, setClientName] = useState("");
  const [clientWsp, setClientWsp] = useState("");

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
        handleCloseCart(open);
      }
    };
    handleClose();
  }, [open]);

  // function handleRemoveFromCart(productId) {
  //   const updatedSubtotals = arrSubtotal.filter((sub) => sub.id !== productId);
  //   setArrSubtotal(updatedSubtotals);
  // }

  const calcularCuota = (precio, interes, cuota) => {
    if (interes > 100) {
      return Math.round((precio * (2 + interes / 100)) / cuota);
    }
    return Math.round((precio * (1 + interes / 100)) / cuota);
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
      const { cuotas } = await resVal.json();
      setValorCuota(cuotas);
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
      const { cuotas } = await resVal.json();
      setValorCuota(cuotas);
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

  /**
   * Esta función envía los datos del carrito a Formspree (que te lo enviará por email)
   * sin que el usuario vea nada ni se abra ninguna ventana.
   */
  async function handlePresupuesto() {
    // 1. Leemos los datos de los inputs (del estado de React)
    const nombre = clientName.trim();
    const whatsapp = clientWsp.trim();

    // 2. Validamos que no estén vacíos
    if (!nombre || !whatsapp) {
      alert(
        "Por favor, completa tu nombre y WhatsApp para enviar el presupuesto."
      );
      return; // Cortamos la ejecución
    }

    // 3. Preparamos los datos
    const budgetData = {
      subject: `Nuevo Presupuesto de: ${nombre} (Total: $${totalCart})`,
      cliente_nombre: nombre,
      cliente_whatsapp: whatsapp,
      productos: state.productCart.map(
        (item) =>
          `${item.producto} - ${item.quantity} - ${item.proveedor} - $${
            item.quantity * item.precioEfectivo
          }`
      ),
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
        alert(
          `¡Gracias ${nombre}! Tu presupuesto fue enviado. Te contactaremos por WhatsApp a la brevedad.`
        );
        // Limpiamos los campos
        setClientName("");
        setClientWsp("");
        // Opcional: vaciar el carrito o cerrar el modal
        // removeCart(null, 'all'); // (Depende de cómo funcione tu context)
        // setOpen(false);
      } else {
        alert(
          "Hubo un problema al enviar el presupuesto. Por favor, intenta de nuevo más tarde."
        );
      }
    } catch (error) {
      console.error("Error de conexión:", error);
      alert(
        "Error de conexión. No se pudo enviar el presupuesto, revisa tu internet."
      );
    } finally {
      setIsSubmitting(false); // Reactivamos el botón
    }
  }

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={setOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-500"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-500"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500 sm:duration-700"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500 sm:duration-700"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                    <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
                      <div className="flex items-start justify-between">
                        <Dialog.Title className="text-lg font-medium text-gray-900">
                          Carrito de compras
                        </Dialog.Title>
                        <div className="ml-3 flex h-7 items-center">
                          <button
                            type="button"
                            className="relative -m-2 p-2 text-gray-400 hover:text-gray-500"
                            onClick={() => setOpen(false)}
                          >
                            <span className="absolute -inset-0.5" />
                            <span className="sr-only">Close panel</span>
                            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-8">
                        <div className="flow-root">
                          <ul
                            role="list"
                            className="-my-6 divide-y divide-gray-200"
                          >
                            {state.productCart &&
                              state.productCart.map((product) => (
                                <li key={product.id} className="flex py-6">
                                  {/* <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                                    <img
                                      src={product.imageSrc}
                                      alt={product.imageAlt}
                                      className="h-full w-full object-cover object-center"
                                    />
                                  </div> */}

                                  <CartCard
                                    product={product}
                                    // subTotalProduct={handleSubtotal}
                                    // removeFromArr={handleRemoveFromCart}
                                  />
                                </li>
                              ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 px-4 py-6 sm:px-6">
                      <div className="flex justify-between text-base font-medium text-gray-900">
                        <p>Subtotal</p>
                        <p>
                          ${new Intl.NumberFormat("es-AR").format(totalCart)}
                        </p>
                      </div>
                      <div className="flex flex-col justify-between text-base font-medium text-gray-900 my-3">
                        <p>Valor en cuotas</p>
                        {valorCuota.map((cuota, index) => (
                          <div className="flex justify-end my-1" key={cuota.id}>
                            <p className="mt-0.5 text-sm text-gray-500">
                              {cuota.id} cuotas de:
                            </p>
                            <p className="mt-0.5 text-sm text-gray-500 flex-grow text-right">
                              $
                              {new Intl.NumberFormat("es-AR").format(
                                calcularCuota(
                                  totalCart,
                                  cuota.valorTarjeta,
                                  cuota.id
                                )
                              )}
                            </p>
                          </div>
                        ))}
                      </div>
                      <p className="mt-0.5 text-sm text-gray-500">
                        Gastos de envío calculados al pagar.
                      </p>

                      <div className="mt-6 space-y-4">
                        <div>
                          <label
                            htmlFor="cliente_nombre"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Tu Nombre
                          </label>
                          <div className="mt-1">
                            <input
                              className="rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 text-red-950 w-full"
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
                            className="block text-sm font-medium text-gray-700"
                          >
                            Tu WhatsApp
                          </label>
                          <div className="mt-1">
                            <input
                              className="rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 text-red-950 w-full"
                              type="text"
                              value={clientWsp}
                              onChange={(e) => setClientWsp(e.target.value)}
                              placeholder="Telefono"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-6">
                        <a
                          href="#"
                          className="flex items-center justify-center rounded-md border border-transparent bg-green-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-green-700"
                          onClick={handlePresupuesto}
                        >
                          Enviar pedido
                        </a>
                      </div>
                      <div className="mt-6 flex justify-center text-center text-sm text-gray-500">
                        <p>
                          or
                          <button
                            type="button"
                            className="font-medium text-red-600 hover:text-red-500 ms-1"
                            onClick={() => setOpen(false)}
                          >
                            Continuar comprando
                            <span aria-hidden="true"> &rarr;</span>
                          </button>
                        </p>
                      </div>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
