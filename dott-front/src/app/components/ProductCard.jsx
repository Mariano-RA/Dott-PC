import React, { useContext, useEffect, useState } from "react";
import ProductOverview from "@/app/components/ProductOverview";
import { ContextGlobal } from "./utils/global.context";
import { TrashIcon, ShoppingBagIcon } from "@heroicons/react/24/outline";

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
      addCart(product);
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
    <article className="flex justify-between flex-col p-3 sm:p-6 ring-1 rounded-md ring-red-950 w-40 md:w-52 sm:w-80 mb-5 h-44 sm:h-44 mx-4">
      {/* <img
        src={movie.image}
        alt=""
        width="60"
        height="88"
        className="flex-none rounded-md bg-slate-100"
      /> */}
      <div className="h-full flex flex-col justify-between">
        <h2 className="font-bold text-red-950 text-sm text-center ">
          <div className="line-clamp-3 md:line-clamp-2">
            {product?.producto.toUpperCase()}
          </div>
        </h2>
        <div className="mt-2 flex flex-wrap justify-center text-sm leading-6 text-red-950 flex-col items-center sm:flex-row">
          <dd className="flex items-center">
            $ {new Intl.NumberFormat("es-AR").format(product?.precioEfectivo)}
          </dd>
        </div>
        <div className="flex w-full mt-3 justify-evenly">
          <button
            className=" text-xs text-white bg-red-950 rounded-md p-1 hover:bg-red-800 w-auto sm:w-1/2 me-1"
            style={{ height: "40px" }}
            onClick={() => handleProductOverview(product)}
          >
            Ver más información
          </button>
          <button
            className=" text-xs  text-white bg-red-950 rounded-md p-1 hover:bg-red-800 w-auto "
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
