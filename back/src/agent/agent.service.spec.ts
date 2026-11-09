import { BadRequestException, HttpException } from "@nestjs/common";
import { AgentService, COOLDOWN_MS, SIN_RESPUESTA_MS } from "./agent.service";
import { ImportStatus } from "../productos/import-status.service";

function setup(options: { disponibles?: string[]; estados?: ImportStatus[] } = {}) {
  const disponibles = options.disponibles ?? ["air", "elit"];
  const trigger = { triggerFetchPrices: jest.fn().mockResolvedValue("mensaje de prueba") };
  const status = { list: jest.fn(() => options.estados ?? []) };
  const proveedorService = { findNombresDescargaAutomatica: jest.fn(async () => disponibles) };
  const service = new AgentService(trigger as any, status as any, proveedorService as any);
  return { service, trigger, status, proveedorService };
}

describe("AgentService.actualizarProveedores", () => {
  let now = 1_700_000_000_000;
  beforeEach(() => {
    now = 1_700_000_000_000;
    jest.spyOn(Date, "now").mockImplementation(() => now);
  });
  afterEach(() => jest.restoreAllMocks());

  it("dispara la descarga de todos si no se indica proveedor", async () => {
    const { service, trigger } = setup();
    const res = await service.actualizarProveedores();
    expect(trigger.triggerFetchPrices).toHaveBeenCalledWith(undefined);
    expect(res).toMatchObject({ ok: true, proveedor: "todos", proveedores: ["air", "elit"] });
  });

  it("normaliza el nombre y dispara solo ese proveedor", async () => {
    const { service, trigger } = setup();
    const res = await service.actualizarProveedores("  AIR ");
    expect(trigger.triggerFetchPrices).toHaveBeenCalledWith("air");
    expect(res).toMatchObject({ proveedor: "air", proveedores: ["air"] });
  });

  it("rechaza un proveedor que no tiene descarga automática y lista los disponibles", async () => {
    const { service, trigger } = setup();
    await expect(service.actualizarProveedores("noexiste")).rejects.toThrow(BadRequestException);
    await expect(service.actualizarProveedores("noexiste")).rejects.toThrow(/air, elit/);
    expect(trigger.triggerFetchPrices).not.toHaveBeenCalled();
  });

  it("rechaza pedir 'todos' si no hay ningún proveedor disponible", async () => {
    const { service, trigger } = setup({ disponibles: [] });
    await expect(service.actualizarProveedores()).rejects.toThrow(/No hay proveedores activos/);
    expect(trigger.triggerFetchPrices).not.toHaveBeenCalled();
  });

  it("frena un segundo pedido dentro del tiempo de espera (429)", async () => {
    const { service, trigger } = setup();
    await service.actualizarProveedores();
    now += COOLDOWN_MS - 1000;
    const error = await service.actualizarProveedores().catch((e) => e);
    expect(error).toBeInstanceOf(HttpException);
    expect(error.getStatus()).toBe(429);
    expect(trigger.triggerFetchPrices).toHaveBeenCalledTimes(1);
  });

  it("permite otro pedido pasado el tiempo de espera", async () => {
    const { service, trigger } = setup();
    await service.actualizarProveedores();
    now += COOLDOWN_MS + 1;
    await service.actualizarProveedores();
    expect(trigger.triggerFetchPrices).toHaveBeenCalledTimes(2);
  });

  it("no empieza el tiempo de espera si el disparo falló", async () => {
    const { service, trigger } = setup();
    trigger.triggerFetchPrices.mockRejectedValueOnce(new Error("rabbit caído"));
    await expect(service.actualizarProveedores()).rejects.toThrow("rabbit caído");
    await expect(service.actualizarProveedores()).resolves.toMatchObject({ ok: true });
  });
});

describe("AgentService.estado", () => {
  let now = 1_700_000_000_000;
  beforeEach(() => {
    now = 1_700_000_000_000;
    jest.spyOn(Date, "now").mockImplementation(() => now);
  });
  afterEach(() => jest.restoreAllMocks());

  it("lista los proveedores disponibles como 'sin datos' y avisa si nunca se actualizó", async () => {
    const { service } = setup();
    const res = await service.estado();
    expect(res.ultimoDisparo).toBeNull();
    expect(res.proveedores.map((p) => [p.proveedor, p.estado])).toEqual([
      ["air", "sin_datos"],
      ["elit", "sin_datos"],
    ]);
    expect(res.aviso).toMatch(/Sin datos/);
  });

  it("resume éxitos, errores y proveedores sin datos", async () => {
    const t = new Date(now + 5000).toISOString();
    const { service } = setup({
      disponibles: ["air", "elit", "invid"],
      estados: [
        { proveedor: "air", state: "success", count: 120, updatedAt: t },
        { proveedor: "elit", state: "error", error: "timeout", updatedAt: t },
      ],
    });
    await service.actualizarProveedores();
    now += 10_000;
    const res = await service.estado();
    expect(res.resumen).toContain("air: ok (120 productos)");
    expect(res.resumen).toContain("elit: ERROR (timeout)");
    expect(res.resumen).toContain("invid: sin datos");
    expect(res.aviso).toBeNull();
  });

  it("incluye también proveedores con estado que ya no están en la lista automática", async () => {
    const t = new Date(now).toISOString();
    const { service } = setup({
      disponibles: ["air"],
      estados: [{ proveedor: "hdc", state: "success", count: 3, updatedAt: t }],
    });
    const res = await service.estado();
    expect(res.proveedores.map((p) => p.proveedor)).toEqual(["air", "hdc"]);
  });

  it("avisa si pasó mucho tiempo y ningún proveedor respondió", async () => {
    const viejo = new Date(now - 3_600_000).toISOString();
    const { service } = setup({
      estados: [{ proveedor: "air", state: "success", count: 5, updatedAt: viejo }],
    });
    await service.actualizarProveedores();
    now += SIN_RESPUESTA_MS + 1000;
    const res = await service.estado();
    expect(res.proveedores.find((p) => p.proveedor === "air")?.posteriorAlDisparo).toBe(false);
    expect(res.aviso).toMatch(/ningún proveedor reportó/);
  });

  it("no avisa todavía si el disparo es reciente", async () => {
    const { service } = setup();
    await service.actualizarProveedores();
    now += 60_000;
    expect((await service.estado()).aviso).toBeNull();
  });
});
