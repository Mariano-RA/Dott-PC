/**
 * Servicio cliente para planes de cuotas (fallback cuando no hay calculator-config).
 */

import { api } from "@/constants/routes";

export type QuotePlan = {
  planKey: string;
  label?: string;
  tasa?: number;
};

export type QuotePlanResult = {
  planKey: string;
  label: string;
  cuotas: number;
  total: number;
  porCuota: number;
};

/**
 * Obtiene los planes de cuotas desde el backend (endpoint quote).
 */
export async function fetchQuotePlans(): Promise<QuotePlan[]> {
  try {
    const res = await fetch(api.nest.quote);
    const data = await res.json();
    const plans = data?.plans;
    if (!Array.isArray(plans)) return [];
    return plans.map((p: { planKey?: string; label?: string; tasa?: number }) => ({
      planKey: String(p?.planKey ?? ""),
      label: p?.label,
      tasa: p?.tasa,
    }));
  } catch {
    return [];
  }
}
