import { Linea, MINIMO_ENVIO_USD, Opcion, cotizar } from "./armado.calculo";

let siguienteId = 1;
function op(proveedor: string, usd: number, cliente: number, id = siguienteId++): Opcion {
  return { id, proveedor, codigo: `C${id}`, producto: `${proveedor} ${usd}`, precioUsd: usd, precioCliente: cliente };
}
const linea = (nombre: string, opciones: Opcion[], cantidad = 1): Linea => ({ nombre, cantidad, opciones });

/** Armado de ejemplo: nb es el más barato en todo, pero su total (USD 515) no llega al mínimo de envío. */
function escenarioNbBarato(): Linea[] {
  return [
    linea("CPU", [op("air", 200, 260000), op("elit", 210, 273000), op("nb", 190, 247000)]),
    linea("GPU", [op("air", 300, 390000), op("elit", 290, 377000), op("nb", 280, 364000)]),
    linea("RAM", [op("air", 50, 65000), op("elit", 55, 71500), op("nb", 45, 58500)]),
  ];
}

describe("cotizar", () => {
  beforeEach(() => (siguienteId = 1));

  it("el mínimo de envío de nb e invid es de USD 600", () => {
    expect(MINIMO_ENVIO_USD).toEqual({ nb: 600, invid: 600 });
  });

  it("la más barata en total puede ser nb aunque no llegue al mínimo, y lo avisa", () => {
    const r = cotizar(escenarioNbBarato());
    expect(r.mejorAbsoluta?.proveedores).toEqual(["nb"]);
    expect(r.mejorAbsoluta?.totalCliente).toBe(669500);
    expect(r.mejorAbsoluta?.totalUsd).toBe(515);
    expect(r.mejorAbsoluta?.sinCostoDeEnvio).toBe(false);
    expect(r.mejorAbsoluta?.avisos[0]).toMatch(/nb: el pedido es de US\$515.*mínimo de US\$600.*envío/);
  });

  it("la mejor sin riesgo de envío evita nb y mezcla air y elit si conviene", () => {
    const r = cotizar(escenarioNbBarato());
    const plan = r.mejorSinEnvio!;
    expect(plan.proveedores).toEqual(["air", "elit"]);
    expect(plan.sinCostoDeEnvio).toBe(true);
    expect(plan.avisos).toEqual([]);
    // CPU y RAM en air, GPU en elit: 260000 + 377000 + 65000
    expect(plan.totalCliente).toBe(702000);
    expect(plan.asignaciones.map((a) => `${a.linea}:${a.opcion.proveedor}`)).toEqual(["CPU:air", "GPU:elit", "RAM:air"]);
  });

  it("nb sí se usa sin riesgo si su subtotal llega a USD 600", () => {
    const lineas = [
      linea("GPU", [op("air", 700, 910000), op("nb", 650, 845000)]),
      linea("CPU", [op("air", 200, 260000), op("nb", 190, 247000)]),
    ];
    const r = cotizar(lineas);
    expect(r.mejorSinEnvio?.proveedores).toEqual(["nb"]);
    expect(r.mejorSinEnvio?.totalUsd).toBe(840);
    expect(r.mejorSinEnvio?.porProveedor[0]).toMatchObject({ proveedor: "nb", alcanzaMinimo: true, minimoEnvioUsd: 600 });
  });

  it("un proveedor sin mínimo (air, elit, eikon) nunca genera aviso de envío", () => {
    const r = cotizar([linea("CPU", [op("air", 50, 65000)]), linea("RAM", [op("air", 20, 26000)])]);
    expect(r.mejorAbsoluta?.sinCostoDeEnvio).toBe(true);
    expect(r.mejorAbsoluta?.porProveedor[0]).toMatchObject({ minimoEnvioUsd: null, alcanzaMinimo: null });
    expect(r.mejorAbsoluta?.avisos).toEqual([]);
  });

  it("un solo proveedor: lista solo los que tienen todas las piezas, del más barato al más caro", () => {
    const lineas = [
      linea("CPU", [op("air", 200, 260000), op("elit", 210, 273000), op("eikon", 205, 266500)]),
      linea("GPU", [op("air", 300, 390000), op("elit", 280, 364000)]), // eikon no tiene GPU
    ];
    const r = cotizar(lineas);
    expect(r.unSoloProveedor.map((p) => p.proveedores[0])).toEqual(["elit", "air"]);
    expect(r.unSoloProveedor.map((p) => p.totalCliente)).toEqual([637000, 650000]);
  });

  it("en un empate de precio gana el plan con menos proveedores y, luego, el orden alfabético", () => {
    const lineas = [linea("CPU", [op("elit", 100, 130000), op("air", 100, 130000)])];
    const r = cotizar(lineas);
    expect(r.mejorAbsoluta?.proveedores).toEqual(["air"]);
    expect(r.unSoloProveedor.map((p) => p.proveedores[0])).toEqual(["air", "elit"]);
  });

  it("multiplica por la cantidad", () => {
    const r = cotizar([linea("RAM", [op("air", 50, 65000)], 2), linea("CPU", [op("air", 200, 260000)])]);
    expect(r.mejorAbsoluta?.totalUsd).toBe(300);
    expect(r.mejorAbsoluta?.totalCliente).toBe(390000);
    expect(r.mejorAbsoluta?.asignaciones[0]).toMatchObject({ linea: "RAM", cantidad: 2, subtotalUsd: 100, subtotalCliente: 130000 });
  });

  it("de varias opciones del mismo proveedor en una línea elige la más barata", () => {
    const r = cotizar([linea("CPU", [op("air", 250, 325000, 10), op("air", 200, 260000, 11)])]);
    expect(r.mejorAbsoluta?.asignaciones[0].opcion.id).toBe(11);
  });

  it("si una línea no tiene ninguna opción, no arma planes y avisa cuál falta", () => {
    const r = cotizar([linea("CPU", [op("air", 200, 260000)]), linea("Fuente", [])]);
    expect(r.lineasSinOpciones).toEqual(["Fuente"]);
    expect(r.mejorAbsoluta).toBeNull();
    expect(r.mejorSinEnvio).toBeNull();
    expect(r.unSoloProveedor).toEqual([]);
  });

  it("si solo nb puede cubrir todo y no llega al mínimo, no hay plan sin riesgo pero sí uno con aviso", () => {
    const r = cotizar([linea("CPU", [op("nb", 190, 247000)]), linea("RAM", [op("nb", 45, 58500)])]);
    expect(r.mejorSinEnvio).toBeNull();
    expect(r.mejorAbsoluta?.avisos).toHaveLength(1);
  });

  it("un plan solo cuenta los proveedores que realmente usa (no duplica combinaciones)", () => {
    const r = cotizar(escenarioNbBarato());
    // Ningún plan mezcla un proveedor al que no le toca ninguna pieza.
    for (const plan of [r.mejorAbsoluta!, r.mejorSinEnvio!, ...r.unSoloProveedor]) {
      expect(plan.proveedores).toEqual(plan.porProveedor.map((p) => p.proveedor));
      expect(plan.totalUsd).toBe(plan.porProveedor.reduce((s, p) => s + p.usd, 0));
    }
  });

  it("sin líneas devuelve vacío", () => {
    const r = cotizar([]);
    expect(r).toEqual({ lineasSinOpciones: [], mejorSinEnvio: null, mejorAbsoluta: null, unSoloProveedor: [] });
  });
});
