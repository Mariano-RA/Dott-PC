import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Repository } from "typeorm";
import { AddMappingDto } from "./dto/add-mapping.dto";
import { CategoryProvider } from "./entities/category-provider.entity";
import { MasterCategory } from "./entities/master-category.entity";
import { ProviderCategoryMapping } from "./entities/provider-category-mapping.entity";
import {
  DictionaryFileService,
  Diccionarios,
  MaestroCategoriaItem,
  NewCategoryGroup,
  NuevosDiccionarios,
} from "./services/dictionary-file.service";

/** Detecta error MySQL de clave duplicada (race al insertar en paralelo). */
function isDuplicateKeyError(err: any): boolean {
  const msg = err?.message ?? "";
  const code = err?.code ?? err?.driverError?.errno;
  return msg.includes("Duplicate entry") || code === "ER_DUP_ENTRY" || code === 1062;
}

export type { NewCategoryGroup, NuevosDiccionarios, Diccionarios, MaestroCategoriaItem };

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(
    private readonly dictionaryFileService: DictionaryFileService,
    @InjectRepository(MasterCategory)
    private readonly masterCategoryRepo: Repository<MasterCategory>,
    @InjectRepository(CategoryProvider)
    private readonly categoryProviderRepo: Repository<CategoryProvider>,
    @InjectRepository(ProviderCategoryMapping)
    private readonly providerCategoryMappingRepo: Repository<ProviderCategoryMapping>,
  ) {}

  /** Categorías nuevas (sin mapear): solo desde DB. Ejemplos vacíos (ya no se usa JSON). */
  async getNewGrouped(): Promise<Record<string, NewCategoryGroup[]>> {
    return this.getNewGroupedFromDb();
  }

  async getNewRaw(): Promise<NuevosDiccionarios> {
    return this.getNewRawFromDb();
  }

  /** Diccionario unificado: mismo formato pero desde DB (mapeos con categoría maestra). */
  async getDictionary(): Promise<Diccionarios> {
    return this.getDictionaryFromDb();
  }

  /** Construye { [proveedor]: { [categoriaRaw]: categoriaNormalizada } } desde la DB. */
  async getDictionaryFromDb(): Promise<Diccionarios> {
    const mappings = await this.providerCategoryMappingRepo.find({
      relations: ["provider", "masterCategory"],
      order: { providerCategoryKey: "ASC" },
    });
    const result: Diccionarios = {};
    for (const m of mappings) {
      const code = m.provider?.code ?? "?";
      const name = m.masterCategory?.name?.trim();
      if (!code || code === "?" || !name) continue;
      if (!result[code]) result[code] = {};
      result[code][m.providerCategoryKey] = name;
    }
    return result;
  }

  /** Agrega mapeo en DB (proveedor + categoriaRaw → categoriaNormalizada). */
  async addMapping(dto: AddMappingDto): Promise<{ updated: boolean }> {
    const proveedor = dto.proveedor.trim().toLowerCase();
    const catRaw = dto.categoriaRaw.trim();
    const catNorm = dto.categoriaNormalizada.trim();
    if (!proveedor || !catNorm) return { updated: false };
    await this.upsertSqlMapping(proveedor, catRaw, catNorm);
    return { updated: true };
  }

  async addMappingsBulk(dtos: AddMappingDto[]): Promise<{ updated: number }> {
    let updated = 0;
    for (const dto of dtos) {
      const proveedor = dto.proveedor?.trim().toLowerCase();
      const catNorm = dto.categoriaNormalizada?.trim();
      if (!proveedor || !catNorm) continue;
      await this.upsertSqlMapping(proveedor, dto.categoriaRaw.trim(), catNorm);
      updated++;
    }
    return { updated };
  }

  /** Descarta varias "nuevas" en lote. */
  async discardNewBulk(
    items: Array<{ proveedor: string; categoriaRaw: string }>,
  ): Promise<{ deleted: number }> {
    let deleted = 0;
    for (const { proveedor, categoriaRaw } of items) {
      const result = await this.discardNew(proveedor, categoriaRaw);
      if (result.updated) deleted++;
    }
    return { deleted };
  }

  /** Descarta "nueva": borra el mapeo sin categoría maestra en DB. */
  async discardNew(
    proveedor: string,
    categoriaRaw: string,
  ): Promise<{ updated: boolean }> {
    const code = proveedor.trim().toLowerCase();
    const key = categoriaRaw.trim();
    if (!code || !key) return { updated: false };
    const provider = await this.categoryProviderRepo.findOne({
      where: { code },
    });
    if (!provider) return { updated: false };
    const result = await this.providerCategoryMappingRepo
      .createQueryBuilder()
      .delete()
      .where("provider_id = :providerId", { providerId: provider.id })
      .andWhere("providerCategoryKey = :key", { key })
      .andWhere("master_category_id IS NULL")
      .execute();
    return { updated: (result.affected ?? 0) > 0 };
  }

  /** Registra una categoría raw del proveedor como "vista pero no mapeada" y guarda un producto de ejemplo. */
  async ensureUnmappedMapping(
    providerCode: string,
    providerCategoryKey: string,
    exampleProductName?: string,
  ): Promise<void> {
    const code = (providerCode || "").trim().toLowerCase();
    const key = (providerCategoryKey || "").trim();
    if (!code || !key) return;
    const provider = await this.ensureProvider(code);
    const example = (exampleProductName || "").trim().slice(0, 500) || null;
    const existing = await this.providerCategoryMappingRepo.findOne({
      where: {
        provider: { id: provider.id },
        providerCategoryKey: key,
      },
    });
    if (existing) {
      if (example != null && existing.exampleProduct !== example) {
        existing.exampleProduct = example;
        await this.providerCategoryMappingRepo.save(existing);
      }
      return;
    }
    const mapping = this.providerCategoryMappingRepo.create({
      provider,
      providerCategoryKey: key,
      masterCategory: null,
      exampleProduct: example,
    });
    try {
      await this.providerCategoryMappingRepo.save(mapping);
    } catch (err: any) {
      if (isDuplicateKeyError(err)) return;
      throw err;
    }
  }

  /** Lista categorías no mapeadas desde DB, agrupadas por proveedor, con producto de ejemplo. */
  async getNewGroupedFromDb(): Promise<Record<string, NewCategoryGroup[]>> {
    const unmapped = await this.providerCategoryMappingRepo.find({
      where: { masterCategory: IsNull() },
      relations: ["provider"],
      order: { providerCategoryKey: "ASC" },
    });
    const byProvider: Record<string, NewCategoryGroup[]> = {};
    for (const m of unmapped) {
      const code = m.provider?.code ?? "?";
      if (!byProvider[code]) byProvider[code] = [];
      const examples = m.exampleProduct ? [m.exampleProduct] : [];
      byProvider[code].push({
        categoriaRaw: m.providerCategoryKey,
        examples,
      });
    }
    return byProvider;
  }

  async getNewRawFromDb(): Promise<NuevosDiccionarios> {
    const unmapped = await this.providerCategoryMappingRepo.find({
      where: { masterCategory: IsNull() },
      relations: ["provider"],
    });
    const result: NuevosDiccionarios = {};
    for (const m of unmapped) {
      const code = m.provider?.code ?? "?";
      if (!result[code]) result[code] = [];
      result[code].push(m.providerCategoryKey);
    }
    return result;
  }

  async listMasterCategories(): Promise<MasterCategory[]> {
    return this.masterCategoryRepo.find({
      order: { name: "ASC" },
    });
  }

  /** Árbol desde DB (padres + subcategorías). */
  async getMasterCategoriesTree(): Promise<MaestroCategoriaItem[]> {
    const { categorias_maestras } = await this.dictionaryFileService.getMaestroCategorias();
    return (categorias_maestras ?? [])
      .filter((c) => c && typeof c.nombre === "string" && c.nombre.trim())
      .map((c) => ({
        id: String(c.id ?? ""),
        nombre: String(c.nombre).trim(),
        subcategorias: Array.isArray(c.subcategorias)
          ? c.subcategorias.map((s) => String(s).trim()).filter(Boolean)
          : [],
      }));
  }

  /**
   * Lista plana para dropdown/admin:
   * - subcategorías (tienen parent)
   * - categorías "hoja" (no tienen hijos), incluso si son nivel raíz
   */
  async getMasterCategoriesFlat(): Promise<string[]> {
    const { categorias_maestras } = await this.dictionaryFileService.getMaestroCategorias();
    const set = new Set<string>();
    for (const cat of categorias_maestras ?? []) {
      const subs = Array.isArray(cat?.subcategorias) ? cat.subcategorias : [];
      for (const s of subs) {
        const name = String(s ?? "").trim();
        if (name) set.add(name);
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }

  async ensureProvider(code: string): Promise<CategoryProvider> {
    const normalized = code.trim().toLowerCase();
    if (!normalized) {
      throw new Error("provider code vacío");
    }
    const existing = await this.categoryProviderRepo.findOne({
      where: { code: normalized },
    });
    if (existing) return existing;
    const created = this.categoryProviderRepo.create({
      code: normalized,
      name: normalized.toUpperCase(),
    });
    try {
      return await this.categoryProviderRepo.save(created);
    } catch (err: any) {
      if (isDuplicateKeyError(err)) {
        const found = await this.categoryProviderRepo.findOne({
          where: { code: normalized },
        });
        if (found) return found;
      }
      throw err;
    }
  }

  async ensureMasterCategoryByName(name: string): Promise<MasterCategory> {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new Error("master category name vacío");
    }
    const existing = await this.masterCategoryRepo.findOne({
      where: { name: trimmed },
    });
    if (existing) return existing;
    const slug = trimmed.toLowerCase().replace(/\\s+/g, "_");
    const created = this.masterCategoryRepo.create({
      name: trimmed,
      slug,
      parent: null,
    });
    return this.masterCategoryRepo.save(created);
  }

  private async ensureMasterCategoryByNameWithParent(
    name: string,
    parent: MasterCategory | null,
  ): Promise<MasterCategory> {
    const trimmed = name.trim();
    if (!trimmed) throw new Error("master category name vacío");

    const existing = await this.masterCategoryRepo.findOne({
      where: { name: trimmed },
      relations: ["parent"],
    });
    if (existing) {
      if (parent && !existing.parent) {
        existing.parent = parent;
        return this.masterCategoryRepo.save(existing);
      }
      return existing;
    }

    const slug = trimmed.toLowerCase().replace(/\\s+/g, "_");
    const created = this.masterCategoryRepo.create({
      name: trimmed,
      slug,
      parent,
    });
    return this.masterCategoryRepo.save(created);
  }

  async listSqlMappingsByProvider(code: string): Promise<ProviderCategoryMapping[]> {
    const provider = await this.categoryProviderRepo.findOne({
      where: { code: code.trim().toLowerCase() },
    });
    if (!provider) return [];
    return this.providerCategoryMappingRepo.find({
      where: { provider: { id: provider.id } },
      relations: ["provider", "masterCategory"],
      order: { providerCategoryKey: "ASC" },
    });
  }

  async getMasterCategoryName(
    providerCode: string,
    providerCategoryKey: string,
  ): Promise<string | null> {
    const code = (providerCode || "").trim().toLowerCase();
    const key = (providerCategoryKey || "").trim();
    if (!code || !key) return null;

    const provider = await this.categoryProviderRepo.findOne({
      where: { code },
    });
    if (!provider) return null;

    const mapping = await this.providerCategoryMappingRepo.findOne({
      where: {
        provider: { id: provider.id },
        providerCategoryKey: key,
      },
      relations: ["masterCategory"],
    });
    if (!mapping?.masterCategory) return null;
    return mapping.masterCategory.name;
  }

  async upsertSqlMapping(
    providerCode: string,
    providerCategoryKey: string,
    masterCategoryName: string,
  ): Promise<ProviderCategoryMapping> {
    const provider = await this.ensureProvider(providerCode);
    const master = await this.ensureMasterCategoryByName(masterCategoryName);

    let mapping = await this.providerCategoryMappingRepo.findOne({
      where: {
        provider: { id: provider.id },
        providerCategoryKey,
      },
      relations: ["provider", "masterCategory"],
    });

    if (!mapping) {
      mapping = this.providerCategoryMappingRepo.create({
        provider,
        providerCategoryKey,
        masterCategory: master,
      });
    } else {
      mapping.masterCategory = master;
    }

    return this.providerCategoryMappingRepo.save(mapping);
  }

  async getSqlImportStatus(): Promise<{
    dictionaryPath: string;
    dictionaryFileExists: boolean;
    providersCount: number;
    masterCategoriesCount: number;
    mappingsCount: number;
    unmappedCount: number;
    sourceOfTruth: string;
  }> {
    const [
      dictionaryFileExists,
      providersCount,
      masterCategoriesCount,
      mappingsCount,
      unmappedCount,
    ] = await Promise.all([
      this.dictionaryFileService.dictionaryFileExists(),
      this.categoryProviderRepo.count(),
      this.masterCategoryRepo.count(),
      this.providerCategoryMappingRepo.count(),
      this.providerCategoryMappingRepo
        .createQueryBuilder("m")
        .where("m.master_category_id IS NULL")
        .getCount(),
    ]);
    return {
      dictionaryPath: this.dictionaryFileService.getDictionaryPath(),
      dictionaryFileExists,
      providersCount,
      masterCategoriesCount,
      mappingsCount,
      unmappedCount,
      sourceOfTruth: "db",
    };
  }

  async importFromDictionaryJson(skipProviderCode?: string): Promise<{
    providers: number;
    categories: number;
    mappings: number;
  }> {
    const dict = await this.dictionaryFileService.getDictionary();

    const hasEntries = Object.keys(dict).some((k) => {
      const v = dict[k];
      return v && typeof v === "object" && Object.keys(v).length > 0;
    });
    if (!hasEntries) {
      const exists = await this.dictionaryFileService.dictionaryFileExists();
      const dictionaryPath = this.dictionaryFileService.getDictionaryPath();
      throw new BadRequestException(
        exists
          ? `diccionarios.json está vacío o no tiene el formato esperado en ${dictionaryPath}`
          : `No se encontró diccionarios.json en ${dictionaryPath}. Montá la carpeta python-api/data/categories en CATEGORIES_DATA_PATH o copiá el archivo.`,
      );
    }

    const skip = (skipProviderCode || "").toLowerCase().trim();
    let providers = 0;
    const categoryNames = new Set<string>();
    let mappings = 0;

    for (const [providerCode, mapping] of Object.entries(dict)) {
      if (skip && providerCode.toLowerCase() === skip) continue;
      if (!mapping || typeof mapping !== "object") continue;

      await this.ensureProvider(providerCode);
      providers++;

      for (const [providerCategoryKey, masterCategoryName] of Object.entries(mapping)) {
        if (typeof masterCategoryName !== "string" || !masterCategoryName.trim()) continue;
        const name = masterCategoryName.trim();
        categoryNames.add(name);
        await this.ensureMasterCategoryByName(name);
        await this.upsertSqlMapping(providerCode, providerCategoryKey, name);
        mappings++;
      }
    }

    this.logger.log(
      `Import from JSON: ${providers} providers, ${categoryNames.size} categories, ${mappings} mappings.`,
    );
    return { providers, categories: categoryNames.size, mappings };
  }

  /**
   * Importa maestro_categorias.json a la tabla master_categories (padre + subcategorías).
   * Es idempotente: si ya existen por name, no duplica.
   */
  async importMasterFromMaestroJson(): Promise<{
    parents: number;
    children: number;
    total: number;
  }> {
    const { categorias_maestras } = await this.dictionaryFileService.getMaestroCategorias();

    let parents = 0;
    let children = 0;

    for (const item of categorias_maestras ?? []) {
      const parentName = (item?.nombre || "").trim();
      if (!parentName) continue;

      const parent = await this.ensureMasterCategoryByNameWithParent(parentName, null);
      parents++;

      const subs = Array.isArray(item.subcategorias) ? item.subcategorias : [];
      for (const sub of subs) {
        const childName = (sub || "").trim();
        if (!childName) continue;
        await this.ensureMasterCategoryByNameWithParent(childName, parent);
        children++;
      }
    }

    this.logger.log(`Import master from JSON: ${parents} parents, ${children} children.`);
    return { parents, children, total: parents + children };
  }

  /** Bootstrap: maestro + diccionarios (mapeos) para primera ejecución. */
  async bootstrapFromJson(skipProviderCode?: string): Promise<{
    master: { parents: number; children: number; total: number };
    mappings: { providers: number; categories: number; mappings: number };
  }> {
    const master = await this.importMasterFromMaestroJson();
    const mappings = await this.importFromDictionaryJson(skipProviderCode);
    return { master, mappings };
  }
}
