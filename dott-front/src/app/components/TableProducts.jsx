import React, { useContext, useEffect, useState } from "react";
import ProductOverview from "@/app/components/ProductOverview";
import { ContextGlobal } from "./utils/global.context";
import {
  TrashIcon,
  ShoppingBagIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { useUser } from "@auth0/nextjs-auth0/client";

const TableProducts = ({ products }) => {
  const [show, setShow] = useState(false);
  const [productDetail, setProductDetail] = useState({});
  const { state, addCart, removeCart } = useContext(ContextGlobal);
  const [usrRoles, setUsrRoles] = useState([]);
  const { user } = useUser();

  const handleProductOverview = (product) => {
    setProductDetail(product);
    setShow(true);
  };
  function close(action) {
    setShow(action);
  }

  function isSelected(product) {
    return state.productCart.filter((prodCart) => prodCart.id === product.id)
      .length > 0
      ? true
      : false;
  }

  function handleCart(product) {
    if (
      state.productCart.filter((prodCart) => prodCart.id === product.id)
        .length > 0
    ) {
      removeCart(product.id);
    } else {
      addCart({ ...product, quantity: 1 });
    }
  }

  useEffect(() => {
    if (user) {
      const roles = user["http://localhost:3000/roles"];
      setUsrRoles(roles);
    } else {
      setUsrRoles([]);
    }
  }, [user]);

  return (
    <div className="flex justify-center w-full">
      <table
        className="table-fixed sm:w-full"
        role="table"
        aria-label="Product Table"
      >
        <thead>
          <tr className=" text-red-950">
            <th
              colSpan={9}
              className=" bg-gray-100 px-4 py-2 text-left rounded-s-md"
            >
              Nombre
            </th>
            <th colSpan={1} className="bg-gray-100 px-4 py-2 sm:px-0">
              Precio
            </th>
            {usrRoles.includes("admin") && (
              <th colSpan={1} className="bg-gray-100 px-4 py-2 sm:px-0">
                Proveedor
              </th>
            )}
            <th colSpan={1} className="bg-gray-100 px-4 py-2">
              Más
            </th>
            <th colSpan={1} className="bg-gray-100 px-4 py-2 rounded-e-md">
              Carrito
            </th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id} className="border-b hover:bg-gray-50">
              <td className="px-4 py-1 rounded-s-md" colSpan={9}>
                <p className="text-red-950 text-xs text-left font-light sm:font-semibold">
                  {product?.producto.toUpperCase()}
                </p>
              </td>
              <td colSpan={1} className="px-4 py-1">
                <div className="mt-2 flex flex-wrap justify-center text-sm leading-6 text-red-950 flex-col items-center sm:flex-row">
                  <dd className="flex items-center">
                    $
                    {new Intl.NumberFormat("es-AR").format(
                      product?.precioEfectivo
                    )}
                  </dd>
                </div>
              </td>
              {usrRoles.includes("admin") && (
                <td colSpan={1} className="px-4 py-1">
                  <div className="mt-2 flex flex-wrap justify-center text-sm leading-6 text-red-950 flex-col items-center sm:flex-row">
                    <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                      {product.proveedor?.toUpperCase()}
                    </dd>
                  </div>
                </td>
              )}
              <td colSpan={1} className="px-4 py-1 text-center">
                <button
                  className=" text-xs  text-white bg-red-950 rounded-md p-1 hover:bg-red-800 w-auto "
                  onClick={() => handleProductOverview(product)}
                >
                  <InformationCircleIcon
                    className="h-6 w-6"
                    aria-hidden="true"
                  />
                </button>
              </td>
              <td colSpan={1} className="px-4 py-1 text-center">
                <button
                  className=" text-xs  text-white bg-red-950 rounded-md p-1 hover:bg-red-800 w-auto "
                  onClick={() => handleCart(product)}
                >
                  {isSelected(product) == false ? (
                    <ShoppingBagIcon className="h-6 w-6" aria-hidden="true" />
                  ) : (
                    <TrashIcon className="h-6 w-6" aria-hidden="true" />
                  )}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {productDetail && (
        <ProductOverview action={show} close={close} product={productDetail} />
      )}
    </div>
  );
};

export default TableProducts;
