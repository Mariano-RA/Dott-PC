import { BadRequestException, UnprocessableEntityException } from "@nestjs/common";
import { AgentDolarService, USUARIO_AGENTE } from "./agent-dolar.service";

type Fila = { proveedorId: number; precioDolar: number; proveedor: { nombre: string } };

function setup(options: { filas?: Fila[]; proveedores?: Array<{ id: number; nombre: string; activo: boolean }> } = {}) {
  const filas: Fila[] = options.filas ?? [
    { proveedorId: 1, precioDolar: 1400, proveedor: { nombre: "air" } },
    { proveedorId: 2, precioDolar: 1450, proveedor: { nombre: "elit" } },
  ];
  const proveedores = options.proveedores ?? [
    { id: 1, nombre: "air", activo: true },
    { id: 2, nombre: "elit", activo: true },
    { id: 3, nombre: "nb", activo: true },
    { id: 4, nombre: "viejo", activo: false },
  ];
  const dolares = {
    findAll: jest.fn(async () => filas),
    upsertOne: jest.fn(async () => ({})),
  };
  const proveedorService = {
    findByNombre: jest.fn(async (n: string) => proveedores.find((p) => p.nombre === n)),
    findActivos: jest.fn(async () => proveedores.filter((p) => p.activo)),
  };
  const service = new AgentDolarService(dolares as any, proveedorService as any);
  return { service, dolares, proveedorService };
}

describe("AgentDolarService.listar", () => {
  it("devuelve el valor de cada proveedor, ordenado, con resumen", async () => {
    const { service } = setup();
    const res = await service.listar();
    expect(res.proveedores).toEqual([
      { proveedor: "air", precioDolar: 1400 },
      { proveedor: "elit", precioDolar: 1450 },
    ]);
    expect(res.resumen).toBe("air: $1400; elit: $1450");
  });

  it("avisa si no hay nada cargado", async () => {
    const { service } = setup({ filas: [] });
    expect((await service.listar()).resumen).toMatch(/No hay valores/);
  });
});

describe("AgentDolarService.actualizar", () => {
  it("actualiza un proveedor puntual, deja rastro del agente y no toca a los demás", async () => {
    const { service, dolares } = setup();
    const res = await service.actualizar({ precioDolar: 1500, proveedor: "air" });
    expect(dolares.upsertOne).toHaveBeenCalledTimes(1);
    expect(dolares.upsertOne).toHaveBeenCalledWith({
      precioDolar: 1500,
      proveedorId: 1,
      usuario: USUARIO_AGENTE,
      motivo: expect.stringContaining("Hermes"),
    });
    expect(res).toMatchObject({ ok: true, actualizados: [{ proveedor: "air", antes: 1400, despues: 1500 }] });
  });

  it("con todos=true aplica el mismo valor a todos los que ya tienen dólar", async () => {
    const { service, dolares } = setup();
    const res = await service.actualizar({ precioDolar: 1480, todos: true });
    expect(dolares.upsertOne).toHaveBeenCalledTimes(2);
    expect(res.actualizados.map((a) => a.proveedor)).toEqual(["air", "elit"]);
    expect(res.resumen).toContain("air (antes $1400)");
  });

  it("exige elegir: ni proveedor ni todos, o los dos, es un error", async () => {
    const { service, dolares } = setup();
    await expect(service.actualizar({ precioDolar: 1500 })).rejects.toThrow(BadRequestException);
    await expect(service.actualizar({ precioDolar: 1500, proveedor: "air", todos: true })).rejects.toThrow(
      BadRequestException,
    );
    expect(dolares.upsertOne).not.toHaveBeenCalled();
  });

  it("todos=false sin proveedor tampoco cuenta como 'todos'", async () => {
    const { service, dolares } = setup();
    await expect(service.actualizar({ precioDolar: 1500, todos: false })).rejects.toThrow(BadRequestException);
    expect(dolares.upsertOne).not.toHaveBeenCalled();
  });

  it("rechaza un proveedor que no existe o está inactivo y lista los disponibles (no crea proveedores)", async () => {
    const { service, dolares } = setup();
    const error = await service.actualizar({ precioDolar: 1500, proveedor: "noexiste" }).catch((e) => e);
    expect(error).toBeInstanceOf(BadRequestException);
    expect(error.message).toMatch(/air, elit, nb/);
    await expect(service.actualizar({ precioDolar: 1500, proveedor: "viejo" })).rejects.toThrow(BadRequestException);
    expect(dolares.upsertOne).not.toHaveBeenCalled();
  });

  it("frena un cambio de más de 30% sin confirmación", async () => {
    const { service, dolares } = setup();
    const error = await service.actualizar({ precioDolar: 14500, proveedor: "air" }).catch((e) => e);
    expect(error).toBeInstanceOf(UnprocessableEntityException);
    expect(error.message).toMatch(/air \(1400 → 14500\)/);
    expect(dolares.upsertOne).not.toHaveBeenCalled();
  });

  it("acepta el cambio grande si viene confirmado", async () => {
    const { service, dolares } = setup();
    await service.actualizar({ precioDolar: 2000, proveedor: "air", confirmado: true });
    expect(dolares.upsertOne).toHaveBeenCalledTimes(1);
  });

  it("con todos, si UNO se pasa del límite no se aplica ninguno", async () => {
    const { service, dolares } = setup();
    await expect(service.actualizar({ precioDolar: 1000, todos: true })).rejects.toThrow(UnprocessableEntityException);
    expect(dolares.upsertOne).not.toHaveBeenCalled();
  });

  it("un cambio de exactamente 30% pasa; uno apenas mayor, no", async () => {
    const { service } = setup();
    await expect(service.actualizar({ precioDolar: 1820, proveedor: "air" })).resolves.toMatchObject({ ok: true }); // +30%
    await expect(service.actualizar({ precioDolar: 1821, proveedor: "air" })).rejects.toThrow(UnprocessableEntityException);
  });

  it("un proveedor sin dólar previo se crea sin control de proporción", async () => {
    const { service, dolares } = setup();
    const res = await service.actualizar({ precioDolar: 99999, proveedor: "nb" });
    expect(dolares.upsertOne).toHaveBeenCalledWith(expect.objectContaining({ proveedorId: 3, precioDolar: 99999 }));
    expect(res.resumen).toContain("nb (nuevo)");
  });

  it("informa los que fallaron y sigue con el resto", async () => {
    const { service, dolares } = setup();
    dolares.upsertOne.mockRejectedValueOnce(new Error("db caída"));
    const res = await service.actualizar({ precioDolar: 1450, todos: true });
    expect(res.ok).toBe(false);
    expect(res.fallidos).toEqual(["air"]);
    expect(res.actualizados.map((a) => a.proveedor)).toEqual(["elit"]);
    expect(res.resumen).toContain("Fallaron: air");
  });

  it("limpia el motivo del modelo", async () => {
    const { service, dolares } = setup();
    await service.actualizar({ precioDolar: 1450, proveedor: "air", motivo: "  subió\n\tel blue  " });
    expect(dolares.upsertOne).toHaveBeenCalledWith(expect.objectContaining({ motivo: "subió el blue" }));
  });

  it("sin proveedores con dólar y todos=true, avisa", async () => {
    const { service } = setup({ filas: [] });
    await expect(service.actualizar({ precioDolar: 1450, todos: true })).rejects.toThrow(/No hay proveedores/);
  });
});
