"use client";

import { Badge, Button, Card, CardContent, CardHeader, Input } from "@/components/ui";
import {
  useCalculatorLogic,
  GATEWAY_OPTIONS,
  formatCurrency,
  formatPercent,
} from "./hooks/useCalculatorLogic";

export default function CalculadoraPage() {
  const {
    netAmountInput,
    setNetAmountInput,
    selectedPaymentOption,
    setSelectedPaymentOption,
    selectedGateway,
    setSelectedGateway,
    paymentOptions,
    calculation,
    loadingRates,
  } = useCalculatorLogic();

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
                Plan / cuotas
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

            <div className="overflow-hidden rounded-xl border border-red-200 bg-red-50/50 shadow-sm dark:border-red-900/50 dark:bg-red-950/20">
              <div className="border-b border-red-200 bg-red-100/80 px-4 py-3 dark:border-red-900/50 dark:bg-red-950/30">
                <h3 className="text-base font-semibold tracking-tight text-red-950 dark:text-red-100">
                  Resultado
                </h3>
              </div>
              <div className="space-y-5 p-4">
                {loadingRates ? (
                  <p className="text-sm text-muted-foreground">Cargando parámetros...</p>
                ) : calculation.totalDeductionRate >= 1 ? (
                  <p className="rounded-lg border border-danger bg-danger/10 px-4 py-3 text-sm text-danger">
                    La combinación de tasas supera el 100% de descuento total. Revisá los parámetros en Admin.
                  </p>
                ) : (
                  <>
                    <div className="rounded-xl border-2 border-red-200 bg-white p-5 shadow-sm dark:border-red-800/50 dark:bg-red-950/20">
                      <p className="text-sm font-medium text-red-900/80 dark:text-red-200/90">
                        Tenés que cobrar
                      </p>
                      <p className="mt-1 text-3xl font-bold tracking-tight text-red-950 dark:text-red-100 md:text-4xl">
                        {formatCurrency(calculation.grossToCharge)}
                      </p>
                    </div>

                    {calculation.breakdown ? (
                      <div className="space-y-3">
                        <div className="rounded-lg border border-red-200/80 bg-white p-4 dark:border-red-800/40 dark:bg-red-950/10">
                          <p className="text-xs font-semibold uppercase tracking-wider text-red-800/90 dark:text-red-300/90">
                            {calculation.breakdown.costsLabel}
                          </p>
                          {calculation.breakdown.costsItems && calculation.breakdown.costsItems.length > 0 ? (
                            <ul className="mt-2 space-y-2">
                              {calculation.breakdown.costsItems.map((item, idx) => (
                                <li key={idx} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-red-100 last:border-0 last:pb-0 dark:border-red-900/30">
                                  <span className="text-sm text-muted-foreground">
                                    {item.label} {formatPercent(item.ratePct)} + IVA
                                  </span>
                                  <span className="font-semibold text-red-950 dark:text-red-100">
                                    + {formatCurrency(item.amount)}
                                  </span>
                                </li>
                              ))}
                              {calculation.breakdown.costsItems.length > 1 && (
                                <li className="flex justify-between gap-2 pt-1 font-medium text-foreground">
                                  <span>Total</span>
                                  <span className="text-red-950 dark:text-red-100">
                                    + {formatCurrency(calculation.breakdown.costsAmount)}
                                  </span>
                                </li>
                              )}
                            </ul>
                          ) : (
                            <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
                              <p className="text-sm text-muted-foreground">{calculation.breakdown.costsDetail}</p>
                              <p className="font-semibold text-red-950 dark:text-red-100">
                                + {formatCurrency(calculation.breakdown.costsAmount)}
                              </p>
                            </div>
                          )}
                        </div>
                        {calculation.breakdown.planBlockLabel != null && calculation.breakdown.planLabel != null && (
                          <div className="rounded-lg border border-red-200/80 bg-white p-4 dark:border-red-800/40 dark:bg-red-950/10">
                            <p className="text-xs font-semibold uppercase tracking-wider text-red-800/90 dark:text-red-300/90">
                              {calculation.breakdown.planBlockLabel}
                            </p>
                            <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
                              <p className="text-sm text-muted-foreground">
                                {calculation.breakdown.planLabel} {formatPercent(calculation.breakdown.planRatePct ?? 0)} + IVA
                              </p>
                              <p className="font-semibold text-red-950 dark:text-red-100">
                                + {formatCurrency(calculation.breakdown.planAmount ?? 0)}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="rounded-lg border border-red-200/80 bg-white p-4 text-sm dark:border-red-800/40 dark:bg-red-950/10">
                        <p className="text-muted-foreground">
                          Descuento total: {formatCurrency(calculation.totalDeductionAmount)} ({formatPercent(calculation.totalDeductionRate * 100)} con IVA)
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Comisión {formatPercent(calculation.commissionRate * 100)} + IVA sobre comisiones
                        </p>
                      </div>
                    )}

                    <p className="rounded-md border border-red-100 bg-red-50/50 px-3 py-2 text-xs text-muted-foreground dark:border-red-900/30 dark:bg-red-950/20">
                      Precio a publicar = Monto deseado ÷ (1 − Comisión total con IVA)
                    </p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
