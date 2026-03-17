export type CurrencyFormatOptions = {
  maximumFractionDigits?: number;
};

export function formatARS(value: unknown, options: CurrencyFormatOptions = {}): string {
  const num = typeof value === "number" ? value : Number(value);
  const safe = Number.isFinite(num) ? num : 0;
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: options.maximumFractionDigits ?? 0,
  }).format(safe);
}

export type PrecioCuota = {
  CantidadCuotas?: number | string;
  Total?: number | string;
  planKey?: string;
  planLabel?: string;
};

export type CuotaDesdeTextOptions = {
  emptyText?: string;
};

/**
 * Devuelve un texto tipo "6x $12.345" calculando la primera cuota válida.
 */
export function getCuotaDesdeText(
  precioCuotas: unknown,
  options: CuotaDesdeTextOptions = {}
): string {
  const cuotas = Array.isArray(precioCuotas) ? (precioCuotas as PrecioCuota[]) : [];
  const primeraCuota = cuotas.find((cuota) => Number(cuota?.CantidadCuotas) > 0);

  if (!primeraCuota) {
    return options.emptyText ?? "Sin cuotas";
  }

  const cantidad = Number(primeraCuota.CantidadCuotas) || 0;
  const total = Number(primeraCuota.Total) || 0;
  const porCuota = cantidad > 0 ? Math.round(total / cantidad) : total;

  return `${cantidad}x ${formatARS(porCuota)}`;
}

