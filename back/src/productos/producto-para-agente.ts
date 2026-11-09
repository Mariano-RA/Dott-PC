/** Producto tal como lo ve el agente: solo lectura, con el precio que paga Nano y el precio final al cliente. */
export type ProductoParaAgente = {
  id: number;
  /** Nombre del proveedor en minúsculas (ej. "air"). */
  proveedor: string;
  codigo: string | null;
  producto: string;
  categoria: string;
  /** Lo que paga Nano al proveedor, por unidad (USD). */
  precioUsd: number;
  /** Precio final al cliente en efectivo (pesos, con dólar del proveedor y margen), por unidad. */
  precioCliente: number;
};
