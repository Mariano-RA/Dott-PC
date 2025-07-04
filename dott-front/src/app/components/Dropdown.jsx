import { Fragment, useState } from "react";
import { Menu, Transition } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

const sortTypes = [
  {
    key: "mayor",
    value: "Mayor Precio",
  },
  {
    key: "menor",
    value: "Menor Precio",
  },
  {
    key: "nombreAsc",
    value: "Nombre, A - Z",
  },
  {
    key: "nombreDesc",
    value: "Nombre, Z - A",
  },
];

export default function Dropdown({ handleSort }) {
  const [selectedOption, setSelectedOption] = useState("");

  function handleSelectedSort(sortType) {
    setSelectedOption(sortType.value);
    handleSort(sortType.key);
  }

  return (
    <Menu
      as="div"
      className="relative inline-block text-left me-2 mb-2 md:mb-0"
      style={{ width: "140px" }}
    >
      <div>
        <Menu.Button className="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-red-950 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
          {selectedOption ? selectedOption : "Ordenar por"}
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
        <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            {sortTypes.map((sortType, index) => (
              <Menu.Item key={index}>
                {({ active }) => (
                  <a
                    // href="#"
                    className={classNames(
                      active ? "bg-gray-100 text-red-700" : "text-red-950",
                      "block px-4 py-2 text-sm"
                    )}
                    onClick={() => handleSelectedSort(sortType)}
                  >
                    {sortType.value}
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
