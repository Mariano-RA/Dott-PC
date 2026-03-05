import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, Min } from "class-validator";

export class LogOutDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  userId: number;
}
