import { Transform, Type } from "class-transformer";
import { IsBoolean, IsNumber, IsOptional, IsString, Matches, Max, MaxLength, Min } from "class-validator";

export class ActualizarDolarDto {
  /** Nuevo valor del dólar (pesos por dólar). */
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(1)
  @Max(1000000)
  precioDolar: number;

  /** Un proveedor puntual. Excluyente con `todos`. */
  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.trim().toLowerCase() : value))
  @IsString()
  @Matches(/^[a-z0-9_-]{1,40}$/, {
    message: "proveedor solo admite letras, números, guion y guion bajo",
  })
  proveedor?: string;

  /** Aplicar el mismo valor a todos los proveedores activos que ya tienen dólar. Excluyente con `proveedor`. */
  @IsOptional()
  @IsBoolean()
  todos?: boolean;

  /** Solo se manda en true cuando Nano confirmó un cambio de más de 30%. */
  @IsOptional()
  @IsBoolean()
  confirmado?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  motivo?: string;
}
