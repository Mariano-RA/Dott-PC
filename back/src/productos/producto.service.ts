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

function obtenerPrecioEfectivo(monto, dolar) {
  return Math.round(monto * dolar);
}

function calcularValorCuotas(precio, listadoCuotas) {
  let listado = [];
  listadoCuotas.forEach((cuota) => {
    const { id, valorTarjeta } = cuota;
    const valorCuota = new valorCuotaDto();
    valorCuota.CantidadCuotas = id;
    if (valorTarjeta > 100) {
      var interesCuota = 2 + (valorTarjeta - 100) / 100;
      valorCuota.Total = Math.round(precio * interesCuota);
      valorCuota.Cuota = Math.round((precio * interesCuota) / id);
    } else {
      var interesCuota = 1 + valorTarjeta / 100;
      valorCuota.Total = Math.round(precio * interesCuota);
      valorCuota.Cuota = Math.round((precio * interesCuota) / id);
    }
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

        console.log(`Se borro la tabla de: ${idProveedor}`);
        return `Se borro la tabla de: ${idProveedor}`;
      } else {
        console.log("No habia ningun proveedor con ese id");
        return `No habia un listado del proveedor ${idProveedor}`;
      }
    } catch (error) {
      console.log(
        `Error al eliminar la tabla de ${idProveedor}: ${error.message}`
      );
      throw error;
    }
  }

  async findAll(skip: number, take: number, orderBy: string) {
    try {
      const [productos, arrayDolar, listadoCuotas] = await Promise.all([
        this.productoRepository.find(),
        this.dolaresService.findAll(),
        this.cuotasService.findAll(),
      ]);

      let listadoProductos = [];

      let arrayProductos = productos;
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
          valorDolar.precioDolar
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
    orderBy: string
  ) {
    try {
      const [productos, arrayDolar, listadoCuotas] = await Promise.all([
        this.productoRepository.find(),
        this.dolaresService.findAll(),
        this.cuotasService.findAll(),
      ]);

      const listadoPalabras = keywords.split(" ");

      let listadoProductos = [];
      // let arrayProductos = handleOrder(orderBy, productos);
      let arrayProductos = productos;
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
    orderBy: string
  ) {
    try {
      const [productos, arrayDolar, listadoCuotas] = await Promise.all([
        this.productoRepository.find(),
        this.dolaresService.findAll(),
        this.cuotasService.findAll(),
      ]);

      let listadoProductos = [];
      // let productosSorted = handleOrder(orderBy, productos);
      let arrayProductos = productos;
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
    orderBy: string
  ) {
    try {
      const [productos, arrayDolar, listadoCuotas] = await Promise.all([
        this.productoRepository.find(),
        this.dolaresService.findAll(),
        this.cuotasService.findAll(),
      ]);
      let listadoProductos = [];
      let arrayProductos = productos;
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
