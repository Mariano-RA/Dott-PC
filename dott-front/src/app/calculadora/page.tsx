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
        rate: typeof p.rate === "number" && Number.isFinite(p.rate) ? p.rate : 0,
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
          cardFee:
            typeof configJson?.settings?.cardFee === "number"
              ? configJson.settings.cardFee
              : DEFAULT_RATES.cardFee,
          advanceFee:
            typeof configJson?.settings?.advanceFee === "number"
              ? configJson.settings.advanceFee
              : DEFAULT_RATES.advanceFee,
          vat:
            typeof configJson?.settings?.vat === "number"
              ? configJson.settings.vat
              : DEFAULT_RATES.vat,
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
              value: typeof c.value === "number" && Number.isFinite(c.value) ? c.value : 0,
            }));
        };

        const buildGateway = (g: unknown, defaultPlans: GatewayPlan[]): GatewayConfigCalc => {
          if (!g || typeof g !== "object") return { vat: flat.vat, plans: defaultPlans };
          const obj = g as Record<string, unknown>;
          const costs = parseCosts(obj.costs);
          const plans = parsePlans(obj.plans).length ? parsePlans(obj.plans) : defaultPlans;
          const vat = typeof obj.vat === "number" ? obj.vat : flat.vat;
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
      if (selectedPaymentOption === "instant") {
        commissionRate = hasCostsArray ? sumCosts : ((g?.instantRate ?? 6.6) / 100);
      } else {
        const plan = plans.find((p) => p.planKey === selectedPaymentOption);
        commissionRate = (plan?.rate ?? 0) / 100;
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

    return {
      commissionRate,
      totalDeductionRate,
      grossToCharge,
      commissionAmount,
      vatOnCommissionAmount,
      totalDeductionAmount,
      netReceivedAmount,
      effectiveMarkupOverNet,
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
              Los parámetros de cálculo son administrados internamente por Dott PC.
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

            <div className="space-y-3 rounded-lg border border-border p-4">
              <h3 className="text-base">Resultado</h3>
              {loadingRates ? <p className="text-sm text-muted-foreground">Cargando parámetros...</p> : null}
              {calculation.totalDeductionRate >= 1 ? (
                <p className="rounded-md border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">
                  La combinación de tasas supera el 100% de descuento total. Revisá los parámetros en Admin.
                </p>
              ) : null}
              <div className="space-y-1 text-sm">
                <p className="flex items-center justify-between">
                  <span className="text-muted-foreground">Neto deseado</span>
                  <span className="font-medium">{formatCurrency(desiredNetAmount)}</span>
                </p>
                <p className="flex items-center justify-between">
                  <span className="text-muted-foreground">Comision total (%)</span>
                  <span className="font-medium">{formatPercent(calculation.commissionRate * 100)}</span>
                </p>
                <p className="flex items-center justify-between">
                  <span className="text-muted-foreground">Descuento total con IVA (%)</span>
                  <span className="font-medium">{formatPercent(calculation.totalDeductionRate * 100)}</span>
                </p>
                <p className="flex items-center justify-between">
                  <span className="text-muted-foreground">Comisiones ($)</span>
                  <span className="font-medium">{formatCurrency(calculation.commissionAmount)}</span>
                </p>
                <p className="flex items-center justify-between">
                  <span className="text-muted-foreground">IVA sobre comisiones ($)</span>
                  <span className="font-medium">{formatCurrency(calculation.vatOnCommissionAmount)}</span>
                </p>
                <p className="flex items-center justify-between pt-1">
                  <span className="text-muted-foreground">Tenes que cobrar</span>
                  <span className="text-lg font-semibold text-brand">{formatCurrency(calculation.grossToCharge)}</span>
                </p>
                <p className="flex items-center justify-between">
                  <span className="text-muted-foreground">Recibis (control)</span>
                  <span className="font-medium">{formatCurrency(calculation.netReceivedAmount)}</span>
                </p>
                <p className="flex items-center justify-between">
                  <span className="text-muted-foreground">Recargo sobre neto (%)</span>
                  <span className="font-semibold">{formatPercent(calculation.effectiveMarkupOverNet)}</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
