/**
 * Construcción de planes de cuotas para mostrar en el carrito.
 * Misma ecuación que la calculadora: precio a cobrar = neto ÷ (1 − deducción con IVA).
 */

import type { CalculatorConfig, GatewayConfigCalc, GatewayCost } from "@/lib/api/calculator-types";

function toNum(x: unknown): number {
  if (typeof x === "number" && Number.isFinite(x)) return x;
  if (typeof x === "string") {
    const n = Number(String(x).replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export type DisplayPlan = {
  planKey: string;
  label: string;
  cuotas: number;
  total: number;
  porCuota: number;
};

/** Construye planes a partir de la config tipada (usar con fetchCalculatorConfig). */
export function buildPlansFromConfig(
  totalNeto: number,
  config: CalculatorConfig | null | undefined
): DisplayPlan[] {
  if (!config?.gateways || totalNeto <= 0) return [];
  const keys = Object.keys(config.gateways);
  const preferred = config.displayGatewayKey && config.gateways[config.displayGatewayKey]
    ? config.displayGatewayKey
    : keys[0];
  const g: GatewayConfigCalc | undefined = preferred ? config.gateways[preferred] : undefined;
  if (!g || !g.plans?.length) return [];

  const vat = g.vat ?? config.flat.vat;
  const vatRate = vat / 100;
  const costsArr = g.costs;
  const hasCostsArray = Array.isArray(costsArr) && costsArr.length > 0;

  // Support per-item VAT
  const hasPerItemVat = hasCostsArray && costsArr!.some((c: GatewayCost) => c.vat != null);

  let costsRate: number;
  let totalDeductionRateFn: ((planRate: number) => number);

  if (hasPerItemVat) {
    costsRate = costsArr!.reduce((s: number, c: GatewayCost) => s + c.value, 0) / 100;
    totalDeductionRateFn = (planRate: number) => {
      const costsDeduction = costsArr!.reduce(
        (s: number, c: GatewayCost) => s + (c.value / 100) * (1 + ((c.vat ?? vat) / 100)),
        0
      );
      return costsDeduction + planRate * (1 + vatRate);
    };
  } else {
    const sumCosts = hasCostsArray
      ? costsArr.reduce((s, c) => s + c.value, 0) / 100
      : 0;
    costsRate = hasCostsArray
      ? sumCosts
      : g.instantRate != null
        ? g.instantRate / 100
        : (g.cardFee ?? config.flat.cardFee) / 100 +
          (g.advanceFee ?? config.flat.advanceFee) / 100 +
          (g.cost24h ?? 0) / 100;
    totalDeductionRateFn = (planRate: number) => (costsRate + planRate) * (1 + vatRate);
  }

  return g.plans.map((plan) => {
    const planRate = plan.rate / 100;
    const totalDeductionRate = totalDeductionRateFn(planRate);
    if (totalDeductionRate >= 1)
      return {
        planKey: plan.planKey,
        label: plan.label || plan.planKey,
        cuotas: 0,
        total: 0,
        porCuota: 0,
      };
    const grossToCharge = Math.round(totalNeto / (1 - totalDeductionRate));
    const cuotas = Number.parseInt(plan.planKey, 10);
    const porCuota =
      Number.isFinite(cuotas) && cuotas > 0
        ? Math.round(grossToCharge / cuotas)
        : grossToCharge;
    return {
      planKey: plan.planKey,
      label: plan.label || plan.planKey,
      cuotas: Number.isFinite(cuotas) && cuotas > 0 ? cuotas : 0,
      total: grossToCharge,
      porCuota,
    };
  });
}

type QuotePlanItem = { planKey?: string; label?: string; tasa?: number };

/** Fallback: fórmula simple (precio * (1 + tasa/100)) cuando no hay calculator-config. */
export function buildPlansFromQuote(
  totalNeto: number,
  plans: QuotePlanItem[] | null | undefined
): DisplayPlan[] {
  if (!Array.isArray(plans) || plans.length === 0) return [];
  return plans.map((plan) => {
    const tasa = toNum(plan.tasa) || 0;
    const total = Math.round(totalNeto * (1 + tasa / 100));
    const cuotas = Number.parseInt(String(plan.planKey), 10);
    const porCuota =
      Number.isFinite(cuotas) && cuotas > 0 ? Math.round(total / cuotas) : total;
    return {
      planKey: String(plan.planKey ?? ""),
      label: String(plan.label ?? plan.planKey ?? ""),
      cuotas: Number.isFinite(cuotas) && cuotas > 0 ? cuotas : 0,
      total,
      porCuota,
    };
  });
}
