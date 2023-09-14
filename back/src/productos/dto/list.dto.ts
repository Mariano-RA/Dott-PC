import { Producto } from "../entities/producto.entity";

export class ListDto {
  cantResultados: number;
  productos: Producto[];
}
