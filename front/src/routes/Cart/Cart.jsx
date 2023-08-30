/* eslint-disable no-unused-vars */
import React, { useContext, useEffect, useState } from "react";
import CartCard from "../../components/CartCard/CartCard";
import { ContextGlobal } from "../../components/utils/global.context";

const Cart = () => {
  const { state } = useContext(ContextGlobal);
  const [products, setProducts] = useState([]);
  const [totalCart, setTotalCart] = useState(0);
  const [arrSubtotal, setArrSubtotal] = useState([]);
  const [valorCuota, setValorCuota] = useState([]);

  function handleCart() {
    setProducts(state.productCart);
  }

  function handleValorCuota() {
    setValorCuota(state.valorCuotas);
  }

  function handleRemoveFromCart(productId) {
    const updatedSubtotals = arrSubtotal.filter((sub) => sub.id !== productId);
    setArrSubtotal(updatedSubtotals);
  }

  const calcularCuota = (precio, interes, cuota) => {
    return Math.round(precio / interes / cuota);
  };

  function handleSubtotal(data) {
    if (!arrSubtotal.find((prod) => prod.id === data.id)) {
      setArrSubtotal((arr) => [...arr, data]);
    } else {
      const newArr = arrSubtotal.map((product) => {
        if (product.id === data.id) {
          return { ...product, subtotal: data.subtotal };
        }
        return product;
      });
      console.log(newArr);
      setArrSubtotal(newArr);
    }
  }

  function handletotal() {
    const total = arrSubtotal.reduce((acc, item) => acc + item.subtotal, 0);
    setTotalCart(total);
  }

  useEffect(() => {
    handleCart();
    handleValorCuota();
  }, [state]);

  useEffect(() => {
    handletotal();
  }, [arrSubtotal, setTotalCart]);

  return (
    <div className="d-flex w-100 justify-content-around">
      <div className="pb-3">
        <p className="fw-bold fs-3 text-verdeoscurodott m-0 p-0">
          Productos en el carrito:
        </p>
      </div>
      <div className="d-flex flex-lg-row justify-content-around flex-md-column  flex-sm-column flex-column">
        <div className="d-flex flex-column">
          {products.map((item, index) => (
            <div key={item.id}>
              {index == 0 ? <hr className="text-verdedott fs-4" /> : ""}
              <CartCard
                product={item}
                subTotalProduct={handleSubtotal}
                removeFromArr={handleRemoveFromCart}
              />
              <hr className="text-verdedott fs-3" />
            </div>
          ))}
        </div>
        <div
          className="d-flex flex-column border border-verdedott rounded-3 mt-3"
          style={{ height: "fit-content" }}
        >
          <div className="px-3 py-2">
            <p className="fs-5 ">Total:</p>
            <p className="fw-bold fs-4 text-verdedottclaro">${totalCart}</p>
          </div>
          {valorCuota.map((cuota, index) => (
            <div
              key={cuota.id}
              className="border-top border-verdedott px-3 py-2"
            >
              <p className="fs-6">{cuota.id} cuotas de:</p>
              <p
                className="fw-bold text-verdedottclaro p-0 m-0"
                style={{ fontSize: "1.1rem" }}
              >
                ${calcularCuota(totalCart, cuota.valorTarjeta, cuota.id)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Cart;
