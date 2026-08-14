/**
 * Servicio cliente para la configuración de la calculadora.
 * Devuelve datos tipados y normalizados.
 */

import { api } from "@/constants/routes";
import type {
  CalculatorConfig,
  GatewayConfigCalc,
  GatewayCost,
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

function parseCosts(arr: unknown): GatewayCost[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((c) => c && typeof (c as { id?: unknown }).id === "string")
    .map((c) => {
      const item = c as { id?: string; label?: string; value?: unknown; vat?: unknown };
      return {
        id: String(item.id),
        label: typeof item.label === "string" ? item.label : String(item.id ?? ""),
        value: toNum(item.value),
        vat: item.vat != null ? toNum(item.vat) : undefined,
      };
    });
}

const DEFAULT_RATES = { cardFee: 1.8, advanceFee: 6, vat: 21 };

const KNOWN_LABELS: Record<string, string> = {
  tacataca: "Taca-taca",
  payway: "Payway",
  mercadopago: "Mercadopago",
  getnet: "Getnet",
};

export function gatewayDisplayLabel(key: string, label?: string): string {
  const trimmed = String(label || "").trim();
  if (trimmed) return trimmed;
  return KNOWN_LABELS[key] || key;
}

function buildGateway(g: unknown, key: string, flatVat: number): GatewayConfigCalc {
  if (!g || typeof g !== "object") return { label: gatewayDisplayLabel(key), vat: flatVat, plans: [] };
  const obj = g as Record<string, unknown>;
  const costs = parseCosts(obj.costs);
  const plans = parsePlans(obj.plans);
  const vat = obj.vat != null ? toNum(obj.vat) : flatVat;
  const label = gatewayDisplayLabel(key, typeof obj.label === "string" ? obj.label : undefined);
  if (costs.length > 0) return { label, costs, vat, plans };
  if (obj.instantRate != null) return { label, instantRate: toNum(obj.instantRate), vat, plans };
  if (obj.cost24h != null)
    return {
      label,
      cardFee: toNum(obj.cardFee ?? DEFAULT_RATES.cardFee),
      cost24h: toNum(obj.cost24h),
      vat,
      plans,
    };
  if (obj.advanceFee != null || obj.cardFee != null) {
    return {
      label,
      cardFee: toNum(obj.cardFee ?? DEFAULT_RATES.cardFee),
      advanceFee: toNum(obj.advanceFee ?? DEFAULT_RATES.advanceFee),
      vat,
      plans,
    };
  }
  return { label, vat, plans };
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
        ? (configJson.settings.gateways as Record<string, unknown>)
        : {};

    const gateways: Record<string, GatewayConfigCalc> = {};
    for (const key of Object.keys(raw)) {
      gateways[key] = buildGateway(raw[key], key, flat.vat);
    }

    const displayGatewayKey =
      typeof configJson?.settings?.displayGatewayKey === "string"
        ? configJson.settings.displayGatewayKey
        : Object.keys(gateways)[0] ?? null;

    return { flat, gateways, displayGatewayKey };
  } catch {
    return {
      flat: {
        cardFee: DEFAULT_RATES.cardFee,
        advanceFee: DEFAULT_RATES.advanceFee,
        vat: DEFAULT_RATES.vat,
      },
      gateways: {},
      displayGatewayKey: null,
    };
  }
}
