/**
 * Servicio cliente para la configuración de la calculadora.
 * Devuelve datos tipados y normalizados.
 */

import { api } from "@/constants/routes";
import type {
  CalculatorConfig,
  GatewayConfigCalc,
  GatewayPlan,
} from "./calculator-types";

function toNum(x: unknown): number {
  if (typeof x === "number" && Number.isFinite(x)) return x;
  if (typeof x === "string") {
    const n = Number(String(x).replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function parsePlans(arr: unknown): GatewayPlan[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((p) => p && typeof (p as { planKey?: unknown }).planKey === "string")
    .map((p) => {
      const item = p as { planKey?: string; label?: string; rate?: unknown };
      return {
        planKey: String(item.planKey),
        label: typeof item.label === "string" ? item.label : String(item.planKey ?? ""),
        rate: toNum(item.rate),
      };
    })
    .filter((p) => p.planKey.trim());
}

function parseCosts(arr: unknown): { id: string; label: string; value: number }[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((c) => c && typeof (c as { id?: unknown }).id === "string")
    .map((c) => {
      const item = c as { id?: string; label?: string; value?: unknown };
      return {
        id: String(item.id),
        label: typeof item.label === "string" ? item.label : String(item.id ?? ""),
        value: toNum(item.value),
      };
    });
}

const DEFAULT_PLANS_STANDARD: GatewayPlan[] = [
  { planKey: "3", label: "3 cuotas", rate: 7.78 },
  { planKey: "6", label: "6 cuotas", rate: 14.96 },
  { planKey: "planZ", label: "Plan Z", rate: 13.4 },
];

const DEFAULT_PLANS_MP: GatewayPlan[] = [
  { planKey: "2", label: "2 cuotas", rate: 6.1 },
  { planKey: "3", label: "3 cuotas", rate: 7.78 },
  { planKey: "6", label: "6 cuotas", rate: 14.96 },
  { planKey: "9", label: "9 cuotas", rate: 12 },
  { planKey: "12", label: "12 cuotas", rate: 15 },
];

const DEFAULT_RATES = { cardFee: 1.8, advanceFee: 6, vat: 21 };

function buildGateway(g: unknown, flatVat: number, defaultPlans: GatewayPlan[]): GatewayConfigCalc {
  if (!g || typeof g !== "object") return { vat: flatVat, plans: defaultPlans };
  const obj = g as Record<string, unknown>;
  const costs = parseCosts(obj.costs);
  const plans = parsePlans(obj.plans).length ? parsePlans(obj.plans) : defaultPlans;
  const vat = obj.vat != null ? toNum(obj.vat) : flatVat;
  if (costs.length > 0) return { costs, vat, plans };
  if (obj.instantRate != null) return { instantRate: toNum(obj.instantRate), vat, plans };
  if (obj.cost24h != null)
    return {
      cardFee: toNum(obj.cardFee ?? DEFAULT_RATES.cardFee),
      cost24h: toNum(obj.cost24h),
      vat,
      plans,
    };
  return {
    cardFee: toNum(obj.cardFee ?? DEFAULT_RATES.cardFee),
    advanceFee: toNum(obj.advanceFee ?? DEFAULT_RATES.advanceFee),
    vat,
    plans,
  };
}

/**
 * Obtiene la configuración de la calculadora desde el backend.
 * Devuelve datos normalizados y tipados; en caso de error devuelve configuración por defecto.
 */
export async function fetchCalculatorConfig(): Promise<CalculatorConfig> {
  try {
    const configRes = await fetch(api.nest.calculatorConfig);
    const configJson = configRes.ok ? await configRes.json() : null;

    const flat = {
      cardFee:
        configJson?.settings?.cardFee != null
          ? toNum(configJson.settings.cardFee)
          : DEFAULT_RATES.cardFee,
      advanceFee:
        configJson?.settings?.advanceFee != null
          ? toNum(configJson.settings.advanceFee)
          : DEFAULT_RATES.advanceFee,
      vat:
        configJson?.settings?.vat != null
          ? toNum(configJson.settings.vat)
          : DEFAULT_RATES.vat,
    };

    const raw =
      configJson?.settings?.gateways && typeof configJson.settings.gateways === "object"
        ? configJson.settings.gateways
        : ({} as Record<string, unknown>);

    const gateways: Record<string, GatewayConfigCalc> = {};
    if (raw.tacataca) gateways.tacataca = buildGateway(raw.tacataca, flat.vat, DEFAULT_PLANS_STANDARD);
    if (raw.payway) gateways.payway = buildGateway(raw.payway, flat.vat, DEFAULT_PLANS_STANDARD);
    if (raw.mercadopago) {
      const mp = raw.mercadopago as { plans?: unknown; installmentRates?: Record<string, number> };
      const plansFromApi = parsePlans(mp.plans);
      const plans =
        plansFromApi.length > 0
          ? plansFromApi
          : mp.installmentRates
            ? Object.entries(mp.installmentRates).map(([k, v]) => ({
                planKey: k,
                label: k === "planZ" ? "Plan Z" : `${k} cuotas`,
                rate: Number(v),
              }))
            : DEFAULT_PLANS_MP;
      gateways.mercadopago = buildGateway(raw.mercadopago, flat.vat, plans);
    }

    return { flat, gateways };
  } catch {
    return {
      flat: {
        cardFee: DEFAULT_RATES.cardFee,
        advanceFee: DEFAULT_RATES.advanceFee,
        vat: DEFAULT_RATES.vat,
      },
      gateways: {},
    };
  }
}
