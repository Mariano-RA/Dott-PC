import { Fragment, useState } from "react";
import { Menu, Transition } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

const proveedores = [
  { key: "", value: "Todos los proveedores" },
  { key: "air", value: "Air" },
  { key: "eikon", value: "Eikon" },
  { key: "elit", value: "Elit" },
  { key: "mega", value: "Mega" },
  { key: "hdc", value: "Hdc" },
  { key: "invid", value: "Invid" },
  { key: "nb", value: "Nb" },
];

export default function ProveedorDropdown({ handleSelectProveedor }) {
  const [selectedProveedor, setSelectedProveedor] = useState(proveedores[0]);

  function onSelectProveedor(proveedor) {
    setSelectedProveedor(proveedor);
    handleSelectProveedor(proveedor.key); // Pasa solo la key (valor para filtrar)
  }

  return (
    <Menu
      as="div"
      className="relative inline-block text-left"
      style={{ width: "140px" }}
    >
      <div>
        <Menu.Button className="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-red-950 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
          {selectedProveedor.value}
          <ChevronDownIcon
            className="-mr-1 h-5 w-5 text-gray-400"
            aria-hidden="true"
          />
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-full origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            {proveedores.map((proveedor, index) => (
              <Menu.Item key={index}>
                {({ active }) => (
                  <a
                    className={classNames(
                      active ? "bg-gray-100 text-red-700" : "text-red-950",
                      "block px-4 py-2 text-sm cursor-pointer"
                    )}
                    onClick={() => onSelectProveedor(proveedor)}
                  >
                    {proveedor.value}
                  </a>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
