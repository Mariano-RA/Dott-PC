import { ImageCacheService } from "./image-cache.service";

const HACE_30_DIAS = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

function setup() {
  const productos = [
    { id: 1, codigo: "SIN-CACHE", imagenUrl: "http://img.test/sin-cache.jpg" },
    { id: 2, codigo: "CON-CACHE-VIEJA", imagenUrl: "http://img.test/vieja.jpg" },
  ];
  const imagenes = [
    {
      proveedorId: 7,
      codigo: "CON-CACHE-VIEJA",
      sortOrder: 0,
      isPrimary: true,
      storageKey: "nb/CON-CACHE-VIEJA/0.webp",
      lastFetchedAt: HACE_30_DIAS,
    },
  ];
  const productoRepo = { find: jest.fn().mockResolvedValue(productos), save: jest.fn() };
  const proveedorRepo = { findOneBy: jest.fn().mockResolvedValue({ id: 7 }) };
  const productImageRepo = {
    find: jest.fn().mockResolvedValue(imagenes),
    create: jest.fn((x) => x),
    merge: jest.fn((a, b) => ({ ...a, ...b })),
    save: jest.fn().mockResolvedValue(undefined),
    remove: jest.fn(),
  };
  const productImageSourceRepo = { find: jest.fn().mockResolvedValue([]) };
  const storage = { putObject: jest.fn().mockResolvedValue(undefined), deleteObject: jest.fn() };
  const logger = { log: jest.fn(), warn: jest.fn(), error: jest.fn() };
  const service = new ImageCacheService(
    productoRepo as any,
    proveedorRepo as any,
    productImageRepo as any,
    productImageSourceRepo as any,
    storage as any,
    logger as any,
  );
  return { service, storage };
}

describe("ImageCacheService.cacheProveedorImages", () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: (name: string) => (name === "content-type" ? "image/jpeg" : null) },
      arrayBuffer: async () => new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4, 5, 6, 7, 8]).buffer,
    });
    (global as any).fetch = fetchMock;
  });

  it("onlyMissing: baja solo la que no tiene cache y no vuelve a bajar la que ya tiene, aunque sea vieja", async () => {
    const { service } = setup();
    const res = await service.cacheProveedorImages({ proveedor: "nb", processAll: true, onlyMissing: true });

    const urls = fetchMock.mock.calls.map((c) => c[0]);
    expect(urls).toEqual(["http://img.test/sin-cache.jpg"]);
    expect(res).toMatchObject({ processed: 2, cached: 1, skipped: 1, errors: 0 });
  });

  it("onlyMissing tiene prioridad sobre force", async () => {
    const { service } = setup();
    await service.cacheProveedorImages({ proveedor: "nb", processAll: true, onlyMissing: true, force: true });
    expect(fetchMock.mock.calls.map((c) => c[0])).toEqual(["http://img.test/sin-cache.jpg"]);
  });

  it("sin onlyMissing mantiene el comportamiento de antes: refresca la cache vencida (más de 7 días)", async () => {
    const { service } = setup();
    await service.cacheProveedorImages({ proveedor: "nb", processAll: true });
    expect(fetchMock.mock.calls.map((c) => c[0]).sort()).toEqual([
      "http://img.test/sin-cache.jpg",
      "http://img.test/vieja.jpg",
    ]);
  });
});
