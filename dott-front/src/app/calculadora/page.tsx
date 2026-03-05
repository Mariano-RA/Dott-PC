"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, CardContent, CardHeader, Input } from "@/app/components/ui";

const PAYMENT_OPTIONS = [
  { key: "3", label: "3 cuotas" },
  { key: "6", label: "6 cuotas" },
  { key: "planZ", label: "Plan Z" },
] as const;

const DEFAULT_RATES = {
  cardFee: 1.8,
  advanceFee: 6,
  vat: 21,
  installmentFees: {
    "3": 7.78,
    "6": 14.96,
    planZ: 13.4,
  },
};

type PaymentOptionKey = (typeof PAYMENT_OPTIONS)[number]["key"];

type Rates = {
  cardFee: number;
  advanceFee: number;
  vat: number;
  installmentFees: Record<PaymentOptionKey, number>;
};

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
  const [selectedPaymentOption, setSelectedPaymentOption] = useState<PaymentOptionKey>("3");
  const [rates, setRates] = useState<Rates>(DEFAULT_RATES);
  const [loadingRates, setLoadingRates] = useState(true);

  useEffect(() => {
    const fetchRatesFromBackend = async () => {
      setLoadingRates(true);
      try {
        const [plansRes, configRes] = await Promise.all([
          fetch("/api/nest/quote", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ active: true }),
          }),
          fetch("/api/nest/calculator-config"),
        ]);

        const plansJson = plansRes.ok ? await plansRes.json() : null;
        const configJson = configRes.ok ? await configRes.json() : null;

        const nextRates: Rates = {
          ...DEFAULT_RATES,
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
          installmentFees: { ...DEFAULT_RATES.installmentFees },
        };

        const plans = Array.isArray(plansJson?.plans)
          ? (plansJson.plans as Array<{ planKey: string; tasa: number }>)
          : [];

        plans.forEach((plan) => {
          const key = String(plan.planKey) as PaymentOptionKey;
          if (key in nextRates.installmentFees && typeof plan.tasa === "number") {
            nextRates.installmentFees[key] = plan.tasa;
          }
        });

        setRates(nextRates);
      } catch {
        setRates(DEFAULT_RATES);
      } finally {
        setLoadingRates(false);
      }
    };

    fetchRatesFromBackend();
  }, []);

  const desiredNetAmount = useMemo(() => parseNumber(netAmountInput), [netAmountInput]);

  const calculation = useMemo(() => {
    const installmentRate = rates.installmentFees[selectedPaymentOption] / 100;
    const cardRate = rates.cardFee / 100;
    const advanceRate = rates.advanceFee / 100;
    const vatRate = rates.vat / 100;

    const commissionRate = installmentRate + cardRate + advanceRate;
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
  }, [desiredNetAmount, selectedPaymentOption, rates]);

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
              <p className="text-sm font-medium text-foreground">Plan / cuotas</p>
              <div className="grid grid-cols-3 gap-2">
                {PAYMENT_OPTIONS.map((option) => (
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
