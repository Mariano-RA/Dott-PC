import { Transform, Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from "class-validator";

export const MAX_ITEMS_POR_PEDIDO = 25;

const trim = ({ value }: { value: unknown }) => (typeof value === "string" ? value.trim() : value);
const trimLower = ({ value }: { value: unknown }) => (typeof value === "string" ? value.trim().toLowerCase() : value);

export class DescartarItemDto {
  @Transform(trimLower)
  @IsString()
  @Matches(/^[a-z0-9_-]{1,40}$/, { message: "proveedor solo admite letras, números, guion y guion bajo" })
  proveedor: string;

  /** Categoría tal como vino en el listado del proveedor. */
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(190)
  categoriaRaw: string;
}

export class MapearItemDto extends DescartarItemDto {
  /** Categoría maestra ya existente a la que se asigna. */
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(190)
  categoriaMaestra: string;
}

export class MapearCategoriasDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_ITEMS_POR_PEDIDO)
  @ValidateNested({ each: true })
  @Type(() => MapearItemDto)
  items: MapearItemDto[];
}

export class DescartarCategoriasDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_ITEMS_POR_PEDIDO)
  @ValidateNested({ each: true })
  @Type(() => DescartarItemDto)
  items: DescartarItemDto[];
}
