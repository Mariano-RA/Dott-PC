import { Type } from "class-transformer";
import { IsDateString, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";

export class DolarDto {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(1)
  @Max(1000000)
  precioDolar: number;

  // Acepta nombre de proveedor (legacy) o proveedorId
  @IsOptional()
  @IsString()
  proveedor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  proveedorId?: number;

  @IsOptional()
  @IsDateString()
  fechaVigencia?: string;

  @IsOptional()
  @IsString()
  usuario?: string;

  @IsOptional()
  @IsString()
  motivo?: string;
}
