import { valorCuotaDto } from "../dto/valorCuotaDto";

export const CATEGORIA_FALLBACK = "Varios";

export function obtenerMargenPorCategoria(categoria: string): number {
  switch (categoria.trim().toLowerCase()) {
    case "placas de video":
    case "procesadores":
    case "motherboards":
    case "memorias ram":
    case "discos":
    case "notebooks":
    case "computadoras":
    case "tablets":
    case "telefonia":
    case "monitores":
      return 0.12;

    case "fuentes":
    case "gabinetes":
    case "impresoras e insumos":
    case "refrigeracion":
    case "estabilizadores y ups":
    case "sillas":
    case "electro":
      return 0.2;

    case "accesorios":
    case "auriculares":
    case "mouses":
    case "teclados":
    case "parlantes":
    case "microfonos":
    case "webcams":
    case "smartwatch":
    case "conectividad":
    case "cables y adaptadores":
    case "soportes":
    case "almacenamiento portatil":
    case "software":
      return 0.35;

    default:
      return 0.15;
  }
}

export function obtenerPrecioEfectivo(
  monto: number,
  dolar: number,
  categoria: string
): number {
  const margen = obtenerMargenPorCategoria(categoria);
  return Math.round(monto * dolar * (1 + margen));
}

export interface CuotaPlanLike {
  tasa?: number;
  planKey?: string;
  label?: string;
}

export function calcularValorCuotas(
  precio: number,
  listadoCuotas: CuotaPlanLike[]
): valorCuotaDto[] {
  return listadoCuotas.map((plan) => {
    const tasa = Number(plan?.tasa ?? 0);
    const planKey = String(plan?.planKey ?? "");
    const parsedInstallments = Number.parseInt(planKey, 10);
    const installments =
      Number.isFinite(parsedInstallments) && parsedInstallments > 0
        ? parsedInstallments
        : 0;
    const total = Math.round(precio * (1 + tasa / 100));
    const valorCuota = new valorCuotaDto();
    valorCuota.planKey = planKey;
    valorCuota.planLabel = String(plan?.label ?? planKey);
    valorCuota.CantidadCuotas = installments;
    valorCuota.Total = total;
    valorCuota.Cuota =
      installments > 0 ? Math.round(total / installments) : total;
    return valorCuota;
  });
}

export function pagination<T>(skip: number, take: number, items: T[]): T[] {
  return items.slice((skip - 1) * take, skip * take);
}

export type ProductoListadoLike = {
  precioEfectivo: number;
  producto: string;
};

export function handleOrder<T extends ProductoListadoLike>(
  action: string,
  array: T[]
): T[] {
  const sortedArray = [...array];
  const sortingActions: Record<string, (a: T, b: T) => number> = {
    mayor: (a, b) => b.precioEfectivo - a.precioEfectivo,
    menor: (a, b) => a.precioEfectivo - b.precioEfectivo,
    nombreAsc: (a, b) =>
      a.producto.toLowerCase().localeCompare(b.producto.toLowerCase()),
    nombreDesc: (a, b) =>
      b.producto.toLowerCase().localeCompare(a.producto.toLowerCase()),
  };
  const fn = sortingActions[action];
  if (fn) sortedArray.sort(fn);
  return sortedArray;
}

export interface DolarLike {
  proveedorId: number;
  precioDolar?: number;
}

export function getPrecioDolarOrDefault(
  arrayDolar: DolarLike[],
  proveedorId: number
): number {
  const valorDolar = arrayDolar.find((x) => x.proveedorId === proveedorId);
  const precioDolar = Number(valorDolar?.precioDolar);
  if (!Number.isFinite(precioDolar) || precioDolar <= 0) return 1;
  return precioDolar;
}
