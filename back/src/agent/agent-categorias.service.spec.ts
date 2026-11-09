import { UnprocessableEntityException } from "@nestjs/common";
import { AgentCategoriasService, MAX_LISTADAS_POR_PROVEEDOR } from "./agent-categorias.service";

function setup(
  options: {
    nuevas?: Record<string, Array<{ categoriaRaw: string; examples: string[] }>>;
    planas?: string[];
    enDb?: string[];
  } = {},
) {
  const nuevas = options.nuevas ?? {
    air: [
      { categoriaRaw: "Placas de video", examples: ["RTX 4060 8GB"] },
      { categoriaRaw: "Cables varios", examples: [] },
    ],
    elit: [{ categoriaRaw: "MONITORES LED", examples: ["Monitor 24 pulgadas"] }],
  };
  const categories = {
    getNewGrouped: jest.fn(async () => nuevas),
    getMasterCategoriesFlat: jest.fn(async () => options.planas ?? ["Placas de video", "Monitores", "Cables y adaptadores"]),
    listMasterCategories: jest.fn(async () =>
      (options.enDb ?? ["Placas de video", "Monitores", "Cables y adaptadores", "Solo en base"]).map((name) => ({ name })),
    ),
    addMapping: jest.fn(async () => ({ updated: true })),
    discardNew: jest.fn(async () => ({ updated: true })),
  };
  const eventLog = { info: jest.fn(), warn: jest.fn() };
  const service = new AgentCategoriasService(categories as any, eventLog as any);
  return { service, categories, eventLog };
}

describe("AgentCategoriasService.nuevas / maestras", () => {
  it("lista las nuevas por proveedor con un ejemplo y un resumen", async () => {
    const { service } = setup();
    const res = await service.nuevas();
    expect(res.total).toBe(3);
    expect(res.proveedores[0]).toMatchObject({
      proveedor: "air",
      total: 2,
      categorias: [{ categoriaRaw: "Placas de video", ejemplo: "RTX 4060 8GB" }, { categoriaRaw: "Cables varios", ejemplo: null }],
    });
    expect(res.resumen).toBe("3 categorías nuevas: air 2, elit 1.");
  });

  it("recorta las listas muy largas e indica que fueron truncadas", async () => {
    const muchas = Array.from({ length: MAX_LISTADAS_POR_PROVEEDOR + 10 }, (_, i) => ({ categoriaRaw: `c${i}`, examples: [] }));
    const { service } = setup({ nuevas: { air: muchas } });
    const res = await service.nuevas();
    expect(res.proveedores[0].categorias).toHaveLength(MAX_LISTADAS_POR_PROVEEDOR);
    expect(res.proveedores[0]).toMatchObject({ total: MAX_LISTADAS_POR_PROVEEDOR + 10, truncado: true });
  });

  it("avisa si no hay nuevas", async () => {
    const { service } = setup({ nuevas: {} });
    expect((await service.nuevas()).resumen).toMatch(/No hay categorías nuevas/);
  });

  it("las maestras permitidas son las del panel que también existen en la base", async () => {
    const { service } = setup({ planas: ["Monitores", "Solo en el JSON"], enDb: ["Monitores", "Solo en base"] });
    const res = await service.maestras();
    expect(res.categorias).toEqual(["Monitores"]);
  });
});

describe("AgentCategoriasService.mapear", () => {
  it("asigna usando el nombre canónico de la base (sin importar mayúsculas ni acentos)", async () => {
    const { service, categories, eventLog } = setup();
    const res = await service.mapear([
      { proveedor: " AIR ", categoriaRaw: "Placas de video", categoriaMaestra: "placas de VIDEO" },
      { proveedor: "elit", categoriaRaw: "MONITORES LED", categoriaMaestra: "Monitores" },
    ]);
    expect(categories.addMapping).toHaveBeenCalledTimes(2);
    expect(categories.addMapping).toHaveBeenCalledWith({
      proveedor: "air",
      categoriaRaw: "Placas de video",
      categoriaNormalizada: "Placas de video",
    });
    expect(res).toMatchObject({ ok: true, mapeadas: 2 });
    expect(eventLog.info).toHaveBeenCalledWith("categorias", "agent_mapping", expect.any(String), expect.objectContaining({ usuario: "agente-hermes" }));
  });

  it("NO crea categorías maestras: una que no existe rechaza todo el pedido", async () => {
    const { service, categories } = setup();
    const error = await service
      .mapear([
        { proveedor: "air", categoriaRaw: "Placas de video", categoriaMaestra: "Placas de video" },
        { proveedor: "elit", categoriaRaw: "MONITORES LED", categoriaMaestra: "Inventada" },
      ])
      .catch((e) => e);
    expect(error).toBeInstanceOf(UnprocessableEntityException);
    expect(error.message).toMatch(/No se aplicó nada/);
    expect(error.message).toMatch(/"Inventada" no existe/);
    expect(categories.addMapping).not.toHaveBeenCalled();
  });

  it("no deja pisar una categoría que ya estaba mapeada (no figura entre las nuevas)", async () => {
    const { service, categories } = setup();
    await expect(
      service.mapear([{ proveedor: "air", categoriaRaw: "Ya mapeada", categoriaMaestra: "Monitores" }]),
    ).rejects.toThrow(/No está entre las categorías nuevas/);
    expect(categories.addMapping).not.toHaveBeenCalled();
  });

  it("no mezcla proveedores: una nueva de elit no se puede mapear como si fuera de air", async () => {
    const { service } = setup();
    await expect(
      service.mapear([{ proveedor: "air", categoriaRaw: "MONITORES LED", categoriaMaestra: "Monitores" }]),
    ).rejects.toThrow(UnprocessableEntityException);
  });

  it("rechaza ítems repetidos", async () => {
    const { service, categories } = setup();
    const item = { proveedor: "air", categoriaRaw: "Placas de video", categoriaMaestra: "Placas de video" };
    await expect(service.mapear([item, item])).rejects.toThrow(/repetida/);
    expect(categories.addMapping).not.toHaveBeenCalled();
  });

  it("con las maestras sin cargar en la base, no asigna nada", async () => {
    const { service, categories } = setup({ enDb: [] });
    await expect(
      service.mapear([{ proveedor: "air", categoriaRaw: "Placas de video", categoriaMaestra: "Placas de video" }]),
    ).rejects.toThrow(UnprocessableEntityException);
    expect(categories.addMapping).not.toHaveBeenCalled();
  });
});

describe("AgentCategoriasService.descartar", () => {
  it("descarta solo categorías que figuran como nuevas y deja registro", async () => {
    const { service, categories, eventLog } = setup();
    const res = await service.descartar([{ proveedor: "air", categoriaRaw: "Cables varios" }]);
    expect(categories.discardNew).toHaveBeenCalledWith("air", "Cables varios");
    expect(res).toMatchObject({ ok: true, descartadas: 1 });
    expect(eventLog.warn).toHaveBeenCalledWith("categorias", "agent_discard", expect.any(String), expect.anything());
  });

  it("todo o nada: si una no es nueva, no descarta ninguna", async () => {
    const { service, categories } = setup();
    await expect(
      service.descartar([
        { proveedor: "air", categoriaRaw: "Cables varios" },
        { proveedor: "air", categoriaRaw: "Inexistente" },
      ]),
    ).rejects.toThrow(/No se aplicó nada/);
    expect(categories.discardNew).not.toHaveBeenCalled();
  });
});
