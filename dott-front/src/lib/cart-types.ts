/**
 * Contrato mínimo de un ítem del carrito.
 * Usado por el contexto global del carrito y por componentes Cart/CartCard/ProductCard.
 */
export interface CartItem {
  id: string;
  quantity: number;
  producto: string;
  precioEfectivo: number;
  proveedor: string;
  /** Opcional: planes de cuotas desde el listado */
  precioCuotas?: Array<{ CantidadCuotas?: number; Total?: number }>;
}

/**
 * Valida que un valor sea un array de ítems con al menos id y quantity.
 * Útil al hidratar desde localStorage.
 */
export function isValidCartItems(value: unknown): value is CartItem[] {
  if (!Array.isArray(value)) return false;
  return value.every(
    (item) =>
      item != null &&
      typeof item === "object" &&
      "id" in item &&
      "quantity" in item &&
      typeof (item as CartItem).quantity === "number" &&
      (item as CartItem).quantity >= 0
  );
}
