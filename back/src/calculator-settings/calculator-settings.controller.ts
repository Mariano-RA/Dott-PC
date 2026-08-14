import { Body, Controller, Delete, Get, Param, Post, Put, SetMetadata, UseGuards } from "@nestjs/common";
import { CalculatorSettingsService } from "./calculator-settings.service";
import { CalculatorSettingDto } from "./dto/calculator-setting.dto";
import { DisplayGatewayDto, UpsertGatewayDto } from "./dto/gateway.dto";
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

  @UseGuards(AuthorizationGuard, PermissionGuard)
  @SetMetadata("permissions", ["create:tablas"])
  @Post("gateways")
  async createGateway(@Body() dto: UpsertGatewayDto) {
    return this.calculatorSettingsService.createGateway(dto);
  }

  @UseGuards(AuthorizationGuard, PermissionGuard)
  @SetMetadata("permissions", ["create:tablas"])
  @Put("gateways/:key")
  async updateGateway(@Param("key") key: string, @Body() dto: UpsertGatewayDto) {
    return this.calculatorSettingsService.updateGateway(key, dto);
  }

  @UseGuards(AuthorizationGuard, PermissionGuard)
  @SetMetadata("permissions", ["create:tablas"])
  @Delete("gateways/:key")
  async deleteGateway(@Param("key") key: string) {
    return this.calculatorSettingsService.deleteGateway(key);
  }

  @UseGuards(AuthorizationGuard, PermissionGuard)
  @SetMetadata("permissions", ["create:tablas"])
  @Post("display-gateway")
  async setDisplayGateway(@Body() dto: DisplayGatewayDto) {
    return this.calculatorSettingsService.setDisplayGateway(dto.key);
  }
}
