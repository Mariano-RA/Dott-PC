import React, { useContext, useEffect, useState } from "react";
import ProductOverview from "@/app/components/ProductOverview";
import { ContextGlobal } from "./utils/global.context";
import {
  TrashIcon,
  ShoppingBagIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

const ProductCard = ({ product }) => {
  const [show, setShow] = useState(false);
  const [productDetail, setProductDetail] = useState({});
  const { state, addCart, removeCart } = useContext(ContextGlobal);
  const [IsSelected, setIsSelected] = useState(false);

  const handleProductOverview = (product) => {
    setProductDetail(product);
    setShow(true);
  };
  function close(action) {
    setShow(action);
  }

  function handleCart() {
    if (
      state.productCart.filter((prodCart) => prodCart.id === product.id)
        .length > 0
    ) {
      removeCart(product.id);
      setIsSelected(false);
    } else {
      addCart({ ...product, quantity: 1 });
      setIsSelected(true);
    }
  }

  useEffect(() => {
    const handleSelected = () => {
      if (
        state.productCart.filter((prodCart) => prodCart.id === product.id)
          .length > 0
      ) {
        setIsSelected(true);
      } else {
        setIsSelected(false);
      }
    };
    handleSelected();
  }, [product]);

  return (
    <article className="flex justify-between flex-col p-3 sm:p-6 ring-1 rounded-md ring-red-950 w-4/5 md:w-52 sm:w-80 mb-5 h-28 sm:h-44 2xl:mx-4 mx-0 ">
      {/* <img
        src={movie.image}
        alt=""
        width="60"
        height="88"
        className="flex-none rounded-md bg-slate-100"
      /> */}
      <div className="h-full flex flex-row sm:flex-col sm:justify-between justify-end flex-wrap">
        <div className="font-semibold text-red-950 text-xs sm:text-sm text-left sm:text-center w-full line-clamp-3 md:line-clamp-2">
          {product?.producto.toUpperCase()}
        </div>
        <div className="flex justify-end sm:justify-center text-sm leading-6 text-red-950 items-center mt-0 sm:mt-2 mr-2 sm:mr-0 w-1/2 sm:w-full">
          <p>
            {new Intl.NumberFormat("es-AR", {
              style: "currency",
              currency: "ARS",
              maximumFractionDigits: 0,
            }).format(product?.precioEfectivo || 0)}
          </p>
        </div>
        <div className="flex mt-0 sm:mt-3 justify-end sm:justify-evenly w-auto sm:w-full items-center">
          <button
            className=" text-xs  text-white bg-red-950 rounded-md p-1 hover:bg-red-800 w-auto "
            style={{ height: "40px" }}
            onClick={() => handleProductOverview(product)}
          >
            <InformationCircleIcon className="h-6 w-6" aria-hidden="true" />{" "}
          </button>
          <button
            className=" text-xs  text-white bg-red-950 rounded-md p-1 hover:bg-red-800 w-auto ml-2 sm:ml-0"
            style={{ height: "40px" }}
            onClick={() => handleCart(product)}
          >
            {IsSelected == false ? (
              <ShoppingBagIcon className="h-6 w-6" aria-hidden="true" />
            ) : (
              <TrashIcon className="h-6 w-6" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
      {productDetail && (
        <ProductOverview action={show} close={close} product={productDetail} />
      )}
    </article>
  );
};

export default ProductCard;
