export class createProductoDto {
  proveedor: string;

  producto: string;

  /** Categoría raw del proveedor; el backend resuelve con el maestro y guarda la normalizada en categoria. */
  categoriaRaw?: string;

  /** Fallback si no viene categoriaRaw; el backend puede usarlo para resolver o guardar directo hasta tener mapeos. */
  categoria: string;

  precio: number;

  codigo?: string | null;

  imagenUrl?: string | null;

  /** Texto libre (Invid LONG_DESCRIPTION, AIR mas_info.texto, NB ATRIBUTOS). */
  descripcion?: string | null;

  /** Specs [{nombre, valor}] (Elit atributos). */
  atributos?: Array<{ nombre: string; valor: string }> | null;
}
