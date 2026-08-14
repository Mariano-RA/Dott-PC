import { calcularValorCuotasDesdeGateway } from "./precio-cuota.helper";

describe("calcularValorCuotasDesdeGateway", () => {
  it("uses calculator formula with costs, vat and plan rate", () => {
    const result = calcularValorCuotasDesdeGateway(10000, {
      vat: 21,
      costs: [{ id: "cardFee", label: "Tarjeta", value: 1.8 }],
      plans: [{ planKey: "3", label: "3 cuotas", rate: 7.78 }],
    });
    expect(result).toHaveLength(1);
    const planRate = 7.78 / 100;
    const costsRate = 1.8 / 100;
    const totalDeduction = (costsRate + planRate) * 1.21;
    const expectedTotal = Math.round(10000 / (1 - totalDeduction));
    expect(result[0].Total).toBe(expectedTotal);
    expect(result[0].CantidadCuotas).toBe(3);
    expect(result[0].Cuota).toBe(Math.round(expectedTotal / 3));
  });

  it("returns empty when there are no plans", () => {
    expect(calcularValorCuotasDesdeGateway(10000, { vat: 21, plans: [] })).toEqual([]);
  });
});
