export class createProductoDto {
  proveedor: string;

  producto: string;

  /** Categoría raw del proveedor; el backend resuelve con el maestro y guarda la normalizada en categoria. */
  categoriaRaw?: string;

  /** Fallback si no viene categoriaRaw; el backend puede usarlo para resolver o guardar directo hasta tener mapeos. */
  categoria: string;

  precio: number;
}
