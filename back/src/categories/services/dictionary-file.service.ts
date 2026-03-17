import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as fs from "fs/promises";
import * as path from "path";

/**
 * Formato del archivo unificado para carga inicial en DB.
 * { [proveedor]: { [categoriaRaw]: categoriaNormalizada } }
 * Solo se usa en POST /categories/sql/import para poblar la base la primera vez.
 */
export type Diccionarios = Record<string, Record<string, string>>;

/** Entrada agrupada para la UI: misma categoría raw con ejemplos (desde DB, examples puede estar vacío). */
export interface NewCategoryGroup {
  categoriaRaw: string;
  examples: string[];
}

/** Formato legacy; getNewRaw() desde DB devuelve este shape. */
export type NuevosDiccionarios = Record<string, string[]>;

/** Ítem del árbol de categorías (maestro_categorias.json). */
export interface MaestroCategoriaItem {
  id: string;
  nombre: string;
  subcategorias: string[];
}

export interface MaestroCategoriasJson {
  categorias_maestras: MaestroCategoriaItem[];
}

@Injectable()
export class DictionaryFileService {
  private readonly logger = new Logger(DictionaryFileService.name);
  private readonly dataDir: string;

  constructor(private readonly config: ConfigService) {
    const envPath = this.config.get<string>("CATEGORIES_DATA_PATH");
    this.dataDir = envPath || path.join(process.cwd(), "data", "categories");
  }

  private get pathDictionary(): string {
    return path.join(this.dataDir, "diccionarios.json");
  }

  private get pathMaestro(): string {
    return path.join(this.dataDir, "maestro_categorias.json");
  }

  private async readJson<T>(filePath: string, fallback: T): Promise<T> {
    try {
      const raw = await fs.readFile(filePath, "utf-8");
      return JSON.parse(raw) as T;
    } catch (err: any) {
      if (err?.code === "ENOENT") return fallback;
      this.logger.warn(`Error leyendo ${filePath}: ${err?.message}`);
      return fallback;
    }
  }

  /** Lee diccionarios.json solo para la importación inicial (POST /categories/sql/import). */
  async getDictionary(): Promise<Diccionarios> {
    return this.readJson<Diccionarios>(this.pathDictionary, {});
  }

  getDictionaryPath(): string {
    return this.pathDictionary;
  }

  async dictionaryFileExists(): Promise<boolean> {
    try {
      await fs.access(this.pathDictionary);
      return true;
    } catch {
      return false;
    }
  }

  /** Lee maestro_categorias.json (árbol padre + subcategorías). */
  async getMaestroCategorias(): Promise<MaestroCategoriasJson> {
    return this.readJson<MaestroCategoriasJson>(this.pathMaestro, {
      categorias_maestras: [],
    });
  }
}
