import React, { memo, useContext, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import ProductOverview from "@/app/components/ProductOverview";
import { ContextGlobal } from "@/contexts/global.context";
import { Dialog, Transition } from "@headlessui/react";
import {
  TrashIcon,
  ShoppingBagIcon,
  InformationCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { formatARS, getCuotaDesdeText } from "@/lib/formatters";

const ProductCard = ({ product }) => {
  const [show, setShow] = useState(false);
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [productDetail, setProductDetail] = useState(null);
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
    setImageLoading(true);
  }, [computedImageSrc]);

  const handleImageError = () => {
    // Si falla el endpoint del proveedor, mostramos el placeholder local.
    setImageSrc((prev) => (prev === fallback ? prev : fallback));
    setImageLoading(false);
  };
  const canPreviewImage = imageSrc !== fallback;

  const isSelected = useMemo(() => {
    return state.productCart.some((prodCart) => prodCart.id === product.id);
  }, [product.id, state.productCart]);

  const cuotaDesde = useMemo(() => {
    return getCuotaDesdeText(product?.precioCuotas);
  }, [product?.precioCuotas]);

  const handleProductOverview = (p) => {
    setProductDetail(p);
    setShow(true);
  };
  function close(action) {
    setShow(action);
    if (!action) {
      setProductDetail(null);
    }
  }

  function openImagePreview() {
    if (!canPreviewImage) return;
    setImageLoading(true);
    setImagePreviewOpen(true);
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
          className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-border bg-white p-0 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600 ${
            canPreviewImage
              ? "cursor-zoom-in hover:ring-2 hover:ring-red-300"
              : "cursor-default opacity-90"
          }`}
          onClick={(e) => {
            e.stopPropagation();
            openImagePreview();
          }}
          aria-label={
            canPreviewImage
              ? `Ampliar imagen de ${product?.producto || "producto"}`
              : "Sin imagen para ampliar"
          }
          disabled={!canPreviewImage}
        >
          <Image
            src={imageSrc}
            alt={product?.producto ? `Imagen de ${product.producto}` : "Imagen del producto"}
            fill
            className="object-contain p-1"
            sizes="64px"
            onLoad={() => setImageLoading(false)}
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

      {productDetail != null ? (
        <ProductOverview action={show} close={close} product={productDetail} />
      ) : null}

      <Transition.Root show={imagePreviewOpen} as="div" className="contents">
        <Dialog as="div" className="relative z-[70]" onClose={setImagePreviewOpen}>
          <Transition.Child
            as="div"
            className="contents"
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 z-[70] bg-neutral-900/80" aria-hidden="true" />
          </Transition.Child>
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <Transition.Child
              as="div"
              className="contents"
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="relative w-full max-w-xl overflow-hidden rounded-xl border border-red-100 bg-white p-3 shadow-2xl">
                <button
                  type="button"
                  className="absolute right-3 top-3 rounded-md bg-white/90 p-1 text-neutral-700 transition hover:bg-red-50 hover:text-red-900"
                  onClick={() => setImagePreviewOpen(false)}
                >
                  <span className="sr-only">Cerrar vista ampliada</span>
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                </button>
                <div className="relative h-[55vh] w-full">
                  <Image
                    src={imageSrc}
                    alt={product?.producto ? `Imagen ampliada de ${product.producto}` : "Imagen ampliada del producto"}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 95vw, 60vw"
                    onLoad={() => setImageLoading(false)}
                    onError={handleImageError}
                  />
                  {imageLoading ? (
                    <span className="absolute inset-0 z-10 flex items-center justify-center bg-white/70">
                      <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-red-500 border-r-transparent" />
                    </span>
                  ) : null}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
    </article>
  );
};

export default memo(ProductCard);
