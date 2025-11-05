import { Fragment, useEffect } from "react";
import { Transition } from "@headlessui/react";
import {
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

// Objeto de configuración para los estilos, así no ensuciamos el JSX
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
  const { show, message, type = "success" } = alert; // Desestructuramos el config

  // Obtenemos los estilos correctos (default a 'success' si 'type' no se reconoce)
  const styles = alertStyles[type] || alertStyles.success;
  const Icon = type === "error" ? XCircleIcon : CheckCircleIcon;

  // Efecto para auto-cerrar la alerta
  useEffect(() => {
    if (show && type === "success") {
      // Solo se auto-cierra si es 'success'
      const timer = setTimeout(() => {
        onClose(); // Llama a la función del padre para cerrar
      }, 3000); // 3 segundos

      return () => clearTimeout(timer); // Limpia el timer si el componente se desmonta
    }
  }, [show, type, onClose]);

  return (
    <Transition
      show={show}
      as={Fragment}
      enter="transition ease-out duration-300"
      enterFrom="opacity-0 translate-y-2"
      enterTo="opacity-100 translate-y-0"
      leave="transition ease-in duration-200"
      leaveFrom="opacity-100 translate-y-0"
      leaveTo="opacity-0 translate-y-2"
    >
      <div className={`rounded-md ${styles.bgColor} p-4 shadow-lg w-full`}>
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
    </Transition>
  );
}
