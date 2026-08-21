import { valorCuotaDto } from "./valorCuotaDto";

export class ProductoDto {
  id: number;

  proveedor: string;

  producto: string;

  categoria: string;

  precioEfectivo: number;

  precioCuotas: valorCuotaDto[];

  codigo?: string;

  descripcion?: string | null;

  atributos?: Array<{ nombre: string; valor: string }> | null;
}
