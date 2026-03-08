import React, { memo, useContext, useMemo, useState } from "react";
import ProductOverview from "@/app/components/ProductOverview";
import { ContextGlobal } from "@/contexts/global.context";
import {
  TrashIcon,
  ShoppingBagIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

const ProductCard = ({ product }) => {
  const [show, setShow] = useState(false);
  const [productDetail, setProductDetail] = useState({});
  const { state, addCart, removeCart } = useContext(ContextGlobal);

  const isSelected = useMemo(() => {
    return state.productCart.some((prodCart) => prodCart.id === product.id);
  }, [product.id, state.productCart]);

  const cuotaDesde = useMemo(() => {
    const primeraCuota = product?.precioCuotas?.find((cuota) => Number(cuota?.CantidadCuotas) > 0);

    if (!primeraCuota) {
      return "Sin cuotas";
    }

    const cantidadCuotas = Number(primeraCuota.CantidadCuotas);
    const totalCuotas = Number(primeraCuota.Total) || 0;
    const porCuota = cantidadCuotas > 0 ? totalCuotas / cantidadCuotas : totalCuotas;

    return `${cantidadCuotas}x ${new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(porCuota)}`;
  }, [product?.precioCuotas]);

  const handleProductOverview = (product) => {
    setProductDetail(product);
    setShow(true);
  };
  function close(action) {
    setShow(action);
  }

  function handleCart() {
    if (isSelected) {
      removeCart(product.id);
    } else {
      addCart({ ...product, quantity: 1 });
    }
  }

  return (
    <article className="flex h-full min-h-44 w-full flex-col justify-between rounded-lg border border-border p-4 shadow-sm">
      <div className="space-y-2">
        <p className="line-clamp-3 text-sm font-semibold text-foreground">{product?.producto?.toUpperCase()}</p>
        <p className="text-lg font-semibold text-foreground">
          {new Intl.NumberFormat("es-AR", {
            style: "currency",
            currency: "ARS",
            maximumFractionDigits: 0,
          }).format(product?.precioEfectivo || 0)}
        </p>
        <p className="text-xs text-muted-foreground">Cuotas desde: {cuotaDesde}</p>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
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
          aria-label={isSelected ? "Quitar del carrito" : "Agregar al carrito"}
        >
          {isSelected ? (
            <TrashIcon className="h-5 w-5" aria-hidden="true" />
          ) : (
            <ShoppingBagIcon className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </div>

      {productDetail ? (
        <ProductOverview action={show} close={close} product={productDetail} />
      ) : null}
    </article>
  );
};

export default memo(ProductCard);
