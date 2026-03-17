import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class newMessageDto {
  @IsString()
  @IsNotEmpty()
  nombreProveedor: string;

  @IsString()
  @IsNotEmpty()
  base64: string;

  @IsOptional()
  @IsString()
  fileName?: string;

  @IsOptional()
  @IsString()
  contentType?: string | null;
}
