import { ProductoDto } from "./productoDto";

export type ListWarning =
  | { code: "PROVIDER_EMPTY"; proveedor: string; message: string }
  | { code: "NO_RESULTS"; message: string };

export class ListDto {
  cantResultados: number;
  productos: ProductoDto[];
  warnings?: ListWarning[];
}
