import { IsNotEmpty, IsString } from "class-validator";

export class UpsertSqlMappingDto {
  /** Código de proveedor (air, elit, mega, etc.). */
  @IsString()
  @IsNotEmpty()
  providerCode: string;

  /** Clave de categoría tal como viene del proveedor. */
  @IsString()
  @IsNotEmpty()
  providerCategoryKey: string;

  /**
   * Nombre de categoría maestra.
   * Debe coincidir con una categoría existente o se creará (slugificado).
   */
  @IsString()
  @IsNotEmpty()
  masterCategoryName: string;
}

