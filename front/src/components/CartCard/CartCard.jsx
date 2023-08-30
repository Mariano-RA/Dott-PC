/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useContext, useEffect, useState } from "react";
import { ContextGlobal } from "../utils/global.context";

const CartCard = ({ product, subTotalProduct, removeFromArr }) => {
  const { state, removeCart } = useContext(ContextGlobal);
  const [cantidad, setCantidad] = useState(1);
  const [subtotal, setSubtotal] = useState();
  const [IsHovered, setIsHovered] = useState(false);

  const handleHover = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  function handleCart() {
    if (
      state.productCart.filter((prodCart) => prodCart.id === product.id)
        .length > 0
    ) {
      removeCart(product.id);
      removeFromArr(product.id);
    }
  }

  function handleCantidad(e) {
    setCantidad(e.target.value);
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
    handleSubtotal();
  }, [cantidad]);

  return (
    <div className="d-flex justify-content-between py-3 my-2 flex-md-row flex-sm-column flex-column">
      <div
        className="d-flex align-items-center me-3 sizingResponsive"
        style={{ width: "550px" }}
      >
        <p className="m-0">{product.producto}</p>
      </div>
      <div
        className="d-flex align-items-center me-2 ocultar"
        style={{ width: "90px" }}
      >
        <p className="m-0">$ {product.precioEfectivo}</p>
      </div>
      <div className="d-flex justify-content-between addMarginTop">
        <div
          className="d-flex align-items-center me-2"
          style={{ width: "70px" }}
        >
          <input
            className="w-100 custom-input rounded-3"
            type="number"
            value={cantidad}
            onChange={handleCantidad}
          />
        </div>
        <div
          className="d-flex align-items-center me-2 "
          style={{ width: "100px" }}
        >
          <p className="m-0">$ {subtotal}</p>
        </div>
        <div className="d-flex align-items-center ">
          <button
            className="btn btn-outline-rojodott"
            type="button"
            id="btn_cart"
            onClick={() => handleCart()}
            onMouseEnter={handleHover}
            onMouseLeave={handleMouseLeave}
          >
            <img
              src={
                IsHovered
                  ? "/icons/shop-delete-hover.png"
                  : "/icons/shop-delete.png"
              }
              style={{ width: "30px" }}
              alt=""
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartCard;
