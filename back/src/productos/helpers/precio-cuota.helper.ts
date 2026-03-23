import { valorCuotaDto } from "../dto/valorCuotaDto";

export const CATEGORIA_FALLBACK = "Varios";

/**
 * Expresión SQL (MySQL) alineada con `obtenerMargenPorCategoria` para ordenar por precio efectivo
 * sin cargar todo el catálogo en memoria.
 */
export function sqlMargenCaseExpr(categoriaColumnRef: string): string {
  const c = `LOWER(TRIM(${categoriaColumnRef}))`;
  return `(CASE ${c}
    WHEN 'placas de video' THEN 0.12
    WHEN 'procesadores' THEN 0.12
    WHEN 'motherboards' THEN 0.12
    WHEN 'memorias ram' THEN 0.12
    WHEN 'discos' THEN 0.12
    WHEN 'notebooks' THEN 0.12
    WHEN 'computadoras' THEN 0.12
    WHEN 'tablets' THEN 0.12
    WHEN 'telefonia' THEN 0.12
    WHEN 'monitores' THEN 0.12
    WHEN 'fuentes' THEN 0.2
    WHEN 'gabinetes' THEN 0.2
    WHEN 'impresoras e insumos' THEN 0.2
    WHEN 'refrigeracion' THEN 0.2
    WHEN 'estabilizadores y ups' THEN 0.2
    WHEN 'sillas' THEN 0.2
    WHEN 'electro' THEN 0.2
    WHEN 'accesorios' THEN 0.35
    WHEN 'auriculares' THEN 0.35
    WHEN 'mouses' THEN 0.35
    WHEN 'teclados' THEN 0.35
    WHEN 'parlantes' THEN 0.35
    WHEN 'microfonos' THEN 0.35
    WHEN 'webcams' THEN 0.35
    WHEN 'smartwatch' THEN 0.35
    WHEN 'conectividad' THEN 0.35
    WHEN 'cables y adaptadores' THEN 0.35
    WHEN 'soportes' THEN 0.35
    WHEN 'almacenamiento portatil' THEN 0.35
    WHEN 'software' THEN 0.35
    ELSE 0.15 END)`;
}

/** Columna `p` = alias de Productos en QueryBuilder. */
export function sqlPrecioEfectivoSortExpr(productAlias: string): string {
  const p = `\`${productAlias}\``;
  const margen = sqlMargenCaseExpr(`${p}.\`categoria\``);
  return `ROUND(
    ${p}.\`precio\` * COALESCE(
      (SELECT \`d\`.\`precioDolar\` FROM \`Dolares\` \`d\` WHERE \`d\`.\`proveedorId\` = ${p}.\`proveedorId\` LIMIT 1),
      1
    ) * (1 + ${margen})
  )`;
}

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
