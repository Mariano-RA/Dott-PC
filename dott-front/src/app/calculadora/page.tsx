"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, CardContent, CardHeader, Input } from "@/app/components/ui";

const GATEWAY_OPTIONS = [
  { key: "tacataca", label: "Taca-taca" },
  { key: "payway", label: "Payway" },
  { key: "mercadopago", label: "Mercadopago" },
] as const;

type GatewayKey = (typeof GATEWAY_OPTIONS)[number]["key"];

const DEFAULT_RATES = {
  cardFee: 1.8,
  advanceFee: 6,
  vat: 21,
};

type GatewayPlan = { planKey: string; label: string; rate: number };

type Rates = {
  cardFee: number;
  advanceFee: number;
  cost24h: number;
  vat: number;
};

/** Config unificada: costos editables (array) + IVA + planes. También soporta forma legacy (cardFee, advanceFee, etc.). */
type GatewayConfigCalc = {
  costs?: { id: string; label: string; value: number }[];
  vat: number;
  plans?: GatewayPlan[];
  cardFee?: number;
  advanceFee?: number;
  cost24h?: number;
  instantRate?: number;
};

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

function parseNumber(value: string): number {
  if (!value) {
    return 0;
  }

  const normalized = value.replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Coerce API value (number or string) to number for percentages. */
function toNum(x: unknown): number {
  if (typeof x === "number" && Number.isFinite(x)) return x;
  if (typeof x === "string") {
    const n = Number(x.replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function formatCurrency(value: number): string {
  return value.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatPercent(value: number): string {
  return `${value.toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
}

export default function CalculadoraPage() {
  const [netAmountInput, setNetAmountInput] = useState("100");
  const [selectedPaymentOption, setSelectedPaymentOption] = useState<string>("3");
  const [selectedGateway, setSelectedGateway] = useState<GatewayKey>("tacataca");
  const [config, setConfig] = useState<{
    flat: { cardFee: number; advanceFee: number; vat: number };
    gateways: Record<string, GatewayConfigCalc>;
  }>({
    flat: { cardFee: DEFAULT_RATES.cardFee, advanceFee: DEFAULT_RATES.advanceFee, vat: DEFAULT_RATES.vat },
    gateways: {},
  });
  const [loadingRates, setLoadingRates] = useState(true);

  const parsePlans = (arr: unknown): GatewayPlan[] => {
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((p) => p && typeof p.planKey === "string")
      .map((p) => ({
        planKey: String(p.planKey),
        label: typeof p.label === "string" ? p.label : String(p.planKey),
        rate: toNum(p.rate),
      }))
      .filter((p) => p.planKey.trim());
  };

  useEffect(() => {
    const fetchRatesFromBackend = async () => {
      setLoadingRates(true);
      try {
        const configRes = await fetch("/api/nest/calculator-config");
        const configJson = configRes.ok ? await configRes.json() : null;

        const flat = {
          cardFee: configJson?.settings?.cardFee != null ? toNum(configJson.settings.cardFee) : DEFAULT_RATES.cardFee,
          advanceFee: configJson?.settings?.advanceFee != null ? toNum(configJson.settings.advanceFee) : DEFAULT_RATES.advanceFee,
          vat: configJson?.settings?.vat != null ? toNum(configJson.settings.vat) : DEFAULT_RATES.vat,
        };

        const raw =
          configJson?.settings?.gateways && typeof configJson.settings.gateways === "object"
            ? configJson.settings.gateways
            : {};

        const parseCosts = (arr: unknown): { id: string; label: string; value: number }[] => {
          if (!Array.isArray(arr)) return [];
          return arr
            .filter((c) => c && typeof c.id === "string")
            .map((c) => ({
              id: String(c.id),
              label: typeof c.label === "string" ? c.label : String(c.id),
              value: toNum(c.value),
            }));
        };

        const buildGateway = (g: unknown, defaultPlans: GatewayPlan[]): GatewayConfigCalc => {
          if (!g || typeof g !== "object") return { vat: flat.vat, plans: defaultPlans };
          const obj = g as Record<string, unknown>;
          const costs = parseCosts(obj.costs);
          const plans = parsePlans(obj.plans).length ? parsePlans(obj.plans) : defaultPlans;
          const vat = obj.vat != null ? toNum(obj.vat) : flat.vat;
          if (costs.length > 0) return { costs, vat, plans };
          if (obj.instantRate != null) return { instantRate: Number(obj.instantRate), vat, plans };
          if (obj.cost24h != null) return { cardFee: Number(obj.cardFee ?? flat.cardFee), cost24h: Number(obj.cost24h), vat, plans };
          return { cardFee: Number(obj.cardFee ?? flat.cardFee), advanceFee: Number(obj.advanceFee ?? flat.advanceFee), vat, plans };
        };

        const gateways: Record<string, GatewayConfigCalc> = {};
        if (raw.tacataca) gateways.tacataca = buildGateway(raw.tacataca, DEFAULT_PLANS_STANDARD);
        if (raw.payway) gateways.payway = buildGateway(raw.payway, DEFAULT_PLANS_STANDARD);
        if (raw.mercadopago) {
          const mp = raw.mercadopago as { plans?: unknown; installmentRates?: Record<string, number> };
          const plansFromApi = parsePlans(mp.plans);
          const plans =
            plansFromApi.length > 0
              ? plansFromApi
              : mp.installmentRates
                ? Object.entries(mp.installmentRates).map(([k, v]) => ({ planKey: k, label: k === "planZ" ? "Plan Z" : `${k} cuotas`, rate: Number(v) }))
                : DEFAULT_PLANS_MP;
          gateways.mercadopago = buildGateway(raw.mercadopago, plans);
        }

        setConfig({ flat, gateways });
      } catch {
        setConfig({
          flat: { cardFee: DEFAULT_RATES.cardFee, advanceFee: DEFAULT_RATES.advanceFee, vat: DEFAULT_RATES.vat },
          gateways: {},
        });
      } finally {
        setLoadingRates(false);
      }
    };

    fetchRatesFromBackend();
  }, []);

  const paymentOptions = useMemo(() => {
    const g = config.gateways[selectedGateway];
    const plans = g?.plans?.length ? g.plans : selectedGateway === "mercadopago" ? DEFAULT_PLANS_MP : DEFAULT_PLANS_STANDARD;
    if (selectedGateway === "mercadopago") return [{ key: "instant", label: "En el momento" }, ...plans.map((p) => ({ key: p.planKey, label: p.label }))];
    return plans.map((p) => ({ key: p.planKey, label: p.label }));
  }, [config.gateways, selectedGateway]);

  useEffect(() => {
    const validKeys = paymentOptions.map((o) => o.key);
    if (!validKeys.includes(selectedPaymentOption)) {
      setSelectedPaymentOption(validKeys[0] ?? "3");
    }
  }, [selectedGateway, paymentOptions, selectedPaymentOption]);

  const rates: Rates = useMemo(() => {
    const g = config.gateways[selectedGateway];
    const vat = g?.vat ?? config.flat.vat;
    if (g?.costs?.length) {
      const sum = g.costs.reduce((s, c) => s + c.value, 0);
      return { cardFee: sum, advanceFee: 0, cost24h: 0, vat };
    }
    return {
      cardFee: g?.cardFee ?? config.flat.cardFee,
      advanceFee: g?.advanceFee ?? config.flat.advanceFee,
      cost24h: g?.cost24h ?? 0,
      vat,
    };
  }, [config, selectedGateway]);

  const desiredNetAmount = useMemo(() => parseNumber(netAmountInput), [netAmountInput]);

  const calculation = useMemo(() => {
    const vatRate = rates.vat / 100;
    let commissionRate: number;

    const g = config.gateways[selectedGateway];
    const costsArr = g?.costs;
    const hasCostsArray = Array.isArray(costsArr) && costsArr.length > 0;
    const sumCosts = hasCostsArray ? costsArr!.reduce((s, c) => s + c.value, 0) / 100 : 0;

    if (selectedGateway === "mercadopago") {
      const plans = g?.plans ?? DEFAULT_PLANS_MP;
      const instantRate = hasCostsArray ? sumCosts : (g?.instantRate ?? 6.6) / 100;
      if (selectedPaymentOption === "instant") {
        commissionRate = instantRate;
      } else {
        // Mercadopago cobra costo por cobro en el momento + tasa por cuotas sin interés
        const plan = plans.find((p) => p.planKey === selectedPaymentOption);
        const planRate = (plan?.rate ?? 0) / 100;
        commissionRate = instantRate + planRate;
      }
    } else {
      const plans = g?.plans ?? DEFAULT_PLANS_STANDARD;
      const plan = plans.find((p) => p.planKey === selectedPaymentOption);
      const installmentRate = (plan?.rate ?? 0) / 100;
      if (hasCostsArray) {
        commissionRate = sumCosts + installmentRate;
      } else {
        const cardRate = rates.cardFee / 100;
        const advanceRate = rates.advanceFee / 100;
        const cost24hRate = rates.cost24h / 100;
        commissionRate = installmentRate + cardRate + advanceRate + cost24hRate;
      }
    }

    // Mercadopago: Precio a publicar = Monto deseado / (1 - (Comisión A + Comisión B))
    // Aquí (Comisión A + Comisión B) = totalDeductionRate = comisión con IVA incluido
    const totalDeductionRate = commissionRate * (1 + vatRate);

    if (totalDeductionRate >= 1) {
      return {
        commissionRate,
        totalDeductionRate,
        grossToCharge: 0,
        commissionAmount: 0,
        vatOnCommissionAmount: 0,
        totalDeductionAmount: 0,
        netReceivedAmount: 0,
        effectiveMarkupOverNet: 0,
      };
    }

    const grossToCharge = desiredNetAmount > 0 ? desiredNetAmount / (1 - totalDeductionRate) : 0;
    const commissionAmount = grossToCharge * commissionRate;
    const vatOnCommissionAmount = commissionAmount * vatRate;
    const totalDeductionAmount = commissionAmount + vatOnCommissionAmount;
    const netReceivedAmount = grossToCharge - totalDeductionAmount;
    const effectiveMarkupOverNet = desiredNetAmount > 0 ? ((grossToCharge / desiredNetAmount) - 1) * 100 : 0;

    const base = {
      commissionRate,
      totalDeductionRate,
      grossToCharge,
      commissionAmount,
      vatOnCommissionAmount,
      totalDeductionAmount,
      netReceivedAmount,
      effectiveMarkupOverNet,
    };

    if (grossToCharge <= 0) return base;

    // Desglose por pasarela (misma ecuación: Precio = Monto ÷ (1 − (Comisión A + Comisión B)))
    type CostItem = { label: string; ratePct: number; amount: number };
    type Breakdown = {
      costsLabel: string;
      costsDetail: string;
      costsRatePct: number;
      costsAmount: number;
      costsItems?: CostItem[];
      planBlockLabel?: string;
      planLabel?: string;
      planRatePct?: number;
      planAmount?: number;
    };

    if (selectedGateway === "mercadopago") {
      const g = config.gateways.mercadopago;
      const plans = g?.plans ?? DEFAULT_PLANS_MP;
      const instantRate = hasCostsArray ? sumCosts : (g?.instantRate ?? 6.6) / 100;
      const instantAmount = grossToCharge * instantRate * (1 + vatRate);
      if (selectedPaymentOption === "instant") {
        return { ...base, breakdown: { costsLabel: "Costo por cobro", costsDetail: "En el momento " + formatPercent(instantRate * 100) + " + IVA", costsRatePct: instantRate * 100, costsAmount: instantAmount } as Breakdown };
      }
      const plan = plans.find((p) => p.planKey === selectedPaymentOption);
      const planRate = (plan?.rate ?? 0) / 100;
      const planAmount = grossToCharge * planRate * (1 + vatRate);
      const planLabel = plan?.label ?? `${selectedPaymentOption} cuotas`;
      return {
        ...base,
        breakdown: {
          costsLabel: "Costo por cobro",
          costsDetail: "En el momento " + formatPercent(instantRate * 100) + " + IVA",
          costsRatePct: instantRate * 100,
          costsAmount: instantAmount,
          planBlockLabel: "Costo por ofrecer cuotas sin interés",
          planLabel,
          planRatePct: planRate * 100,
          planAmount,
        } as Breakdown,
      };
    }

    // Taca-taca y Payway: costos/comisiones (cada ítem) + plan de cuotas
    const plans = g?.plans ?? DEFAULT_PLANS_STANDARD;
    const plan = plans.find((p) => p.planKey === selectedPaymentOption);
    const planRate = (plan?.rate ?? 0) / 100;
    const planAmount = grossToCharge * planRate * (1 + vatRate);
    const planLabel = plan?.label ?? `${selectedPaymentOption} cuotas`;

    const costsRate = hasCostsArray ? sumCosts : (rates.cardFee / 100) + (rates.advanceFee / 100) + (rates.cost24h / 100);
    const costsAmount = grossToCharge * costsRate * (1 + vatRate);

    const costsItems: CostItem[] = hasCostsArray && costsArr!.length > 0
      ? costsArr!.map((c) => ({
          label: c.label || c.id,
          ratePct: c.value,
          amount: grossToCharge * (c.value / 100) * (1 + vatRate),
        }))
      : [
          ...(rates.cardFee ? [{ label: "Uso de tarjeta", ratePct: rates.cardFee, amount: grossToCharge * (rates.cardFee / 100) * (1 + vatRate) }] : []),
          ...(rates.advanceFee ? [{ label: "Anticipo", ratePct: rates.advanceFee, amount: grossToCharge * (rates.advanceFee / 100) * (1 + vatRate) }] : []),
          ...(rates.cost24h ? [{ label: "Costo por cobro a 24hs", ratePct: rates.cost24h, amount: grossToCharge * (rates.cost24h / 100) * (1 + vatRate) }] : []),
        ].filter((x) => x.ratePct > 0);

    return {
      ...base,
      breakdown: {
        costsLabel: "Costos y comisiones",
        costsDetail: formatPercent(costsRate * 100) + " + IVA",
        costsRatePct: costsRate * 100,
        costsAmount,
        costsItems: costsItems.length > 0 ? costsItems : undefined,
        planBlockLabel: "Costo por cuotas",
        planLabel,
        planRatePct: planRate * 100,
        planAmount,
      } as Breakdown,
    };
  }, [desiredNetAmount, selectedPaymentOption, selectedGateway, config.gateways, rates]);

  return (
    <main className="container-page py-10 md:py-14">
      <section className="mx-auto w-full max-w-4xl">
        <Card variant="elevated">
          <CardHeader className="space-y-2">
            <Badge
              size="sm"
              className="border-red-200 bg-red-100 text-red-900"
            >
              Calculadora
            </Badge>
            <h1>Costos por venta con tarjeta</h1>
            <p className="text-sm text-muted-foreground">
              Ingresá cuánto querés recibir neto y la calculadora te dice cuánto tenés que cobrar para cubrir
              comisiones, impuestos y descuentos.
            </p>
            <p className="text-xs text-muted-foreground">
              Los parámetros de cálculo son administrados internamente por Dott PC. En Mercadopago, para cuotas sin interés se suma el costo por cobro en el momento + la tasa del plan.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Cuanto queres recibir (neto)"
              type="number"
              min="0"
              step="0.01"
              value={netAmountInput}
              onChange={(event) => setNetAmountInput(event.target.value)}
              placeholder="0"
            />

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Pasarela de pago</p>
              <div className="grid grid-cols-3 gap-2">
                {GATEWAY_OPTIONS.map((option) => (
                  <Button
                    key={option.key}
                    type="button"
                    variant="secondary"
                    className={
                      selectedGateway === option.key
                        ? "border-red-950 bg-red-950 text-white hover:bg-red-900 hover:text-white"
                        : "border-red-300 bg-white text-red-950 hover:bg-red-50"
                    }
                    onClick={() => setSelectedGateway(option.key)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">
                {selectedGateway === "mercadopago" ? "Cobro en el momento o cuotas sin interés" : "Plan / cuotas"}
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {paymentOptions.map((option) => (
                  <Button
                    key={option.key}
                    type="button"
                    variant="secondary"
                    className={
                      selectedPaymentOption === option.key
                        ? "border-red-950 bg-red-950 text-white hover:bg-red-900 hover:text-white"
                        : "border-red-300 bg-white text-red-950 hover:bg-red-50"
                    }
                    onClick={() => setSelectedPaymentOption(option.key)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-4 rounded-lg border border-border p-4">
              <h3 className="text-base font-medium text-foreground">Resultado</h3>
              {loadingRates ? (
                <p className="text-sm text-muted-foreground">Cargando parámetros...</p>
              ) : calculation.totalDeductionRate >= 1 ? (
                <p className="rounded-md border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">
                  La combinación de tasas supera el 100% de descuento total. Revisá los parámetros en Admin.
                </p>
              ) : (
                <>
                  <div className="rounded-lg bg-muted/50 p-4">
                    <p className="text-sm text-muted-foreground">Tenés que cobrar</p>
                    <p className="text-2xl font-semibold tracking-tight text-brand md:text-3xl">
                      {formatCurrency(calculation.grossToCharge)}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Para recibir {formatCurrency(calculation.netReceivedAmount)} neto
                    </p>
                  </div>
                  {"breakdown" in calculation && calculation.breakdown ? (
                    <div className="space-y-4 text-sm">
                      <div>
                        <p className="font-medium text-foreground">{calculation.breakdown.costsLabel}</p>
                        {calculation.breakdown.costsItems && calculation.breakdown.costsItems.length > 0 ? (
                          <>
                            {calculation.breakdown.costsItems.map((item, idx) => (
                              <div key={idx} className="mt-1">
                                <p className="text-muted-foreground">
                                  {item.label} {formatPercent(item.ratePct)} + IVA
                                </p>
                                <p className="font-medium text-foreground">+ {formatCurrency(item.amount)}</p>
                              </div>
                            ))}
                            {calculation.breakdown.costsItems.length > 1 && (
                              <p className="mt-1 font-medium text-foreground">
                                Total + {formatCurrency(calculation.breakdown.costsAmount)}
                              </p>
                            )}
                          </>
                        ) : (
                          <>
                            <p className="text-muted-foreground">{calculation.breakdown.costsDetail}</p>
                            <p className="font-medium text-foreground">+ {formatCurrency(calculation.breakdown.costsAmount)}</p>
                          </>
                        )}
                      </div>
                      {calculation.breakdown.planBlockLabel != null && calculation.breakdown.planLabel != null && (
                        <div>
                          <p className="font-medium text-foreground">{calculation.breakdown.planBlockLabel}</p>
                          <p className="text-muted-foreground">
                            En {calculation.breakdown.planLabel} {formatPercent(calculation.breakdown.planRatePct ?? 0)} + IVA
                          </p>
                          <p className="font-medium text-foreground">+ {formatCurrency(calculation.breakdown.planAmount ?? 0)}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      <p>
                        Descuento total: {formatCurrency(calculation.totalDeductionAmount)} ({formatPercent(calculation.totalDeductionRate * 100)} con IVA)
                      </p>
                      <p className="mt-0.5 text-xs">
                        Comisión {formatPercent(calculation.commissionRate * 100)} + IVA sobre comisiones
                      </p>
                    </div>
                  )}
                  <p className="border-t border-border pt-3 text-xs text-muted-foreground">
                    Precio a publicar = Monto deseado ÷ (1 − Comisión total con IVA)
                  </p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
