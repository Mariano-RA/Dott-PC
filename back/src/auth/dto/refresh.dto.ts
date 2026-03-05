import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsString, Min } from "class-validator";

export class RefreshDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  userId: number;

  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
