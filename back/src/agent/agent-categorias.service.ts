import { Injectable, UnprocessableEntityException } from "@nestjs/common";
import { CategoriesService } from "../categories/categories.service";
import { EventLogService } from "../shared/event-log.service";
import { normalizeText } from "./agent-text";
import { DescartarItemDto, MapearItemDto } from "./dto/categorias.dto";

/** Tope de "nuevas" que se devuelven por proveedor, para no desbordar al modelo. */
export const MAX_LISTADAS_POR_PROVEEDOR = 60;

type ErrorItem = { proveedor: string; categoriaRaw: string; error: string };

@Injectable()
export class AgentCategoriasService {
  constructor(
    private readonly categories: CategoriesService,
    private readonly eventLog: EventLogService,
  ) {}

  /** Categorías vistas en las cargas que todavía no tienen categoría maestra. */
  async nuevas() {
    const agrupadas = await this.categories.getNewGrouped();
    const proveedores = Object.entries(agrupadas)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([proveedor, lista]) => ({
        proveedor,
        total: lista.length,
        truncado: lista.length > MAX_LISTADAS_POR_PROVEEDOR,
        categorias: lista.slice(0, MAX_LISTADAS_POR_PROVEEDOR).map((c) => ({
          categoriaRaw: c.categoriaRaw,
          ejemplo: c.examples?.[0] ?? null,
        })),
      }));
    const total = proveedores.reduce((n, p) => n + p.total, 0);
    return {
      total,
      proveedores,
      resumen: total
        ? `${total} categorías nuevas: ` + proveedores.map((p) => `${p.proveedor} ${p.total}`).join(", ") + "."
        : "No hay categorías nuevas pendientes.",
    };
  }

  async maestras() {
    const categorias = (await this.maestrasPermitidas()).map((m) => m.nombre);
    return {
      total: categorias.length,
      categorias,
      resumen: categorias.length
        ? `${categorias.length} categorías maestras disponibles.`
        : "No hay categorías maestras cargadas.",
    };
  }

  /**
   * Asigna categorías maestras EXISTENTES a categorías nuevas. Todo o nada: si un ítem
   * es inválido no se aplica ninguno. Nunca crea categorías maestras.
   */
  async mapear(items: MapearItemDto[]) {
    const nuevas = await this.indiceNuevas();
    const maestras = await this.maestrasPermitidas();
    const porNorm = new Map(maestras.map((m) => [m.norm, m.nombre]));

    const errores: ErrorItem[] = [];
    const plan: Array<{ proveedor: string; categoriaRaw: string; categoriaNormalizada: string }> = [];
    const vistos = new Set<string>();

    for (const item of items) {
      const proveedor = item.proveedor.trim().toLowerCase();
      const categoriaRaw = item.categoriaRaw.trim();
      const base = { proveedor, categoriaRaw };
      const clave = `${proveedor}\u0000${categoriaRaw}`;
      if (vistos.has(clave)) {
        errores.push({ ...base, error: "Está repetida en el pedido." });
        continue;
      }
      vistos.add(clave);
      if (!nuevas.get(proveedor)?.has(categoriaRaw)) {
        errores.push({ ...base, error: "No está entre las categorías nuevas (¿ya estaba mapeada o está mal escrita?)." });
        continue;
      }
      const canonica = porNorm.get(normalizeText(item.categoriaMaestra));
      if (!canonica) {
        errores.push({ ...base, error: `La categoría maestra "${item.categoriaMaestra}" no existe. Usá una de /agent/categorias/maestras.` });
        continue;
      }
      plan.push({ ...base, categoriaNormalizada: canonica });
    }
    this.fallarSiHayErrores(errores);

    for (const p of plan) await this.categories.addMapping(p);
    await this.eventLog.info("categorias", "agent_mapping", `El agente asignó ${plan.length} categorías nuevas.`, {
      usuario: "agente-hermes",
      items: plan,
    });
    return {
      ok: true,
      mapeadas: plan.length,
      resumen: `Se asignaron ${plan.length} categorías: ` + plan.map((p) => `${p.proveedor}/${p.categoriaRaw} → ${p.categoriaNormalizada}`).join("; ") + ".",
    };
  }

  /** Descarta categorías nuevas (borra solo las que siguen sin mapear). Todo o nada. */
  async descartar(items: DescartarItemDto[]) {
    const nuevas = await this.indiceNuevas();
    const errores: ErrorItem[] = [];
    const plan: Array<{ proveedor: string; categoriaRaw: string }> = [];
    const vistos = new Set<string>();

    for (const item of items) {
      const proveedor = item.proveedor.trim().toLowerCase();
      const categoriaRaw = item.categoriaRaw.trim();
      const base = { proveedor, categoriaRaw };
      const clave = `${proveedor}\u0000${categoriaRaw}`;
      if (vistos.has(clave)) {
        errores.push({ ...base, error: "Está repetida en el pedido." });
        continue;
      }
      vistos.add(clave);
      if (!nuevas.get(proveedor)?.has(categoriaRaw)) {
        errores.push({ ...base, error: "No está entre las categorías nuevas." });
        continue;
      }
      plan.push(base);
    }
    this.fallarSiHayErrores(errores);

    let descartadas = 0;
    for (const p of plan) {
      const res = await this.categories.discardNew(p.proveedor, p.categoriaRaw);
      if (res.updated) descartadas++;
    }
    await this.eventLog.warn("categorias", "agent_discard", `El agente descartó ${descartadas} categorías nuevas.`, {
      usuario: "agente-hermes",
      items: plan,
    });
    return { ok: true, descartadas, resumen: `Se descartaron ${descartadas} categorías nuevas.` };
  }

  /** proveedor -> conjunto de categoriaRaw que siguen sin mapear. */
  private async indiceNuevas(): Promise<Map<string, Set<string>>> {
    const agrupadas = await this.categories.getNewGrouped();
    const indice = new Map<string, Set<string>>();
    for (const [proveedor, lista] of Object.entries(agrupadas)) {
      indice.set(proveedor.toLowerCase(), new Set(lista.map((c) => c.categoriaRaw.trim())));
    }
    return indice;
  }

  /**
   * Categorías maestras a las que el agente puede asignar: las del desplegable del panel
   * (archivo maestro) QUE ADEMÁS existen en la base. Si no existieran en la base,
   * upsertSqlMapping crearía una categoría maestra nueva, y eso el agente no lo puede hacer.
   */
  private async maestrasPermitidas(): Promise<Array<{ nombre: string; norm: string }>> {
    const [planas, enDb] = await Promise.all([
      this.categories.getMasterCategoriesFlat(),
      this.categories.listMasterCategories(),
    ]);
    const dbPorNorm = new Map(enDb.map((m) => [normalizeText(m.name), m.name]));
    const resultado = new Map<string, string>();
    for (const nombre of planas) {
      const norm = normalizeText(nombre);
      const real = dbPorNorm.get(norm);
      if (real) resultado.set(norm, real);
    }
    return Array.from(resultado, ([norm, nombre]) => ({ nombre, norm })).sort((a, b) =>
      a.nombre.localeCompare(b.nombre),
    );
  }

  private fallarSiHayErrores(errores: ErrorItem[]) {
    if (errores.length === 0) return;
    const detalle = errores.map((e) => `[${e.proveedor}/${e.categoriaRaw}] ${e.error}`).join(" ");
    throw new UnprocessableEntityException({
      statusCode: 422,
      message: `No se aplicó nada. ${detalle}`,
      error: "Unprocessable Entity",
      errores,
    });
  }
}
