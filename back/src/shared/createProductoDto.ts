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

  /** Texto libre (AIR mas_info.texto, Invid prosa / fila Descripción, NB sin pares clave:valor). */
  descripcion?: string | null;

  /** Specs [{nombre, valor}] (Elit atributos, Invid tabla, NB líneas «Nombre: Valor»). */
  atributos?: Array<{ nombre: string; valor: string }> | null;
}
