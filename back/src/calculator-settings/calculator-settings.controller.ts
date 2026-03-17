import { Body, Controller, Get, Post, SetMetadata, UseGuards } from "@nestjs/common";
import { CalculatorSettingsService } from "./calculator-settings.service";
import { CalculatorSettingDto } from "./dto/calculator-setting.dto";
import { AuthorizationGuard } from "src/authTest/authorization.guard";
import { PermissionGuard } from "src/authTest/permission.guard";

@Controller("calculator-settings")
export class CalculatorSettingsController {
  constructor(private readonly calculatorSettingsService: CalculatorSettingsService) {}

  @Get()
  async getSettings() {
    return this.calculatorSettingsService.getSettings();
  }

  @UseGuards(AuthorizationGuard, PermissionGuard)
  @SetMetadata("permissions", ["create:tablas"])
  @Post()
  async updateSettings(@Body() dto: CalculatorSettingDto) {
    return this.calculatorSettingsService.updateSettings(dto);
  }
}
