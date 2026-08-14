import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsObject, IsString, Max, MaxLength, Min } from "class-validator";

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

  /** Por pasarela: { [key]: { label, costs, vat, plans } } */
  @IsOptional()
  @IsObject()
  gateways?: Record<string, unknown>;

  /** Pasarela usada para cuotas en catálogo, detalle de producto y carrito. */
  @IsOptional()
  @IsString()
  @MaxLength(64)
  displayGatewayKey?: string | null;
}
