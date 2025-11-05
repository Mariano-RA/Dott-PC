import { Fragment, useEffect } from "react";
import { Transition } from "@headlessui/react";
import {
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

// Objeto de configuración de estilos (sin cambios)
const alertStyles = {
  success: {
    bgColor: "bg-green-50",
    iconColor: "text-green-400",
    textColor: "text-green-800",
    buttonRing: "focus:ring-green-600",
    buttonHover: "hover:bg-green-100",
  },
  error: {
    bgColor: "bg-red-50",
    iconColor: "text-red-400",
    textColor: "text-red-800",
    buttonRing: "focus:ring-red-600",
    buttonHover: "hover:bg-red-100",
  },
};

export default function Alert({ alert, onClose }) {
  const { show, message, type = "success" } = alert;
  const styles = alertStyles[type] || alertStyles.success;
  const Icon = type === "error" ? XCircleIcon : CheckCircleIcon;

  // Efecto para auto-cerrar (sin cambios)
  useEffect(() => {
    if (show && type === "success") {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, type, onClose]);

  return (
    // 1. Transición principal: Controla el estado 'show'
    <Transition show={show} as={Fragment}>
      {/* Contenedor principal (similar a <Dialog>).
        Usamos 'fixed' y 'z-50' para que flote sobre todo.
      */}
      <div className="relative z-50">
        {/* 2. Fondo (Backdrop) */}
        <Transition.Child
          as={Fragment}
          enter="transition-opacity ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          {/* Este div es el fondo oscuro */}
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75" />
        </Transition.Child>
        {/* 3. Contenedor para centrar el panel */}
        <div className="fixed inset-0 flex items-center justify-center p-4">
          {/* 4. Panel de la Alerta (tu código original) */}
          <Transition.Child
            as={Fragment}
            enter="transition ease-out duration-300"
            enterFrom="opacity-0 translate-y-2"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-2"
          >
            {/* Este es tu <div> original.
              CAMBIO CLAVE: Cambiamos 'w-full' por 'w-full max-w-md'
              para que tenga un ancho máximo y no ocupe toda la pantalla.
            */}
            <div
              className={`rounded-md ${styles.bgColor} p-4 shadow-lg w-full max-w-md`}
            >
              <div className="flex">
                <div className="flex-shrink-0">
                  <Icon
                    className={`h-5 w-5 ${styles.iconColor}`}
                    aria-hidden="true"
                  />
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${styles.textColor}`}>
                    {message}
                  </p>
                </div>
                <div className="ml-auto pl-3">
                  <div className="-mx-1.5 -my-1.5">
                    <button
                      type="button"
                      onClick={onClose}
                      className={`inline-flex rounded-md ${styles.bgColor} p-1.5 ${styles.textColor} ${styles.buttonHover} focus:outline-none focus:ring-2 ${styles.buttonRing} focus:ring-offset-2`}
                    >
                      <span className="sr-only">Cerrar</span>
                      <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Transition.Child>
        </div>{" "}
        {/* Fin del contenedor de centrado */}
      </div>{" "}
      {/* Fin del contenedor principal */}
    </Transition>
  );
}
