import React, { useState } from "react";
import ProductOverview from "@/app/components/ProductOverview";

const ProductCard = ({ product }) => {
  const [show, setShow] = useState(false);
  const [productDetail, setProductDetail] = useState({});

  const handleProductOverview = (product) => {
    setProductDetail(product);
    setShow(true);
  };
  function close(action) {
    setShow(action);
  }
  return (
    <article className="flex justify-between flex-col p-3 sm:p-6 ring-1 rounded-md ring-red-950 w-40 sm:w-80 mb-5 h-40">
      {/* <img
        src={movie.image}
        alt=""
        width="60"
        height="88"
        className="flex-none rounded-md bg-slate-100"
      /> */}
      <div className="h-full flex flex-col justify-between">
        <h2 className="font-bold text-red-950 text-sm md:text-base text-center line-clamp-3 sm:truncate sm:line-clamp-1">
          {product?.producto.toUpperCase()}
        </h2>
        <div className="mt-2 flex flex-wrap justify-center text-sm leading-6 text-red-950 flex-col items-center sm:flex-row">
          <dd className="flex items-center">$ {product?.precioEfectivo}</dd>
        </div>
        <div className="flex w-full mt-3 justify-evenly">
          <button
            className=" text-xs text-white bg-red-950 rounded-md p-1 hover:bg-red-800"
            style={{ width: "50px", height: "30px" }}
            onClick={() => handleProductOverview(product)}
          >
            Detalle
          </button>
          <button
            className=" text-xs  text-white bg-red-950 rounded-md p-1 hover:bg-red-800"
            style={{ width: "50px", height: "30px" }}
            // onClick={() => handleProductOverview(product)}
          >
            Add
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
