import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DolaresService } from "src/dolar/dolar.service";
import { Repository } from "typeorm";
import { ProductoDto } from "./dto/productoDto";
import { Producto } from "./entities/producto.entity";
import { CuotasService } from "src/cuota/cuota.service";
import { valorCuotaDto } from "./dto/valorCuotaDto";
import { createProductoDto } from "./dto/createProductDto";
import { Logger } from "@nestjs/common";
import { ListDto } from "./dto/list.dto";
import {
  ClientProxy,
  ClientProxyFactory,
  Transport,
} from "@nestjs/microservices";
import { newTableDto } from "./dto/newTableDto";

function obtenerPrecioEfectivo(monto, dolar) {
  return Math.round(monto * dolar);
}

function calcularValorCuotas(precio, listadoCuotas) {
  let listado = [];
  listadoCuotas.forEach((cuota) => {
    const { id, valorTarjeta } = cuota;
    const interesTotal = 1 - valorTarjeta / 100;
    const valorCuota = new valorCuotaDto();
    valorCuota.CantidadCuotas = id;
    valorCuota.Total = Math.round(precio / interesTotal);
    valorCuota.Cuota = Math.round(precio / interesTotal / id);
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
    mayor: (a, b) => b.precio - a.precio,
    menor: (a, b) => a.precio - b.precio,
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

  private readonly logger = new Logger(ProductosService.name);

  async sendMessageData(newMessageDto) {
    const msg = {
      nombreProveedor: newMessageDto.nombreProveedor,
      base64: newMessageDto.base64,
    };
    await this.client.emit("api_python", msg);
    return "Se envio el mensaje de carga!";
  }

  async updateTable(data: newTableDto) {
    console.log("Mensaje recibido...")
    const productDto = data.resultado;

    try {
      const id = productDto[0].proveedor;

      const proveedorExistente = await this.productoRepository.findOneBy({
        proveedor: id,
      });

      if (!proveedorExistente) {
        const arrProductos = await this.productoRepository.create(productDto);
        await this.productoRepository.save(arrProductos);
        console.log(`Se crearon nuevos datos correspondientes a ${id} correctamente.`)
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
        this.logger.debug("Se actualizaron tablas");
        console.log("Se actualizaron tablas");
        return `Se actualizo la tabla de: ${id}`;
      }
    } catch (error) {
      this.logger.error(error);
      return "Hubo un error al actualizar la tabla" + error
    }
  }

  async deleteTable(proveedorDto) {

    const idProveedor = proveedorDto.proveedor;
    try {
      const proveedorExistente = await this.productoRepository.findOneBy({
        proveedor: idProveedor,
      });

      if (proveedorExistente) {
        await this.productoRepository
          .createQueryBuilder("Productos")
          .delete()
          .from(Producto)
          .where("proveedor = :id", { id: idProveedor })
          .execute();

        this.logger.debug("Se borro tablas");
        return `Se borro la tabla de: ${idProveedor}`
      }
      else{
        this.logger.debug("No habia ningun proveedor con ese id");
        return `No habia un listado del proveedor ${idProveedor}`
      }
    } catch (error) {
      this.logger.error(error);
      console.log(error)
      return error;
    }
  }

  async findAll(skip: number, take: number, orderBy: string) {
    const [productos, arrayDolar, listadoCuotas] = await Promise.all([
      this.productoRepository.find(),
      this.dolaresService.findAll(),
      this.cuotasService.findAll(),
    ]);

    const listadoProductos = [];

    let productosSorted = handleOrder(orderBy, productos);
    productosSorted.map((prod) => {
      const dto = new ProductoDto();
      dto.id = prod.id;
      dto.proveedor = prod.proveedor;
      dto.producto = prod.producto;
      dto.categoria = prod.categoria;
      const valorDolar = arrayDolar.find(x => x.proveedor == prod.proveedor)
      dto.precioEfectivo = obtenerPrecioEfectivo(
        prod.precio,
        valorDolar.precioDolar
      );
      dto.precioCuotas = calcularValorCuotas(dto.precioEfectivo, listadoCuotas);
      listadoProductos.push(dto);
    });

    let listDto = new ListDto();
    listDto.cantResultados = productosSorted.length;
    listDto.productos = pagination(skip, take, listadoProductos);
    return listDto;
  }

  async findAllCategories() {
    const productos = await this.productoRepository.find();
    const categoriasSet = [];

    productos.forEach((prod) => {
      categoriasSet.push(prod.categoria);
    });
    return categoriasSet.sort();
  }

  async findByKeyWord(
    keywords: String,
    skip: number,
    take: number,
    orderBy: string
  ) {
    const [productos, arrayDolar, listadoCuotas] = await Promise.all([
      this.productoRepository.find(),
      this.dolaresService.findAll(),
      this.cuotasService.findAll(),
    ]);

    const listadoPalabras = keywords.split(" ");

    const listadoProductos = [];
    let productosSorted = handleOrder(orderBy, productos);
    productosSorted
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
        const valorDolar = arrayDolar.find(x => x.proveedor == prod.proveedor)
        dto.precioEfectivo = obtenerPrecioEfectivo(
        prod.precio,
        valorDolar.precioDolar
        );
        dto.precioCuotas = calcularValorCuotas(
          dto.precioEfectivo,
          listadoCuotas
        );
        listadoProductos.push(dto);
      });
    let listDto = new ListDto();
    listDto.cantResultados = listadoProductos.length;
    listDto.productos = pagination(skip, take, listadoProductos);
    return listDto;
  }

  async findByCategory(
    category: string,
    skip: number,
    take: number,
    orderBy: string
  ) {
    const [productos, arrayDolar, listadoCuotas] = await Promise.all([
      this.productoRepository.find(),
      this.dolaresService.findAll(),
      this.cuotasService.findAll(),
    ]);
    const listadoProductos = [];
    let productosSorted = handleOrder(orderBy, productos);
    productosSorted
      .filter((x) => x.categoria.toLowerCase().includes(category.toLowerCase()))
      .map((prod) => {
        const dto = new ProductoDto();
        dto.id = prod.id;
        dto.proveedor = prod.proveedor;
        dto.producto = prod.producto;
        dto.categoria = prod.categoria;
        const valorDolar = arrayDolar.find(x => x.proveedor == prod.proveedor)
        dto.precioEfectivo = obtenerPrecioEfectivo(
          prod.precio,
          valorDolar.precioDolar
        );
        dto.precioCuotas = calcularValorCuotas(
          dto.precioEfectivo,
          listadoCuotas
        );
        listadoProductos.push(dto);
      });

    let listDto = new ListDto();
    listDto.cantResultados = listadoProductos.length;
    listDto.productos = pagination(skip, take, listadoProductos);
    return listDto;
  }

  async findByKeyWordAndCategory(
    keywords: String[],
    category: string,
    skip: number,
    take: number,
    orderBy: string
  ) {
    const [productos, arrayDolar, listadoCuotas] = await Promise.all([
      this.productoRepository.find(),
      this.dolaresService.findAll(),
      this.cuotasService.findAll(),
    ]);
    const listadoProductos = [];
    let productosSorted = handleOrder(orderBy, productos);
    productosSorted
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
        const valorDolar = arrayDolar.find(x => x.proveedor == prod.proveedor)
        dto.precioEfectivo = obtenerPrecioEfectivo(
          prod.precio,
          valorDolar.precioDolar
        );
        dto.precioCuotas = calcularValorCuotas(
          dto.precioEfectivo,
          listadoCuotas
        );
        listadoProductos.push(dto);
      });

    let listDto = new ListDto();
    listDto.cantResultados = listadoProductos.length;
    listDto.productos = pagination(skip, take, listadoProductos);
    return listDto;
  }
}
