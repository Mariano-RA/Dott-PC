import React, { useEffect, useState } from "react";
import { PlusIcon, MinusIcon } from "@heroicons/react/24/outline";

const Quantity = ({ quantity, handleQuantity }) => {
  const [cantidad, setCantidad] = useState(1);

  useEffect(() => {
    const handleDefaultQuantity = () => {
      if (quantity != null && quantity > 0) {
        setCantidad(quantity);
      }
    };
    handleDefaultQuantity();
  }, []);

  function reduceQuantity() {
    if (cantidad > 1) {
      setCantidad(cantidad - 1);
    }
  }

  function increaseQuantity() {
    setCantidad(cantidad + 1);
  }

  function handleInputQuantity(e) {
    const raw = e.target.value;
    if (raw === "") {
      setCantidad(1);
      return;
    }

    const parsed = Number.parseInt(raw, 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      setCantidad(parsed);
    }
  }

  useEffect(() => {
    handleQuantity(cantidad);
  }, [cantidad, setCantidad]);

  return (
    <div className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-white p-1 shadow-sm">
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center rounded-md text-red-800 transition hover:bg-red-50 hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-red-400"
        onClick={() => reduceQuantity()}
        aria-label="Disminuir cantidad"
      >
        <MinusIcon className="h-4 w-4" aria-hidden="true" />
      </button>

      <input
        type="number"
        id="Quantity"
        value={cantidad}
        onChange={handleInputQuantity}
        min="1"
        className="h-8 w-12 rounded-md border border-red-200 bg-red-50/40 text-center text-sm font-medium text-red-950 focus:outline-none focus:ring-2 focus:ring-red-400 [-moz-appearance:_textfield] [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none"
      />

      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center rounded-md text-red-800 transition hover:bg-red-50 hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-red-400"
        onClick={() => increaseQuantity()}
        aria-label="Aumentar cantidad"
      >
        <PlusIcon className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
};

export default Quantity;
