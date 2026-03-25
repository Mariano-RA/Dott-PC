import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { DolaresService } from "src/dolar/dolar.service";
import { Repository, SelectQueryBuilder } from "typeorm";
import { ProductoDto } from "./dto/productoDto";
import { Producto } from "./entities/producto.entity";
import { CuotasService } from "src/cuota/cuota.service";
import { ListDto } from "./dto/list.dto";
import {
  ClientProxy,
  ClientProxyFactory,
  Transport,
} from "@nestjs/microservices";
import { newTableDto } from "./dto/newTableDto";
import { ProveedorService } from "src/proveedor/proveedor.service";
import { CategoriesService } from "src/categories/categories.service";
import { EnvKeys } from "../shared/config";
import { Logger } from "nestjs-pino";
import { ImportStatusService } from "./import-status.service";
import { EventLogService } from "src/shared/event-log.service";
import {
  CATEGORIA_FALLBACK,
  obtenerPrecioEfectivo,
  calcularValorCuotas,
  getPrecioDolarOrDefault,
  sqlPrecioEfectivoSortExpr,
} from "./helpers/precio-cuota.helper";

@Injectable()
export class ProductosService {
  @Inject(DolaresService) private readonly dolaresService: DolaresService;
  @Inject(CuotasService) private readonly cuotasService: CuotasService;
  @Inject(ProveedorService) private readonly proveedorService: ProveedorService;
  @Inject(CategoriesService) private readonly categoriesService: CategoriesService;
  @Inject(ImportStatusService)
  private readonly importStatusService: ImportStatusService;
  @Inject(EventLogService)
  private readonly eventLogService: EventLogService;
  private client: ClientProxy;

  constructor(
    @InjectRepository(Producto)
    private readonly productoRepository: Repository<Producto>,
    private readonly configService: ConfigService,
    private readonly logger: Logger
  ) {
    const rabbitmqUrl = this.configService.get<string>(EnvKeys.RABBIT_MQ_URI);
    const pythonQueue = this.configService.get<string>(
      EnvKeys.RABBITMQ_PYTHON_QUEUE
    );
    this.client = ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: [rabbitmqUrl],
        queue: pythonQueue,
      },
    });
  }

  async sendMessageData(newMessageDto: {
    nombreProveedor: string;
    base64: string;
    fileName?: string;
    contentType?: string | null;
  }) {
    const prov = String(newMessageDto.nombreProveedor ?? "").trim().toLowerCase();
    if (prov) this.importStatusService.markQueued(prov);
    if (prov) {
      await this.eventLogService.info(
        "productos",
        "import_queued",
        `Importación encolada para proveedor "${prov}".`,
        { proveedor: prov, fileName: newMessageDto.fileName, contentType: newMessageDto.contentType }
      );
    }
    const msg = {
      nombreProveedor: newMessageDto.nombreProveedor,
      base64: newMessageDto.base64,
      fileName: newMessageDto.fileName ?? "",
      contentType: newMessageDto.contentType ?? "",
    };
    await this.client.emit("api_python", msg);
    this.logger.log("Se envió el mensaje de carga a la API de python.", {
      proveedor: newMessageDto.nombreProveedor,
    });
    return "Se envio el mensaje de carga!";
  }

  async updateTable(data: newTableDto) {
    const productDto = Array.isArray(data?.resultado)
      ? data.resultado
      : (data as any)?.data?.resultado;

    try {
      const provFromEnvelope =
        (data as any)?.proveedor_actualizado ??
        (data as any)?.data?.proveedor_actualizado ??
        "";
      const provNorm = String(provFromEnvelope ?? "").trim().toLowerCase();
      if (provNorm) this.importStatusService.markProcessing(provNorm);
      if (provNorm) {
        await this.eventLogService.info(
          "productos",
          "import_processing",
          `Importación en proceso para proveedor "${provNorm}".`,
          { proveedor: provNorm, pattern: "carga_tabla" }
        );
      }

      if (!Array.isArray(productDto) || productDto.length === 0) {
        const prov =
          (data as any)?.proveedor_actualizado ??
          (data as any)?.data?.proveedor_actualizado ??
          "?";
        this.logger.warn(
          { proveedor_actualizado: prov, pattern: "carga_tabla" },
          "No se recibieron productos para procesar"
        );
        if (provNorm) this.importStatusService.markEmpty(provNorm);
        if (provNorm) {
          await this.eventLogService.warn(
            "productos",
            "import_empty",
            `Importación finalizada sin productos para proveedor "${provNorm}".`,
            { proveedor: provNorm }
          );
        }
        return "No se recibieron productos para procesar";
      }

      const proveedorNombre = String(productDto[0]?.proveedor || "").trim();
      if (!proveedorNombre) {
        throw new Error("El payload no incluye proveedor");
      }

      const proveedor = await this.proveedorService.getOrCreate(proveedorNombre);

      await this.productoRepository
        .createQueryBuilder("Productos")
        .delete()
        .from(Producto)
        .where("proveedorId = :id", { id: proveedor.id })
        .execute();

      const providerCode = proveedorNombre.toLowerCase();
      const categoryDict = await this.categoriesService.getDictionaryFromDb();
      const providerMap = categoryDict[providerCode] ?? {};
      const unmappedByKey = new Map<string, string>();

      const normalizedProducts: Array<{
        proveedorId: number;
        producto: string;
        categoria: string;
        precio: number;
        codigo: string | null;
        imagenUrl: string | null;
      }> = [];

      for (const item of productDto) {
        const rawField = item.categoriaRaw ?? item.categoria ?? "";
        const rawTrim = String(rawField).trim();
        let resolved = providerMap[rawField] ?? providerMap[rawTrim];
        if (resolved === undefined) {
          resolved =
            (await this.categoriesService.getMasterCategoryName(
              providerCode,
              rawField
            )) ?? CATEGORIA_FALLBACK;
        }
        if (resolved === CATEGORIA_FALLBACK && rawTrim) {
          if (!unmappedByKey.has(rawTrim)) {
            unmappedByKey.set(rawTrim, String(item.producto ?? ""));
          }
        }
        normalizedProducts.push({
          proveedorId: proveedor.id,
          producto: item.producto,
          categoria: resolved,
          precio: item.precio,
          codigo: item.codigo != null ? String(item.codigo).trim() || null : null,
          imagenUrl: item.imagenUrl != null ? String(item.imagenUrl).trim() || null : null,
        });
      }

      for (const [rawKey, exampleProduct] of unmappedByKey) {
        await this.categoriesService.ensureUnmappedMapping(
          providerCode,
          rawKey,
          exampleProduct
        );
      }

      const arrProductos = this.productoRepository.create(normalizedProducts);
      await this.productoRepository.save(arrProductos);
      this.logger.log(
        { proveedor: proveedor.nombre, count: normalizedProducts.length },
        "Tabla de productos actualizada"
      );
      this.importStatusService.markSuccess(proveedor.nombre, normalizedProducts.length);
      await this.eventLogService.info(
        "productos",
        "import_success",
        `Importación OK para proveedor "${proveedor.nombre}" (${normalizedProducts.length} productos).`,
        { proveedor: proveedor.nombre, count: normalizedProducts.length }
      );
      return "OK";
    } catch (error: any) {
      this.logger.error(
        {
          err: error.message,
          proveedor:
            (data as any)?.proveedor_actualizado ??
            (data as any)?.data?.proveedor_actualizado,
        },
        "Error al actualizar la tabla"
      );
      const prov =
        (data as any)?.proveedor_actualizado ??
        (data as any)?.data?.proveedor_actualizado ??
        (Array.isArray(productDto) && productDto[0]?.proveedor) ??
        "";
      const provNorm = String(prov ?? "").trim().toLowerCase();
      if (provNorm) this.importStatusService.markError(provNorm, error?.message || String(error));
      if (provNorm) {
        await this.eventLogService.error(
          "productos",
          "import_error",
          `Importación fallida para proveedor "${provNorm}".`,
          { proveedor: provNorm, error: error?.message || String(error) }
        );
      }
      throw error;
    }
  }

  async deleteProductosByProveedor(dto: { proveedor: string }) {
    const nombreProveedor = dto.proveedor;
    try {
      const proveedorEntity =
        await this.proveedorService.findByNombre(nombreProveedor.trim());
      if (!proveedorEntity) {
        return `No existe el proveedor ${nombreProveedor}`;
      }

      const result = await this.productoRepository
        .createQueryBuilder("producto")
        .delete()
        .from(Producto)
        .where("proveedorId = :id", { id: proveedorEntity.id })
        .execute();

      if (result.affected && result.affected > 0) {
        return `Se eliminaron ${result.affected} productos del proveedor ${nombreProveedor}`;
      }
      return `No había productos del proveedor ${nombreProveedor}`;
    } catch (error: any) {
      this.logger.error(
        { err: error.message, proveedor: nombreProveedor },
        "Error al eliminar productos del proveedor"
      );
      throw error;
    }
  }

  private normField(s: unknown): string {
    return String(s ?? "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  }

  private normSql(alias: string, column: string): string {
    return `LOWER(TRIM(REGEXP_REPLACE(\`${alias}\`.\`${column}\`, '[[:space:]]+', ' ')))`;
  }

  private async resolveCategoryFilter(category?: string): Promise<
    | { mode: "none" }
    | { mode: "in"; values: string[] }
    | { mode: "fallback"; wantedNorm: string }
  > {
    if (!category?.trim()) return { mode: "none" };
    const norm = (v: unknown) => this.normField(v);
    const wanted = norm(category);
    const tree = await this.categoriesService.getMasterCategoriesTree();
    const parent = tree.find((c) => norm(c?.nombre) === wanted);
    const subs = (parent?.subcategorias ?? [])
      .map((s) => norm(s))
      .filter(Boolean);
    if (subs.length > 0) return { mode: "in", values: subs };
    return { mode: "fallback", wantedNorm: wanted };
  }

  private applyProductListFilters(
    qb: SelectQueryBuilder<Producto>,
    options: {
      proveedor?: string;
      keywords?: string;
      category?: string;
    },
    categoryFilter:
      | { mode: "none" }
      | { mode: "in"; values: string[] }
      | { mode: "fallback"; wantedNorm: string }
  ) {
    if (options.proveedor) {
      const p = this.normField(options.proveedor);
      qb.andWhere(`${this.normSql("prov", "nombre")} LIKE :provPat`, {
        provPat: `%${p}%`,
      });
    }
    if (options.keywords) {
      const words = options.keywords.split(" ").filter(Boolean);
      words.forEach((word, i) => {
        const w = this.normField(word);
        qb.andWhere(`${this.normSql("p", "producto")} LIKE :kw${i}`, {
          [`kw${i}`]: `%${w}%`,
        });
      });
    }
    if (categoryFilter.mode === "in") {
      qb.andWhere(`${this.normSql("p", "categoria")} IN (:...catNorms)`, {
        catNorms: categoryFilter.values,
      });
    } else if (categoryFilter.mode === "fallback") {
      qb.andWhere(
        `(${this.normSql("p", "categoria")} = :wanted OR ${this.normSql(
          "p",
          "categoria"
        )} LIKE :wantedLike)`,
        {
          wanted: categoryFilter.wantedNorm,
          wantedLike: `%${categoryFilter.wantedNorm}%`,
        }
      );
    }
  }

  private applyProductListOrderAndPagination(
    qb: SelectQueryBuilder<Producto>,
    orderBy: string,
    offset: number,
    take: number
  ) {
    const o = orderBy || "";
    if (o === "nombreAsc") {
      qb.orderBy("p.producto", "ASC").addOrderBy("p.id", "ASC");
    } else if (o === "nombreDesc") {
      qb.orderBy("p.producto", "DESC").addOrderBy("p.id", "DESC");
    } else if (o === "mayor") {
      // Select alias avoids TypeORM misparsing ROUND(...`p`.`precio`...) when using DISTINCT pagination with joins.
      qb.addSelect(sqlPrecioEfectivoSortExpr("p"), "precioSort");
      qb.orderBy("precioSort", "DESC").addOrderBy("p.id", "ASC");
    } else if (o === "menor") {
      qb.addSelect(sqlPrecioEfectivoSortExpr("p"), "precioSort");
      qb.orderBy("precioSort", "ASC").addOrderBy("p.id", "ASC");
    } else {
      qb.orderBy("p.id", "ASC");
    }
    qb.skip(offset).take(take);
  }

  private async buildProductList(options: {
    proveedor?: string;
    keywords?: string;
    category?: string;
    skip: number;
    take: number;
    orderBy: string;
  }): Promise<ListDto> {
    const safeTake =
      Number.isFinite(options.take) && options.take > 0 ? options.take : 20;
    const safeSkip =
      Number.isFinite(options.skip) && options.skip > 0 ? options.skip : 1;
    const offset = (safeSkip - 1) * safeTake;

    const [arrayDolar, listadoCuotas, categoryFilter] = await Promise.all([
      this.dolaresService.findAll(),
      this.cuotasService.findPlans(true),
      this.resolveCategoryFilter(options.category),
    ]);

    const qb = this.productoRepository
      .createQueryBuilder("p")
      .leftJoinAndSelect("p.proveedor", "prov");

    this.applyProductListFilters(qb, options, categoryFilter);

    const total = await qb.clone().getCount();

    this.applyProductListOrderAndPagination(
      qb,
      options.orderBy,
      offset,
      safeTake
    );
    const productos = await qb.getMany();

    const listadoProductos: ProductoDto[] = productos.map((prod) => {
      const dto = new ProductoDto();
      dto.id = prod.id;
      dto.proveedor = prod.proveedor?.nombre ?? "Desconocido";
      dto.producto = prod.producto;
      dto.categoria = prod.categoria;
      dto.codigo = (prod as any).codigo ?? undefined;
      const precioDolar = getPrecioDolarOrDefault(arrayDolar, prod.proveedorId);
      dto.precioEfectivo = obtenerPrecioEfectivo(
        prod.precio,
        precioDolar,
        prod.categoria
      );
      dto.precioCuotas = calcularValorCuotas(dto.precioEfectivo, listadoCuotas);
      return dto;
    });

    const listDto = new ListDto();
    listDto.cantResultados = total;
    listDto.productos = listadoProductos;
    if (total === 0) {
      const prov = String(options.proveedor ?? "").trim().toLowerCase();
      if (prov) {
        listDto.warnings = [
          {
            code: "PROVIDER_EMPTY",
            proveedor: prov,
            message: `No hay productos cargados para el proveedor "${prov}".`,
          },
        ];
      } else {
        listDto.warnings = [{ code: "NO_RESULTS", message: "No se encontraron resultados." }];
      }
    }
    return listDto;
  }

  async findAll(
    skip: number,
    take: number,
    orderBy: string,
    proveedor?: string
  ): Promise<ListDto> {
    try {
      return this.buildProductList({
        proveedor,
        skip,
        take,
        orderBy,
      });
    } catch (error: any) {
      this.logger.error(
        { err: error.message },
        "Error al obtener los productos"
      );
      throw error;
    }
  }

  async findAllCategories(): Promise<string[]> {
    try {
      const rows = await this.productoRepository
        .createQueryBuilder("p")
        .select("DISTINCT p.categoria", "categoria")
        .where("p.categoria IS NOT NULL AND TRIM(p.categoria) != ''")
        .orderBy("p.categoria", "ASC")
        .getRawMany<{ categoria: string | null }>();
      const categorias = rows
        .map((r) => r.categoria)
        .filter((c): c is string => typeof c === "string" && c.length > 0);
      this.logger.log("Se obtuvieron todas las categorías.");
      return categorias;
    } catch (error: any) {
      this.logger.error(
        { err: error.message },
        "Error al obtener las categorías"
      );
      throw error;
    }
  }

  async findByKeyWord(
    keywords: string,
    skip: number,
    take: number,
    orderBy: string,
    proveedor?: string
  ): Promise<ListDto> {
    try {
      const listDto = await this.buildProductList({
        proveedor,
        keywords,
        skip,
        take,
        orderBy,
      });
      this.logger.log("Listado de productos por palabras clave obtenido.");
      return listDto;
    } catch (error: any) {
      this.logger.error(
        { err: error.message },
        "Error al obtener el listado de productos"
      );
      throw error;
    }
  }

  async findByCategory(
    category: string,
    skip: number,
    take: number,
    orderBy: string,
    proveedor?: string
  ): Promise<ListDto> {
    try {
      const listDto = await this.buildProductList({
        proveedor,
        category,
        skip,
        take,
        orderBy,
      });
      this.logger.log(
        { category },
        "Listado de productos por categoría obtenido."
      );
      return listDto;
    } catch (error: any) {
      this.logger.error(
        { err: error.message, category },
        "Error al obtener el listado de productos de la categoría"
      );
      throw error;
    }
  }

  async findByKeyWordAndCategory(
    keywords: string[],
    category: string,
    skip: number,
    take: number,
    orderBy: string,
    proveedor?: string
  ): Promise<ListDto> {
    try {
      const keywordsStr = Array.isArray(keywords) ? keywords.join(" ") : "";
      const listDto = await this.buildProductList({
        proveedor,
        keywords: keywordsStr,
        category,
        skip,
        take,
        orderBy,
      });
      this.logger.log("Listado por categoría y palabras clave obtenido.");
      return listDto;
    } catch (error: any) {
      this.logger.error(
        { err: error.message },
        "Error al obtener el listado por categoría y palabras clave"
      );
      throw error;
    }
  }
}
