import { BadRequestException, ConflictException } from "@nestjs/common";
import { AgentImagenesService, CONCURRENCIA_IMAGENES } from "./agent-imagenes.service";

type Resultado = { processed: number; cached: number; skipped: number; errors: number; durationMs: number };
const OK: Resultado = { processed: 10, cached: 3, skipped: 7, errors: 0, durationMs: 2000 };

function setup(options: { disponibles?: string[]; cache?: jest.Mock } = {}) {
  const disponibles = options.disponibles ?? ["air", "elit"];
  const imageCache = { cacheProveedorImages: options.cache ?? jest.fn().mockResolvedValue(OK) };
  const proveedorService = { findNombresCacheImagenes: jest.fn(async () => disponibles) };
  const service = new AgentImagenesService(imageCache as any, proveedorService as any);
  return { service, imageCache };
}

/** Deja correr las promesas pendientes (el trabajo corre en segundo plano). */
const flush = () => new Promise((resolve) => setImmediate(resolve));

describe("AgentImagenesService", () => {
  it("cachea todos los proveedores, de a uno, solo lo que falta y con la concurrencia fija", async () => {
    const { service, imageCache } = setup();
    const res = await service.iniciar();
    await flush();

    expect(res).toMatchObject({ ok: true, proveedores: ["air", "elit"], concurrencia: CONCURRENCIA_IMAGENES });
    expect(imageCache.cacheProveedorImages.mock.calls.map((c: any[]) => c[0])).toEqual([
      { proveedor: "air", processAll: true, onlyMissing: true, concurrency: 5 },
      { proveedor: "elit", processAll: true, onlyMissing: true, concurrency: 5 },
    ]);
    expect(CONCURRENCIA_IMAGENES).toBe(5);
  });

  it("nunca corre dos proveedores a la vez", async () => {
    let simultaneos = 0;
    let maximo = 0;
    const cache = jest.fn(async () => {
      simultaneos++;
      maximo = Math.max(maximo, simultaneos);
      await flush();
      simultaneos--;
      return OK;
    });
    const { service } = setup({ cache });
    await service.iniciar();
    await flush();
    await flush();
    await flush();
    expect(cache).toHaveBeenCalledTimes(2);
    expect(maximo).toBe(1);
  });

  it("normaliza el nombre y cachea solo ese proveedor", async () => {
    const { service, imageCache } = setup();
    const res = await service.iniciar("  ELIT ");
    await flush();
    expect(res.proveedores).toEqual(["elit"]);
    expect(imageCache.cacheProveedorImages).toHaveBeenCalledTimes(1);
  });

  it("rechaza un proveedor sin cache de imágenes y lista los disponibles", async () => {
    const { service, imageCache } = setup();
    await expect(service.iniciar("noexiste")).rejects.toThrow(BadRequestException);
    await expect(service.iniciar("noexiste")).rejects.toThrow(/air, elit/);
    expect(imageCache.cacheProveedorImages).not.toHaveBeenCalled();
  });

  it("rechaza pedir 'todos' si no hay ninguno disponible", async () => {
    const { service } = setup({ disponibles: [] });
    await expect(service.iniciar()).rejects.toThrow(/No hay proveedores activos/);
  });

  it("no deja arrancar un segundo trabajo mientras hay uno en curso (409)", async () => {
    let liberar!: () => void;
    const cache = jest.fn(() => new Promise<Resultado>((resolve) => (liberar = () => resolve(OK))));
    const { service } = setup({ cache });
    await service.iniciar();
    await expect(service.iniciar()).rejects.toThrow(ConflictException);
    expect(service.estado().enCurso).toBe(true);
    expect(service.estado().proveedorActual).toBe("air");
    expect(service.estado().pendientes).toEqual(["elit"]);

    liberar();
    await flush();
    liberar();
    await flush();
    expect(service.estado().enCurso).toBe(false);
    await expect(service.iniciar()).resolves.toMatchObject({ ok: true });
  });

  it("dos pedidos simultáneos: arranca uno solo", async () => {
    const { service, imageCache } = setup();
    const resultados = await Promise.allSettled([service.iniciar(), service.iniciar()]);
    await flush();
    expect(resultados.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(resultados.filter((r) => r.status === "rejected")).toHaveLength(1);
    expect(imageCache.cacheProveedorImages).toHaveBeenCalledTimes(2); // air + elit, una sola vez
  });

  it("si un proveedor falla, lo informa y sigue con los demás", async () => {
    const cache = jest.fn().mockRejectedValueOnce(new Error("MinIO caído")).mockResolvedValueOnce(OK);
    const { service } = setup({ cache });
    await service.iniciar();
    await flush();
    await flush();

    const estado = service.estado();
    expect(estado.enCurso).toBe(false);
    expect(estado.resultados).toHaveLength(2);
    expect(estado.resultados[0]).toMatchObject({ proveedor: "air", error: expect.any(String) });
    expect(estado.resultados[1]).toMatchObject({ proveedor: "elit", cacheadas: 3, error: null });
    expect(estado.resumen).toMatch(/air: ERROR/);
    // El mensaje de error crudo (puede traer rutas o datos internos) no llega al agente.
    expect(JSON.stringify(estado)).not.toMatch(/MinIO/);
  });

  it("el estado inicial avisa que todavía no hubo cacheos", () => {
    const { service } = setup();
    expect(service.estado()).toMatchObject({ enCurso: false, resumen: "Sin cacheos todavía." });
    expect(service.estado().aviso).toMatch(/Sin datos/);
  });

  it("el resumen final cuenta cacheadas, las que ya tenían y los errores", async () => {
    const { service } = setup({ disponibles: ["elit"] });
    await service.iniciar();
    await flush();
    expect(service.estado().resumen).toBe("elit: 3 cacheadas, 7 ya tenían, 0 con error (2s)");
  });
});
