import { Type } from "class-transformer";
import { IsArray, IsNotEmpty, ValidateNested } from "class-validator";
import { AddMappingDto } from "./add-mapping.dto";

export class AddMappingBulkDto {
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => AddMappingDto)
  mappings: AddMappingDto[];
}
