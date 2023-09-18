import React, { useEffect, useState } from "react";
import { PlusIcon, MinusIcon } from "@heroicons/react/24/outline";
const Quantity = ({ handleQuantity }) => {
  const [cantidad, setCantidad] = useState(1);

  function reduceQuantity() {
    if (cantidad > 1) {
      setCantidad(cantidad - 1);
    }
  }

  function increaseQuantity() {
    setCantidad(cantidad + 1);
  }

  useEffect(() => {
    handleQuantity(cantidad);
  }, [cantidad, setCantidad]);

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        className="w-10 h-10 leading-10 text-gray-600 transition hover:opacity-75 flex justify-center items-center"
        onClick={() => reduceQuantity()}
      >
        <MinusIcon className="h-4 w-4" aria-hidden="true" />
      </button>

      <input
        type="number"
        id="Quantity"
        value={cantidad}
        className="h-10 w-16 rounded border-red-950 border  text-center [-moz-appearance:_textfield] sm:text-sm [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none"
      />

      <button
        type="button"
        className="w-10 h-10 leading-10 text-gray-600 transition hover:opacity-75 flex justify-center items-center"
        onClick={() => increaseQuantity()}
      >
        <PlusIcon className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
};

export default Quantity;
