import { IsBoolean, IsOptional, IsString } from "class-validator";

export class ProveedorDto {
  @IsString()
  nombre: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
