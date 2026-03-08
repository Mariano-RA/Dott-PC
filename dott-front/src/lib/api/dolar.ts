/**
 * Servicio cliente para el valor del dólar.
 */

import { api } from "@/constants/routes";

export async function fetchDolarValue(): Promise<number> {
  try {
    const res = await fetch(api.nest.dolar);
    const data = await res.json();
    const dolar = data?.dolar;
    return typeof dolar === "number" && Number.isFinite(dolar) ? dolar : 0;
  } catch {
    return 0;
  }
}
