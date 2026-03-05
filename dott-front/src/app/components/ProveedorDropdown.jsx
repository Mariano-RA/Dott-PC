import { Fragment, useState } from "react";
import { Menu, Transition } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { Button, Card } from "@/app/components/ui";
import { PROVEEDORES } from "@/app/products/shared/listingData";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function ProveedorDropdown({ handleSelectProveedor, selectedKey, onChange }) {
  const [internalSelectedKey, setInternalSelectedKey] = useState("");
  const activeSelectedKey = selectedKey !== undefined ? selectedKey : internalSelectedKey;
  const selectedProveedor = PROVEEDORES.find((proveedor) => proveedor.key === activeSelectedKey) || PROVEEDORES[0];

  function onSelectProveedor(proveedor) {
    setInternalSelectedKey(proveedor.key);
    if (onChange) {
      onChange(proveedor.key);
    }
    if (handleSelectProveedor) {
      handleSelectProveedor(proveedor.key);
    }
  }

  return (
    <Menu as="div" className="relative inline-block w-full text-left sm:w-[180px]">
      <div>
        <Menu.Button as={Fragment}>
          <Button variant="secondary" size="md" className="w-full justify-between whitespace-nowrap px-3">
            <span className="truncate text-left">{selectedProveedor.value}</span>
            <ChevronDownIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
          </Button>
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
        <Menu.Items className="absolute right-0 z-10 mt-2 w-full origin-top-right focus:outline-none">
          <Card className="overflow-hidden py-1">
            {PROVEEDORES.map((proveedor) => (
              <Menu.Item key={proveedor.key || "all"}>
                {({ active }) => (
                  <button
                    type="button"
                    className={classNames(
                      active ? "bg-neutral-100 text-foreground" : "text-foreground",
                      "block w-full cursor-pointer px-4 py-2 text-left text-sm"
                    )}
                    onClick={() => onSelectProveedor(proveedor)}
                  >
                    {proveedor.value}
                  </button>
                )}
              </Menu.Item>
            ))}
          </Card>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
