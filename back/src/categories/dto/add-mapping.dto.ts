import { IsString, IsNotEmpty, MinLength } from "class-validator";

export class AddMappingDto {
  @IsString()
  @IsNotEmpty()
  proveedor: string;

  /** Categoría raw (la que viene del listado del proveedor). */
  @IsString()
  @IsNotEmpty()
  categoriaRaw: string;

  /** Categoría normalizada a usar en diccionarios.json. */
  @IsString()
  @MinLength(1)
  categoriaNormalizada: string;
}
