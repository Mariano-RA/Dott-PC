import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CalculatorSetting } from "./entities/calculator-setting.entity";
import { CalculatorSettingsController } from "./calculator-settings.controller";
import { CalculatorSettingsService } from "./calculator-settings.service";

@Module({
  imports: [TypeOrmModule.forFeature([CalculatorSetting])],
  controllers: [CalculatorSettingsController],
  providers: [CalculatorSettingsService],
  exports: [CalculatorSettingsService],
})
export class CalculatorSettingsModule {}
