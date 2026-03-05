import { Type } from "class-transformer";
import { IsNumber, Max, Min } from "class-validator";

export class CalculatorSettingDto {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Max(1000)
  cardFee: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Max(1000)
  advanceFee: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Max(1000)
  vat: number;
}
