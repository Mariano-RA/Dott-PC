import { Fragment, useState } from "react";
import { Menu, Transition } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { Button, Card } from "@/app/components/ui";
import { SORT_TYPES } from "@/app/products/shared/listingData";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function Dropdown({ handleSort, selectedKey, onChange }) {
  const [internalSelectedKey, setInternalSelectedKey] = useState("");
  const activeSelectedKey = selectedKey !== undefined ? selectedKey : internalSelectedKey;
  const selectedLabel = SORT_TYPES.find((sortType) => sortType.key === activeSelectedKey)?.value || "Ordenar por";

  function handleSelectedSort(sortType) {
    setInternalSelectedKey(sortType.key);
    if (onChange) {
      onChange(sortType.key);
    }
    if (handleSort) {
      handleSort(sortType.key);
    }
  }

  return (
    <Menu as="div" className="relative mb-2 inline-block w-full text-left sm:me-2 sm:w-[180px] md:mb-0">
      <div>
        <Menu.Button as={Fragment}>
          <Button variant="secondary" size="md" className="w-full justify-between whitespace-nowrap px-3">
            <span className="truncate text-left">{selectedLabel}</span>
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
            {SORT_TYPES.map((sortType) => (
              <Menu.Item key={sortType.key}>
                {({ active }) => (
                  <button
                    type="button"
                    className={classNames(
                      active ? "bg-neutral-100 text-foreground" : "text-foreground",
                      "block w-full px-4 py-2 text-left text-sm"
                    )}
                    onClick={() => handleSelectedSort(sortType)}
                  >
                    {sortType.value}
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
