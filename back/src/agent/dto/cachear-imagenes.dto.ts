import { Transform } from "class-transformer";
import { IsOptional, IsString, Matches } from "class-validator";

export class CachearImagenesDto {
  /** Proveedor a cachear. Si no se envía, se cachean todos los que tienen cache de imágenes. */
  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.trim().toLowerCase() : value))
  @IsString()
  @Matches(/^[a-z0-9_-]{1,40}$/, {
    message: "proveedor solo admite letras, números, guion y guion bajo",
  })
  proveedor?: string;
}
