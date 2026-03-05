import React, { useContext, useEffect, useState } from "react";
import { ContextGlobal } from "./utils/global.context";
import Quantity from "./Quantity";

const CartCard = ({ product, subTotalProduct, removeFromArr }) => {
  const { state, removeCart, updateCart } = useContext(ContextGlobal);
  const [cantidad, setCantidad] = useState(1);
  // const [subtotal, setSubtotal] = useState();

  function handleCart() {
    if (
      state.productCart.filter((prodCart) => prodCart.id === product.id)
        .length > 0
    ) {
      removeCart(product.id);
      // removeFromArr(product.id);
    }
  }

  function handleCantidad(value) {
    setCantidad(value);
  }

  function updateCartQuantity() {
    updateCart(product.id, cantidad);
  }

  // function handleSubtotal() {
  //   setSubtotal(product.precioEfectivo * cantidad);
  //   let item = {
  //     id: product.id,
  //     subtotal: product.precioEfectivo * cantidad,
  //   };
  //   subTotalProduct(item);
  // }

  useEffect(() => {
    const handleSaveQuantity = () => {
      if (
        state.productCart.filter((prodCart) => prodCart.id === product.id)
          .length > 0
      ) {
        setCantidad(product.quantity);
      }
    };
    handleSaveQuantity();
  }, []);

  useEffect(() => {
    // handleSubtotal();
    updateCartQuantity();
  }, [cantidad]);

  return (
    <div className="flex flex-1 flex-col gap-3">
      <div className="space-y-1">
        <h3 className="break-words text-sm font-semibold leading-5 text-gray-900">
          {product?.producto}
        </h3>
      </div>

      <div className="rounded-md border border-neutral-200 bg-gradient-to-b from-neutral-50 to-white px-3 py-2">
        <div className="flex items-center justify-between gap-3">
          <Quantity handleQuantity={handleCantidad} quantity={product?.quantity} />
          <div className="min-w-0 text-right">
            <p className="text-[11px] uppercase tracking-wide text-gray-500">Total</p>
            <p className="text-sm font-semibold text-gray-900">
              ${new Intl.NumberFormat("es-AR").format(product?.precioEfectivo * product?.quantity)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 text-sm">
        <button
          type="button"
          className="shrink-0 text-xs font-medium text-red-600 hover:text-red-500"
          onClick={() => handleCart()}
        >
          Quitar
        </button>
      </div>
    </div>
  );
};

export default CartCard;
