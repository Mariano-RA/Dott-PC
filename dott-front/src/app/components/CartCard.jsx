import React, { useContext, useEffect, useState } from "react";
import { ContextGlobal } from "./utils/global.context";
import Quantity from "./Quantity";

const CartCard = ({ product, subTotalProduct, removeFromArr }) => {
  const { state, removeCart, updateCart } = useContext(ContextGlobal);
  const [cantidad, setCantidad] = useState(1);
  const [subtotal, setSubtotal] = useState();
  const [IsHovered, setIsHovered] = useState(false);

  function handleCart() {
    if (
      state.productCart.filter((prodCart) => prodCart.id === product.id)
        .length > 0
    ) {
      removeCart(product.id);
      removeFromArr(product.id);
    }
  }

  function handleCantidad(value) {
    setCantidad(value);
  }

  function updateCartQuantity(){
    updateCart(product.id, cantidad);
  }

  function handleSubtotal() {
    setSubtotal(product.precioEfectivo * cantidad);
    let item = {
      id: product.id,
      subtotal: product.precioEfectivo * cantidad,
    };
    subTotalProduct(item);
  }

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
    handleSubtotal();
    updateCartQuantity();
  }, [cantidad]);

  return (
    <div className="ml-4 flex flex-1 flex-col">
      <div>
        <div className="flex justify-between text-base font-medium text-gray-900">
          <h3>
            <a>{product?.producto}</a>
          </h3>
          <p className="ml-4">
            ${new Intl.NumberFormat("es-AR").format(subtotal)}
          </p>
        </div>
      </div>
      <div className="flex flex-1 items-end justify-between text-sm mt-2">
        <div className="flex w-full justify-between">
          {/* <input
            className="w-100 custom-input rounded-3"
            type="number"
            value={cantidad}
            onChange={handleCantidad}
          /> */}
          <Quantity handleQuantity={handleCantidad} />
          <button
            type="button"
            className="font-medium text-red-600 hover:text-red-500"
            onClick={() => handleCart()}
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartCard;
