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

  const [sortBy, setSortBy] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc"); // 'asc' o 'desc'
  const [filterProveedor, setFilterProveedor] = useState("");

  const handleProductOverview = (product) => {
    setProductDetail(product);
    setShow(true);
  };
  function close(action) {
    setShow(action);
  }

  function isSelected(product) {
    return state.productCart.some((prodCart) => prodCart.id === product.id);
  }

  function handleCart(product) {
    if (isSelected(product)) {
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

  const handleSort = (column) => {
    if (sortBy === column) {
      // Toggle sort direction
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortDirection("asc");
    }
  };

  function sortedAndFilteredProducts() {
    let filtered = [...products];

    if (filterProveedor.trim() !== "") {
      filtered = filtered.filter((product) =>
        product.proveedor?.toLowerCase().includes(filterProveedor.toLowerCase())
      );
    }

    if (sortBy) {
      filtered.sort((a, b) => {
        const aVal = a[sortBy];
        const bVal = b[sortBy];

        if (typeof aVal === "string") {
          return sortDirection === "asc"
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      });
    }

    return filtered;
  }

  return (
    <div className="flex flex-col items-end w-full">
      {usrRoles.includes("admin") && (
        <input
          type="text"
          placeholder="Filtrar por proveedor..."
          value={filterProveedor}
          onChange={(e) => setFilterProveedor(e.target.value)}
          className="border px-2 py-1 rounded-md text-sm mb-2 w-full max-w-xs"
        />
      )}

      <div className="w-full overflow-x-auto">
        <table className="table-fixed sm:w-full" role="table" aria-label="Product Table">
          <thead>
            <tr className="text-red-950">
              <th
                colSpan={9}
                className="bg-gray-100 px-4 py-2 text-left rounded-s-md cursor-pointer"
                onClick={() => handleSort("producto")}
              >
                Nombre
              </th>
              <th
                colSpan={1}
                className="bg-gray-100 px-4 py-2 sm:px-0 cursor-pointer"
                onClick={() => handleSort("precioEfectivo")}
              >
                Precio
              </th>
              {usrRoles.includes("admin") && (
                <th
                  colSpan={1}
                  className="bg-gray-100 px-4 py-2 sm:px-0 hidden sm:block cursor-pointer"
                  onClick={() => handleSort("proveedor")}
                >
                  Proveedor
                </th>
              )}
              <th colSpan={1} className="bg-gray-100 px-4 py-2">
                Más
              </th>
              <th
                colSpan={1}
                className="bg-gray-100 px-4 py-2 rounded-e-md hidden sm:block"
              >
                Carrito
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedAndFilteredProducts().map((product) => (
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
                  <td colSpan={1} className="px-4 py-1 hidden sm:block">
                    <div className="mt-2 flex flex-wrap justify-center text-sm leading-6 text-red-950 flex-col items-center sm:flex-row">
                      <dd className="flex items-center">
                        {product.proveedor?.toUpperCase()}
                      </dd>
                    </div>
                  </td>
                )}
                <td colSpan={1} className="px-4 py-1 text-center">
                  <div className="flex flex-wrap justify-center text-sm leading-6 text-red-950 flex-col items-center sm:flex-row">
                    {usrRoles.includes("admin") && (
                      <dd className="text-sm leading-6 text-gray-700 sm:col-span-2 sm:hidden block">
                        {product.proveedor?.toUpperCase()}
                      </dd>
                    )}
                    <button
                      className="text-xs text-white bg-red-950 rounded-md p-1 hover:bg-red-800 w-auto"
                      onClick={() => handleProductOverview(product)}
                    >
                      <InformationCircleIcon
                        className="h-6 w-6"
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                </td>
                <td colSpan={1} className="px-4 py-1 text-center hidden sm:block">
                  <button
                    className="text-xs text-white bg-red-950 rounded-md p-1 hover:bg-red-800 w-auto"
                    onClick={() => handleCart(product)}
                  >
                    {isSelected(product) ? (
                      <TrashIcon className="h-6 w-6" aria-hidden="true" />
                    ) : (
                      <ShoppingBagIcon className="h-6 w-6" aria-hidden="true" />
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {productDetail && (
        <ProductOverview action={show} close={close} product={productDetail} />
      )}
    </div>
  );
};

export default TableProducts;
