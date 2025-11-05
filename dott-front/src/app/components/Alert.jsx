import { Fragment, useEffect, useRef, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
// Importamos ambos íconos
import {
  ExclamationCircleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

export default function Alert({
  alertText,
  action,
  handleCloseAlert,
  type = "error", // Nueva prop 'type', con 'error' como valor por defecto
}) {
  const [open, setOpen] = useState(false);
  const cancelButtonRef = useRef(null);

  // Este useEffect maneja la VISIBILIDAD del modal basado en 'action'
  useEffect(() => {
    if (action) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [action]);

  // Función centralizada para CERRAR el modal
  // Llama tanto a setOpen como a la función del padre.
  const handleClose = () => {
    setOpen(false);
    if (handleCloseAlert) {
      handleCloseAlert(); // Notificamos al padre que se cerró
    }
  };

  // --- Lógica de renderizado dinámico ---
  const isSuccess = type === "success";

  // Definimos contenido dinámico basado en el 'type'
  const config = {
    title: isSuccess ? "Éxito" : "Atención",
    Icon: isSuccess ? CheckCircleIcon : ExclamationCircleIcon,
    iconBgClass: isSuccess ? "bg-green-100" : "bg-red-100",
    iconTextClass: isSuccess ? "text-green-600" : "text-red-600", // Corregido: error usaba texto verde
  };
  // --- Fin de la lógica dinámica ---

  return (
    <Transition.Root show={open} as={Fragment}>
      {/* Usamos nuestra función handleClose para el evento onClose del Dialog */}
      <Dialog
        as="div"
        className="relative z-10"
        initialFocus={cancelButtonRef}
        onClose={handleClose}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    {/* Contenedor de ícono dinámico */}
                    <div
                      className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${config.iconBgClass} sm:mx-0 sm:h-10 sm:w-10`}
                    >
                      {/* Componente de ícono dinámico */}
                      <config.Icon
                        className={`h-6 w-6 ${config.iconTextClass}`}
                        aria-hidden="true"
                      />
                    </div>
                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                      {/* Título dinámico */}
                      <Dialog.Title
                        as="h3"
                        className="text-base font-semibold leading-6 text-gray-900"
                      >
                        {config.title}
                      </Dialog.Title>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">{alertText}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  {/* Botón usa handleClose y texto actualizado */}
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                    onClick={handleClose}
                    ref={cancelButtonRef}
                  >
                    Cerrar
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
