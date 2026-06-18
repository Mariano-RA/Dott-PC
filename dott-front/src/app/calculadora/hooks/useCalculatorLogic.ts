"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchCalculatorConfig } from "@/lib/api";
import type {
  CalculatorConfig,
  GatewayConfigCalc,
  GatewayCost,
  GatewayPlan,
  CalculatorRates,
} from "@/lib/api/calculator-types";

export const GATEWAY_OPTIONS = [
  { key: "tacataca", label: "Taca-taca" },
  { key: "payway", label: "Payway" },
  { key: "mercadopago", label: "Mercadopago" },
  { key: "getnet", label: "Getnet" },
] as const;

export type GatewayKey = (typeof GATEWAY_OPTIONS)[number]["key"];

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

const DEFAULT_PLANS_GETNET: GatewayPlan[] = [
  { planKey: "1", label: "Credito/Debito 1 cuota", rate: 0 },
  { planKey: "3-estandar", label: "3 cuotas Estandar", rate: 7.41 },
  { planKey: "3-mipyme", label: "3 cuotas MiPyME", rate: 7.36 },
  { planKey: "6-estandar", label: "6 cuotas Estandar", rate: 12.64 },
  { planKey: "6-mipyme", label: "6 cuotas MiPyME", rate: 13.82 },
  { planKey: "9", label: "9 cuotas Estandar", rate: 18.95 },
  { planKey: "12", label: "12 cuotas Estandar", rate: 23.72 },
  { planKey: "18", label: "18 cuotas Estandar", rate: 32.11 },
];

function parseNumber(value: string): number {
  if (!value) return 0;
  const normalized = value.replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatCurrency(value: number): string {
  return value.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatPercent(value: number): string {
  return `${value.toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
}

type CostItem = { label: string; ratePct: number; amount: number; vatPct?: number };
export type CalculationBreakdown = {
  costsLabel: string;
  costsDetail: string;
  costsRatePct: number;
  costsAmount: number;
  costsItems?: CostItem[];
  planBlockLabel?: string;
  planLabel?: string;
  planRatePct?: number;
  planAmount?: number;
  planVatPct?: number;
};

export type CalculationResult = {
  commissionRate: number;
  totalDeductionRate: number;
  grossToCharge: number;
  commissionAmount: number;
  vatOnCommissionAmount: number;
  totalDeductionAmount: number;
  netReceivedAmount: number;
  effectiveMarkupOverNet: number;
  breakdown?: CalculationBreakdown;
};

export function useCalculatorLogic() {
  const [netAmountInput, setNetAmountInput] = useState("100");
  const [selectedPaymentOption, setSelectedPaymentOption] = useState<string>("3");
  const [selectedGateway, setSelectedGateway] = useState<GatewayKey>("tacataca");
  const [config, setConfig] = useState<CalculatorConfig | null>(null);
  const [loadingRates, setLoadingRates] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoadingRates(true);
    fetchCalculatorConfig().then((data) => {
      if (!cancelled) {
        setConfig(data);
        setLoadingRates(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const effectiveConfig: CalculatorConfig = useMemo(() => {
    if (config) return config;
    return {
      flat: { cardFee: 1.8, advanceFee: 6, vat: 21 },
      gateways: {},
    };
  }, [config]);

  const paymentOptions = useMemo(() => {
    const g = effectiveConfig.gateways[selectedGateway];
    const plans =
      (g?.plans?.length ?? 0) > 0
        ? g!.plans!
        : selectedGateway === "mercadopago"
          ? DEFAULT_PLANS_MP
          : selectedGateway === "getnet"
            ? DEFAULT_PLANS_GETNET
            : DEFAULT_PLANS_STANDARD;
    return plans.map((p) => ({ key: p.planKey, label: p.label }));
  }, [effectiveConfig.gateways, selectedGateway]);

  useEffect(() => {
    const validKeys = paymentOptions.map((o) => o.key);
    if (validKeys.length > 0 && !validKeys.includes(selectedPaymentOption)) {
      setSelectedPaymentOption(validKeys[0]);
    }
  }, [selectedGateway, paymentOptions, selectedPaymentOption]);

  const rates: CalculatorRates = useMemo(() => {
    const g = effectiveConfig.gateways[selectedGateway];
    const vat = g?.vat ?? effectiveConfig.flat.vat;
    if (g?.costs?.length) {
      const sum = g.costs.reduce((s, c) => s + c.value, 0);
      return { cardFee: sum, advanceFee: 0, cost24h: 0, vat };
    }
    return {
      cardFee: g?.cardFee ?? effectiveConfig.flat.cardFee,
      advanceFee: g?.advanceFee ?? effectiveConfig.flat.advanceFee,
      cost24h: g?.cost24h ?? 0,
      vat,
    };
  }, [effectiveConfig, selectedGateway]);

  const desiredNetAmount = useMemo(
    () => parseNumber(netAmountInput),
    [netAmountInput]
  );

  const calculation: CalculationResult = useMemo(() => {
    const g = effectiveConfig.gateways[selectedGateway] as
      | GatewayConfigCalc
      | undefined;
    const costsArr = g?.costs;
    const hasCostsArray = Array.isArray(costsArr) && costsArr.length > 0;

    const gatewayVat = g?.vat ?? rates.vat;
    const gatewayVatRate = gatewayVat / 100;

    const plans =
      (g?.plans?.length ?? 0) > 0
        ? g!.plans!
        : selectedGateway === "mercadopago"
          ? DEFAULT_PLANS_MP
          : selectedGateway === "getnet"
            ? DEFAULT_PLANS_GETNET
            : DEFAULT_PLANS_STANDARD;
    const plan = plans.find((p) => p.planKey === selectedPaymentOption);
    const planRate = (plan?.rate ?? 0) / 100;

    // Calculate costs rate and deduction rate with per-item VAT support
    const hasPerItemVat = hasCostsArray && costsArr!.some((c: GatewayCost) => c.vat != null);

    let costsRate: number;
    let totalDeductionRate: number;

    if (hasPerItemVat) {
      // Per-item VAT: each cost has its own VAT, plan uses gateway VAT
      costsRate = costsArr!.reduce((s: number, c: GatewayCost) => s + c.value, 0) / 100;
      const totalCostsDeduction = costsArr!.reduce(
        (s: number, c: GatewayCost) => s + (c.value / 100) * (1 + ((c.vat ?? gatewayVat) / 100)),
        0
      );
      totalDeductionRate = totalCostsDeduction + planRate * (1 + gatewayVatRate);
    } else {
      // Legacy: unified VAT for everything
      costsRate = hasCostsArray
        ? costsArr!.reduce((s, c) => s + c.value, 0) / 100
        : selectedGateway === "mercadopago"
          ? (g?.instantRate ?? 6.6) / 100
          : rates.cardFee / 100 + rates.advanceFee / 100 + rates.cost24h / 100;
      totalDeductionRate = (costsRate + planRate) * (1 + gatewayVatRate);
    }

    if (totalDeductionRate >= 1) {
      return {
        commissionRate: costsRate + planRate,
        totalDeductionRate,
        grossToCharge: 0,
        commissionAmount: 0,
        vatOnCommissionAmount: 0,
        totalDeductionAmount: 0,
        netReceivedAmount: 0,
        effectiveMarkupOverNet: 0,
      };
    }

    const grossToCharge =
      desiredNetAmount > 0 ? desiredNetAmount / (1 - totalDeductionRate) : 0;
    const commissionRate = costsRate + planRate;
    const commissionAmount = grossToCharge * commissionRate;
    const vatOnCommissionAmount = commissionAmount * gatewayVatRate;
    const totalDeductionAmount = commissionAmount + vatOnCommissionAmount;
    const netReceivedAmount = grossToCharge - totalDeductionAmount;
    const effectiveMarkupOverNet =
      desiredNetAmount > 0
        ? (grossToCharge / desiredNetAmount - 1) * 100
        : 0;

    const base: CalculationResult = {
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

    const planLabel = plan?.label ?? `${selectedPaymentOption} cuotas`;
    const planAmount = grossToCharge * planRate * (1 + gatewayVatRate);

    let costsAmount: number;
    let costsItems: CostItem[];

    if (hasPerItemVat) {
      costsAmount = costsArr!.reduce(
        (s: number, c: GatewayCost) =>
          s + grossToCharge * (c.value / 100) * (1 + ((c.vat ?? gatewayVat) / 100)),
        0
      );
      costsItems = costsArr!.map((c: GatewayCost) => ({
        label: c.label || c.id,
        ratePct: c.value,
        vatPct: c.vat ?? gatewayVat,
        amount:
          grossToCharge * (c.value / 100) * (1 + ((c.vat ?? gatewayVat) / 100)),
      }));
    } else if (hasCostsArray && costsArr!.length > 0) {
      costsAmount = grossToCharge * costsRate * (1 + gatewayVatRate);
      costsItems = costsArr!.map((c: GatewayCost) => ({
        label: c.label || c.id,
        ratePct: c.value,
        amount:
          grossToCharge * (c.value / 100) * (1 + gatewayVatRate),
      }));
    } else if (selectedGateway === "mercadopago") {
      costsAmount = grossToCharge * costsRate * (1 + gatewayVatRate);
      costsItems = [
        {
          label: "Costo por cobro",
          ratePct: costsRate * 100,
          amount: costsAmount,
        },
      ];
    } else {
      costsAmount = grossToCharge * costsRate * (1 + gatewayVatRate);
      costsItems = [
        ...(rates.cardFee
          ? [
              {
                label: "Uso de tarjeta",
                ratePct: rates.cardFee,
                amount:
                  grossToCharge *
                  (rates.cardFee / 100) *
                  (1 + gatewayVatRate),
              },
            ]
          : []),
        ...(rates.advanceFee
          ? [
              {
                label: "Anticipo",
                ratePct: rates.advanceFee,
                amount:
                  grossToCharge *
                  (rates.advanceFee / 100) *
                  (1 + gatewayVatRate),
              },
            ]
          : []),
        ...(rates.cost24h
          ? [
              {
                label: "Costo por cobro a 24hs",
                ratePct: rates.cost24h,
                amount:
                  grossToCharge *
                  (rates.cost24h / 100) *
                  (1 + gatewayVatRate),
              },
            ]
          : []),
      ].filter((x) => x.ratePct > 0);
    }

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
        planVatPct: hasPerItemVat ? gatewayVat : undefined,
      },
    };
  }, [
    desiredNetAmount,
    selectedPaymentOption,
    selectedGateway,
    effectiveConfig.gateways,
    rates,
  ]);

  return {
    netAmountInput,
    setNetAmountInput,
    selectedPaymentOption,
    setSelectedPaymentOption,
    selectedGateway,
    setSelectedGateway,
    paymentOptions,
    calculation,
    loadingRates,
    formatCurrency,
    formatPercent,
  };
}
