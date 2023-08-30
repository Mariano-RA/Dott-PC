import { Double } from "typeorm";
import { valorCuotaDto } from "./valorCuotaDto";

export class ProductoDto {
  id: number;

  proveedor: string;

  producto: string;

  categoria: string;

  precioEfectivo: number;

  precioCuotas: valorCuotaDto[];
}
