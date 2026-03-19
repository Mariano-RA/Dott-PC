import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { DolaresService } from "src/dolar/dolar.service";
import { Repository } from "typeorm";
import { ProductoDto } from "./dto/productoDto";
import { Producto } from "./entities/producto.entity";
import { CuotasService } from "src/cuota/cuota.service";
import { createProductoDto } from "../shared/createProductoDto";
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
import {
  CATEGORIA_FALLBACK,
  obtenerPrecioEfectivo,
  calcularValorCuotas,
  pagination,
  handleOrder,
  getPrecioDolarOrDefault,
} from "./helpers/precio-cuota.helper";

@Injectable()
export class ProductosService {
  @Inject(DolaresService) private readonly dolaresService: DolaresService;
  @Inject(CuotasService) private readonly cuotasService: CuotasService;
  @Inject(ProveedorService) private readonly proveedorService: ProveedorService;
  @Inject(CategoriesService) private readonly categoriesService: CategoriesService;
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
      if (!Array.isArray(productDto) || productDto.length === 0) {
        const prov =
          (data as any)?.proveedor_actualizado ??
          (data as any)?.data?.proveedor_actualizado ??
          "?";
        this.logger.warn(
          { proveedor_actualizado: prov, pattern: "carga_tabla" },
          "No se recibieron productos para procesar"
        );
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
      const normalizedProducts = await Promise.all(
        productDto.map(async (item: any) => {
          const raw = item.categoriaRaw ?? item.categoria ?? "";
          const resolved =
            (await this.categoriesService.getMasterCategoryName(
              providerCode,
              raw
            )) ?? CATEGORIA_FALLBACK;
          if (resolved === CATEGORIA_FALLBACK && raw) {
            await this.categoriesService.ensureUnmappedMapping(
              providerCode,
              raw,
              item.producto
            );
          }
          return {
            proveedorId: proveedor.id,
            producto: item.producto,
            categoria: resolved,
            precio: item.precio,
            codigo: item.codigo != null ? String(item.codigo).trim() || null : null,
            imagenUrl: item.imagenUrl != null ? String(item.imagenUrl).trim() || null : null,
          };
        })
      );

      const arrProductos = this.productoRepository.create(normalizedProducts);
      await this.productoRepository.save(arrProductos);
      this.logger.log(
        { proveedor: proveedor.nombre, count: normalizedProducts.length },
        "Tabla de productos actualizada"
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

  private async buildProductList(options: {
    proveedor?: string;
    keywords?: string;
    category?: string;
    skip: number;
    take: number;
    orderBy: string;
  }): Promise<ListDto> {
    const [productos, arrayDolar, listadoCuotas] = await Promise.all([
      this.productoRepository.find({ relations: ["proveedor"] }),
      this.dolaresService.findAll(),
      this.cuotasService.findPlans(true),
    ]);

    const norm = (s: unknown) =>
      String(s ?? "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");

    let filtered = productos;
    if (options.proveedor) {
      const p = norm(options.proveedor);
      filtered = filtered.filter((x) =>
        norm(x.proveedor?.nombre).includes(p)
      );
    }
    if (options.keywords) {
      const words = options.keywords.split(" ").filter(Boolean);
      filtered = filtered.filter((x) =>
        words.every((word) =>
          norm(x.producto).includes(norm(word))
        )
      );
    }
    if (options.category) {
      const wanted = norm(options.category);
      const tree = await this.categoriesService.getMasterCategoriesTree();
      const parent = tree.find((c) => norm(c?.nombre) === wanted);
      const allowed = new Set<string>(
        (parent?.subcategorias ?? []).map((s) => norm(s)).filter(Boolean)
      );

      // Si es categoría padre con subcategorías, matcheamos por igualdad contra las hijas.
      // Caso contrario, mantenemos un fallback "includes" para no romper búsquedas previas.
      if (allowed.size > 0) {
        filtered = filtered.filter((x) => allowed.has(norm(x.categoria)));
      } else {
        filtered = filtered.filter((x) => {
          const current = norm(x.categoria);
          return current === wanted || current.includes(wanted);
        });
      }
    }

    const listadoProductos: ProductoDto[] = filtered.map((prod) => {
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
    listDto.cantResultados = listadoProductos.length;
    // `skip` en el frontend a veces viene como 0 (offset-style). Acá lo tratamos como página 1-based.
    const safeTake = Number.isFinite(options.take) && options.take > 0 ? options.take : 20;
    const safeSkip = Number.isFinite(options.skip) && options.skip > 0 ? options.skip : 1;
    listDto.productos = pagination(
      safeSkip,
      safeTake,
      handleOrder(options.orderBy, listadoProductos)
    );
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
      const productos = await this.productoRepository.find();
      const categoriasSet = new Set<string>();
      productos.forEach((prod) => categoriasSet.add(prod.categoria));
      this.logger.log("Se obtuvieron todas las categorías.");
      return Array.from(categoriasSet).sort();
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
