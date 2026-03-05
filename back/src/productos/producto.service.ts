import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DolaresService } from "src/dolar/dolar.service";
import { Repository } from "typeorm";
import { ProductoDto } from "./dto/productoDto";
import { Producto } from "./entities/producto.entity";
import { CuotasService } from "src/cuota/cuota.service";
import { valorCuotaDto } from "./dto/valorCuotaDto";
import { createProductoDto } from "./dto/createProductDto";
import { ListDto } from "./dto/list.dto";
import {
  ClientProxy,
  ClientProxyFactory,
  Transport,
} from "@nestjs/microservices";
import { newTableDto } from "./dto/newTableDto";
import { OK } from "sqlite3";

function obtenerMargenPorCategoria(categoria: string): number {
  switch (categoria.trim().toLowerCase()) {
    // Bajo margen
    case "placas de video":
    case "procesadores":
    case "motherboards":
    case "memorias ram":
    case "discos":
    case "notebooks":
    case "computadoras":
    case "tablets":
    case "telefonia":
    case "monitores":
      return 0.12;

    // Margen medio
    case "fuentes":
    case "gabinetes":
    case "impresoras e insumos":
    case "refrigeracion":
    case "estabilizadores y ups":
    case "sillas":
    case "electro":
      return 0.2;

    // Alto margen
    case "accesorios":
    case "auriculares":
    case "mouses":
    case "teclados":
    case "parlantes":
    case "microfonos":
    case "webcams":
    case "smartwatch":
    case "conectividad":
    case "cables y adaptadores":
    case "soportes":
    case "almacenamiento portatil":
    case "software":
      return 0.35;

    // Margen por defecto
    default:
      return 0.15;
  }
}

function obtenerPrecioEfectivo(monto, dolar, categoria) {
  const margen = obtenerMargenPorCategoria(categoria);
  return Math.round(monto * dolar * (1 + margen));
}

function calcularValorCuotas(precio, listadoCuotas) {
  const listado = [];

  listadoCuotas.forEach((plan) => {
    const tasa = Number(plan?.tasa || 0);
    const planKey = String(plan?.planKey || "");
    const parsedInstallments = Number.parseInt(planKey, 10);
    const installments = Number.isFinite(parsedInstallments) && parsedInstallments > 0 ? parsedInstallments : 0;

    const total = Math.round(precio * (1 + tasa / 100));
    const valorCuota = new valorCuotaDto();
    valorCuota.planKey = planKey;
    valorCuota.planLabel = String(plan?.label || planKey);
    valorCuota.CantidadCuotas = installments;
    valorCuota.Total = total;
    valorCuota.Cuota = installments > 0 ? Math.round(total / installments) : total;
    listado.push(valorCuota);
  });

  return listado;
}

function pagination(skip, take, items) {
  return items.slice((skip - 1) * take, skip * take);
}

function handleOrder(action, array) {
  const sortedArray = [...array];

  const sortingActions = {
    mayor: (a, b) => b.precioEfectivo - a.precioEfectivo,
    menor: (a, b) => a.precioEfectivo - b.precioEfectivo,
    nombreAsc: (a, b) =>
      a.producto.toLowerCase().localeCompare(b.producto.toLowerCase()),
    nombreDesc: (a, b) =>
      b.producto.toLowerCase().localeCompare(a.producto.toLowerCase()),
  };

  if (sortingActions[action]) {
    sortedArray.sort(sortingActions[action]);
  } else {
    console.warn(`Acción de ordenamiento desconocida: ${action}`);
  }

  return sortedArray;
}

const rabbitmq_url = process.env.RABBIT_MQ_URI;
const rabbitmq_python_queue = process.env.RABBITMQ_PYTHON_QUEUE;

@Injectable()
export class ProductosService {
  @Inject(DolaresService) private readonly dolaresService: DolaresService;
  @Inject(CuotasService) private readonly cuotasService: CuotasService;
  private client: ClientProxy;

  constructor(
    @InjectRepository(Producto)
    private readonly productoRepository: Repository<Producto>
  ) {
    this.client = ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: [rabbitmq_url],
        queue: rabbitmq_python_queue,
      },
    });
  }

  async sendMessageData(newMessageDto) {
    const msg = {
      nombreProveedor: newMessageDto.nombreProveedor,
      base64: newMessageDto.base64,
      fileName: newMessageDto.fileName,
      contentType: newMessageDto.contentType,
    };
    await this.client.emit("api_python", msg);
    console.log("Se envio el mensaje de carga a la API de python..");
    return "Se envio el mensaje de carga!";
  }

  async updateTable(data: newTableDto) {
    const productDto = data.resultado;

    try {
      const id = productDto[0].proveedor;
      const proveedorExistente = await this.productoRepository.findOneBy({
        proveedor: id,
      });

      if (!proveedorExistente) {
        const arrProductos = await this.productoRepository.create(productDto);
        await this.productoRepository.save(arrProductos);
        console.log(
          `Se crearon nuevos datos correspondientes a ${id} correctamente.`
        );
        return `Se crearon nuevos datos correspondientes a ${id} correctamente.`;
      } else {
        await this.productoRepository
          .createQueryBuilder("Productos")
          .delete()
          .from(Producto)
          .where("proveedor = :id", { id: id })
          .execute();

        const arrProductos = await this.productoRepository.create(productDto);
        await this.productoRepository.save(arrProductos);
        console.log(`Se actualizo la tabla de ${id}`);
        return OK;
      }
    } catch (error) {
      console.error(`Error al actualizar la tabla: ${error.message}`);
      throw error;
    }
  }

  async deleteProductosByProveedor(dto: { proveedor: string }) {
    const idProveedor = dto.proveedor;
    try {
      const result = await this.productoRepository
        .createQueryBuilder("producto")
        .delete()
        .from(Producto)
        .where("proveedor = :id", { id: idProveedor })
        .execute();

      if (result.affected && result.affected > 0) {
        return `Se eliminaron ${result.affected} productos del proveedor ${idProveedor}`;
      } else {
        return `No había productos del proveedor ${idProveedor}`;
      }
    } catch (error) {
      console.error(
        `Error al eliminar productos del proveedor ${idProveedor}: ${error.message}`
      );
      throw error;
    }
  }

  async findAll(
    skip: number,
    take: number,
    orderBy: string,
    proveedor?: string
  ) {
    try {
      const [productos, arrayDolar, listadoCuotas] = await Promise.all([
        this.productoRepository.find(),
        this.dolaresService.findAll(),
        this.cuotasService.findPlans(true),
      ]);

      let listadoProductos = [];

      let arrayProductos = productos;

      if (proveedor) {
        arrayProductos = arrayProductos.filter((x) =>
          x.proveedor?.toLowerCase().includes(proveedor.toLowerCase())
        );
      }

      arrayProductos.map((prod) => {
        const dto = new ProductoDto();
        dto.id = prod.id;
        dto.proveedor = prod.proveedor;
        dto.producto = prod.producto;
        dto.categoria = prod.categoria;
        const valorDolar = arrayDolar.find(
          (x) => x.proveedor == prod.proveedor
        );
        dto.precioEfectivo = obtenerPrecioEfectivo(
          prod.precio,
          valorDolar.precioDolar,
          prod.categoria
        );
        dto.precioCuotas = calcularValorCuotas(
          dto.precioEfectivo,
          listadoCuotas
        );
        listadoProductos.push(dto);
      });

      let listDto = new ListDto();
      listDto.cantResultados = arrayProductos.length;
      listadoProductos = handleOrder(orderBy, listadoProductos);
      listDto.productos = pagination(skip, take, listadoProductos);
      return listDto;
    } catch (error) {
      console.error(`Error al obtener los producots: ${error.message}`);
      throw error;
    }
  }

  async findAllCategories() {
    try {
      const productos = await this.productoRepository.find();
      const categoriasSet = new Set();

      productos.forEach((prod) => {
        categoriasSet.add(prod.categoria);
      });

      const categorias = Array.from(categoriasSet); // Convertir el conjunto a un array

      console.log("Se obtuvieron todas las categorias!");
      return categorias.sort();
    } catch (error) {
      console.error("Error al obtener las categorias:", error.message);
      throw error;
    }
  }

  async findByKeyWord(
    keywords: String,
    skip: number,
    take: number,
    orderBy: string,
    proveedor?: string
  ) {
    try {
      const [productos, arrayDolar, listadoCuotas] = await Promise.all([
        this.productoRepository.find(),
        this.dolaresService.findAll(),
        this.cuotasService.findPlans(true),
      ]);

      const listadoPalabras = keywords.split(" ");

      let listadoProductos = [];
      let arrayProductos = productos;

      if (proveedor) {
        arrayProductos = arrayProductos.filter((x) =>
          x.proveedor?.toLowerCase().includes(proveedor.toLowerCase())
        );
      }

      arrayProductos
        .filter((x) =>
          listadoPalabras.every((word) =>
            x.producto.toLowerCase().includes(word.toLowerCase())
          )
        )
        .map((prod) => {
          const dto = new ProductoDto();
          dto.id = prod.id;
          dto.proveedor = prod.proveedor;
          dto.producto = prod.producto;
          dto.categoria = prod.categoria;
          const valorDolar = arrayDolar.find(
            (x) => x.proveedor == prod.proveedor
          );
          dto.precioEfectivo = obtenerPrecioEfectivo(
            prod.precio,
            valorDolar.precioDolar,
            prod.categoria
          );
          dto.precioCuotas = calcularValorCuotas(
            dto.precioEfectivo,
            listadoCuotas
          );
          listadoProductos.push(dto);
        });
      let listDto = new ListDto();
      listDto.cantResultados = listadoProductos.length;
      listadoProductos = handleOrder(orderBy, listadoProductos);
      listDto.productos = pagination(skip, take, listadoProductos);

      console.log("Listado de productos obtenido exitosamente");

      return listDto;
    } catch (error) {
      console.error("Error al obtener el listado de productos:", error.message);
      throw error;
    }
  }

  async findByCategory(
    category: string,
    skip: number,
    take: number,
    orderBy: string,
    proveedor?: string
  ) {
    try {
      const [productos, arrayDolar, listadoCuotas] = await Promise.all([
        this.productoRepository.find(),
        this.dolaresService.findAll(),
        this.cuotasService.findPlans(true),
      ]);

      let listadoProductos = [];
      let arrayProductos = productos;

      if (proveedor) {
        arrayProductos = arrayProductos.filter((x) =>
          x.proveedor?.toLowerCase().includes(proveedor.toLowerCase())
        );
      }

      arrayProductos
        .filter((x) =>
          x.categoria.toLowerCase().includes(category.toLowerCase())
        )
        .map((prod) => {
          const dto = new ProductoDto();
          dto.id = prod.id;
          dto.proveedor = prod.proveedor;
          dto.producto = prod.producto;
          dto.categoria = prod.categoria;
          const valorDolar = arrayDolar.find(
            (x) => x.proveedor == prod.proveedor
          );
          dto.precioEfectivo = obtenerPrecioEfectivo(
            prod.precio,
            valorDolar.precioDolar,
            prod.categoria
          );
          dto.precioCuotas = calcularValorCuotas(
            dto.precioEfectivo,
            listadoCuotas
          );
          listadoProductos.push(dto);
        });

      let listDto = new ListDto();
      listDto.cantResultados = listadoProductos.length;
      listadoProductos = handleOrder(orderBy, listadoProductos);
      listDto.productos = pagination(skip, take, listadoProductos);

      console.log(
        "Se obtuvo el listado de productos de la categoria:",
        category
      );

      return listDto;
    } catch (error) {
      console.error(
        `Error al obtener el listado de productos de la categoria ${category}: ${error.message}`
      );
      throw error;
    }
  }

  async findByKeyWordAndCategory(
    keywords: String[],
    category: string,
    skip: number,
    take: number,
    orderBy: string,
    proveedor?: string
  ) {
    try {
      const [productos, arrayDolar, listadoCuotas] = await Promise.all([
        this.productoRepository.find(),
        this.dolaresService.findAll(),
        this.cuotasService.findPlans(true),
      ]);
      let listadoProductos = [];
      let arrayProductos = productos;

      if (proveedor) {
        arrayProductos = arrayProductos.filter((x) =>
          x.proveedor?.toLowerCase().includes(proveedor.toLowerCase())
        );
      }

      arrayProductos
        .filter(
          (x) =>
            keywords.every((word) =>
              x.producto.toLowerCase().includes(word.toLowerCase())
            ) && x.categoria.toLowerCase().includes(category.toLowerCase())
        )
        .map((prod) => {
          const dto = new ProductoDto();
          dto.id = prod.id;
          dto.proveedor = prod.proveedor;
          dto.producto = prod.producto;
          dto.categoria = prod.categoria;
          const valorDolar = arrayDolar.find(
            (x) => x.proveedor == prod.proveedor
          );
          dto.precioEfectivo = obtenerPrecioEfectivo(
            prod.precio,
            valorDolar.precioDolar,
            prod.categoria
          );
          dto.precioCuotas = calcularValorCuotas(
            dto.precioEfectivo,
            listadoCuotas
          );
          listadoProductos.push(dto);
        });

      let listDto = new ListDto();
      listDto.cantResultados = listadoProductos.length;
      listadoProductos = handleOrder(orderBy, listadoProductos);
      listDto.productos = pagination(skip, take, listadoProductos);
      console.log(
        "Se obtuvo el listado de productos por categoria y palabras clave"
      );
      return listDto;
    } catch (error) {
      console.error(
        `Error al obtener el listado de productos por categoria y palabras clave: ${error.message}`
      );
      throw error;
    }
  }
}
