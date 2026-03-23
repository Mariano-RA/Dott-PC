import React, { memo, useContext, useMemo, useState } from "react";
import ProductOverview from "@/app/components/ProductOverview";
import { ContextGlobal } from "@/contexts/global.context";
import {
  TrashIcon,
  ShoppingBagIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { useUser } from "@auth0/nextjs-auth0";
import { getUserRoles } from "@/lib/auth0Roles";
import { formatARS, getCuotaDesdeText } from "@/lib/formatters";

const ProductTableRow = memo(function ProductTableRow({
  product,
  isAdmin,
  isSelected,
  onProductOverview,
  onCart,
}) {
  return (
    <tr className="border-b border-border hover:bg-neutral-50">
      <td className="px-3 py-3 text-left text-sm font-semibold text-foreground">{product?.producto?.toUpperCase()}</td>
      <td className="px-3 py-3 text-sm text-foreground">{formatARS(product?.precioEfectivo)}</td>
      <td className="px-3 py-3 text-sm text-muted-foreground">{getCuotaDesdeText(product?.precioCuotas)}</td>
      {isAdmin ? <td className="px-3 py-3 text-sm text-muted-foreground">{product?.proveedor?.toUpperCase()}</td> : null}
      <td className="px-3 py-3">
        <div className="flex items-center gap-2">
          <button
            className="rounded-md border border-red-200 bg-white p-2 text-red-900 transition hover:bg-red-50"
            onClick={() => onProductOverview(product)}
            aria-label="Ver detalle del producto"
          >
            <InformationCircleIcon className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            className="rounded-md bg-red-950 p-2 text-white transition hover:bg-red-900"
            onClick={() => onCart(product)}
            aria-label={isSelected ? "Quitar del carrito" : "Agregar al carrito"}
          >
            {isSelected ? (
              <TrashIcon className="h-5 w-5" aria-hidden="true" />
            ) : (
              <ShoppingBagIcon className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </td>
    </tr>
  );
});

const TableProducts = ({ products }) => {
  const [show, setShow] = useState(false);
  const [productDetail, setProductDetail] = useState({});
  const { state, addCart, removeCart } = useContext(ContextGlobal);
  const { user } = useUser();
  const usrRoles = getUserRoles(user);
  const isAdmin = usrRoles.includes("admin");
  const selectedProductIds = useMemo(() => new Set(state.productCart.map((product) => product.id)), [state.productCart]);

  const handleProductOverview = (product) => {
    setProductDetail(product);
    setShow(true);
  };
  function close(action) {
    setShow(action);
  }

  function isSelected(product) {
    return selectedProductIds.has(product.id);
  }

  function handleCart(product) {
    if (isSelected(product)) {
      removeCart(product.id);
    } else {
      addCart({ ...product, quantity: 1 });
    }
  }

  return (
    <div className="w-full">
      <div className="sm:hidden">
        <ul className="divide-y divide-border">
          {products.map((product) => (
            <li key={`mobile-${product.id}`} className="py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{product?.producto?.toUpperCase()}</p>
                  <div className="mt-1 space-y-1">
                    <span className="block text-base font-medium text-foreground">{formatARS(product?.precioEfectivo)}</span>
                    <span className="block text-xs text-muted-foreground">Cuotas desde: {getCuotaDesdeText(product?.precioCuotas)}</span>
                    {isAdmin ? <span className="text-xs uppercase text-muted-foreground">{product?.proveedor}</span> : null}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    className="rounded-md border border-red-200 bg-white p-2 text-red-900 transition hover:bg-red-50"
                    onClick={() => handleProductOverview(product)}
                    aria-label="Ver detalle del producto"
                  >
                    <InformationCircleIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                  <button
                    className="rounded-md bg-red-950 p-2 text-white transition hover:bg-red-900"
                    onClick={() => handleCart(product)}
                    aria-label={isSelected(product) ? "Quitar del carrito" : "Agregar al carrito"}
                  >
                    {!isSelected(product) ? (
                      <ShoppingBagIcon className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <TrashIcon className="h-5 w-5" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="hidden w-full overflow-x-auto sm:block">
        <table className="w-full min-w-[860px] table-auto" role="table" aria-label="Tabla de productos">
          <thead>
            <tr className="border-b border-border bg-neutral-100 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-3">Nombre</th>
              <th className="px-3 py-3">Precio</th>
              <th className="px-3 py-3">Cuotas desde</th>
              {isAdmin ? <th className="px-3 py-3">Proveedor</th> : null}
              <th className="px-3 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <ProductTableRow
                key={product.id}
                product={product}
                isAdmin={isAdmin}
                isSelected={isSelected(product)}
                onProductOverview={handleProductOverview}
                onCart={handleCart}
              />
            ))}
          </tbody>
        </table>
      </div>
      {productDetail ? <ProductOverview action={show} close={close} product={productDetail} /> : null}
    </div>
  );
};

export default memo(TableProducts);
