import { Transform, Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";

export const MAX_LINEAS_ARMADO = 12;
export const MAX_OPCIONES_POR_LINEA = 12;

const trim = ({ value }: { value: unknown }) => (typeof value === "string" ? value.trim() : value);
const trimLower = ({ value }: { value: unknown }) => (typeof value === "string" ? value.trim().toLowerCase() : value);

/** Query de GET /agent/armado/buscar. */
export class BuscarComponentesDto {
  /** Palabras clave del nombre del producto (todas tienen que aparecer). */
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(80)
  q?: string;

  /** Categoría maestra (ej. "Procesadores") o su padre (ej. "Componentes de PC"). */
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(80)
  categoria?: string;

  /** Un solo proveedor. Si no se indica, se busca en todos los activos. */
  @IsOptional()
  @Transform(trimLower)
  @IsString()
  @Matches(/^[a-z0-9_-]{1,40}$/, { message: "proveedor solo admite letras, números, guion y guion bajo" })
  proveedor?: string;

  /** Cuántos resultados (los más baratos) por proveedor. Por defecto 3. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  porProveedor?: number;
}

export class LineaArmadoDto {
  /** Nombre de la pieza ("Procesador", "Placa de video"…). */
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  nombre: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  cantidad?: number;

  /** Ids de producto (de /agent/armado/buscar) que sirven para esta pieza, de uno o varios proveedores. */
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_OPCIONES_POR_LINEA)
  @IsInt({ each: true })
  @IsPositive({ each: true })
  opciones: number[];
}

export class CotizarArmadoDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_LINEAS_ARMADO)
  @ValidateNested({ each: true })
  @Type(() => LineaArmadoDto)
  lineas: LineaArmadoDto[];
}
