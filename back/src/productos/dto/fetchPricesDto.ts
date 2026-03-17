import { IsOptional, IsString, MinLength } from "class-validator";

export class FetchPricesDto {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: "proveedor no puede estar vacío si se envía" })
  proveedor?: string;
}
