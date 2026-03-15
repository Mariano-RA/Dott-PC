import { Type } from "class-transformer";
import { IsArray, IsNotEmpty, IsString, ValidateNested } from "class-validator";

export class DiscardNewItemDto {
  @IsString()
  proveedor: string;

  @IsString()
  categoriaRaw: string;
}

export class DiscardNewBulkDto {
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => DiscardNewItemDto)
  items: DiscardNewItemDto[];
}
