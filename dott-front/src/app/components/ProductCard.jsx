import React, { memo, useContext, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import ProductOverview from "@/app/components/ProductOverview";
import { ContextGlobal } from "@/contexts/global.context";
import {
  TrashIcon,
  ShoppingBagIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { formatARS, getCuotaDesdeText } from "@/lib/formatters";

const ProductCard = ({ product }) => {
  const [show, setShow] = useState(false);
  const [productDetail, setProductDetail] = useState({});
  const { state, addCart, removeCart } = useContext(ContextGlobal);

  const fallback = "/img/product-placeholder.svg";

  const computedImageSrc = useMemo(() => {
    const prov =
      typeof product?.proveedor === "string"
        ? product.proveedor.trim().toLowerCase()
        : "";
    const codigo =
      typeof product?.codigo === "string" ? product.codigo.trim() : "";
    if (prov && codigo && ["elit", "nb", "eikon", "mega", "air"].includes(prov)) {
      return `/api/nest/imagenes/${encodeURIComponent(prov)}/${encodeURIComponent(codigo)}`;
    }
    return fallback;
  }, [product?.proveedor, product?.codigo]);

  const [imageSrc, setImageSrc] = useState(computedImageSrc);

  useEffect(() => {
    setImageSrc(computedImageSrc);
  }, [computedImageSrc]);

  const handleImageError = () => {
    // Si falla el endpoint del proveedor, mostramos el placeholder local.
    setImageSrc((prev) => (prev === fallback ? prev : fallback));
  };

  const isSelected = useMemo(() => {
    return state.productCart.some((prodCart) => prodCart.id === product.id);
  }, [product.id, state.productCart]);

  const cuotaDesde = useMemo(() => {
    return getCuotaDesdeText(product?.precioCuotas);
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
      <div className="flex items-start gap-3">
        <button
          type="button"
          className="relative h-16 w-16 shrink-0 cursor-zoom-in overflow-hidden rounded-md border border-border bg-white p-0 text-left transition hover:ring-2 hover:ring-red-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
          onClick={() => handleProductOverview(product)}
          aria-label={`Ver detalle e imagen de ${product?.producto || "producto"}`}
        >
          <Image
            src={imageSrc}
            alt={product?.producto ? `Imagen de ${product.producto}` : "Imagen del producto"}
            fill
            className="object-contain p-1"
            sizes="64px"
            onError={handleImageError}
          />
        </button>

        <div className="space-y-2">
          <p className="line-clamp-3 text-sm font-semibold text-foreground">
            {product?.producto?.toUpperCase()}
          </p>
          <p className="text-lg font-semibold text-foreground">
            {formatARS(product?.precioEfectivo)}
          </p>
          <p className="text-xs text-muted-foreground">
            Cuotas desde: {cuotaDesde}
          </p>
        </div>
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
