/**
 * Tipos para la configuración de la calculadora (API calculator-config).
 * Usados por el servicio calculator y por useCalculatorLogic.
 */

export type GatewayPlan = { planKey: string; label: string; rate: number };

export type GatewayCost = { id: string; label: string; value: number; vat?: number };

export type CalculatorRates = {
  cardFee: number;
  advanceFee: number;
  cost24h: number;
  vat: number;
};

/** Config unificada: costos editables (array) + IVA + planes. También soporta forma legacy. */
export type GatewayConfigCalc = {
  label?: string;
  costs?: GatewayCost[];
  vat: number;
  plans?: GatewayPlan[];
  cardFee?: number;
  advanceFee?: number;
  cost24h?: number;
  instantRate?: number;
};

export type CalculatorConfigFlat = {
  cardFee: number;
  advanceFee: number;
  vat: number;
};

export type CalculatorConfig = {
  flat: CalculatorConfigFlat;
  gateways: Record<string, GatewayConfigCalc>;
  displayGatewayKey?: string | null;
};
