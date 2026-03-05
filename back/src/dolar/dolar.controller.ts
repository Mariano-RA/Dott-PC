/* eslint-disable prettier/prettier */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  SetMetadata,
  UseGuards,
} from "@nestjs/common";
import { DolaresService } from "./dolar.service";
import { DolarDto } from "./dto/dolarDto";
import { RtGuard } from "src/auth/guards/rt.guard";
import { Public } from "src/auth/decorators/public.decorator";
import { AuthorizationGuard } from "src/authTest/authorization.guard";
import { PermissionGuard } from "src/authTest/permission.guard";
import { DolarHistoryQueryDto } from "./dto/dolarHistoryQuery.dto";

@Controller("dolar")
export class DolaresController {
  constructor(private readonly dolaresService: DolaresService) {}

  @Get()
  async findAll() {
    return await this.dolaresService.findAll();
  }

  @Get("history")
  async findHistory(@Query() query: DolarHistoryQueryDto) {
    return await this.dolaresService.findHistory(query);
  }
  
  @Get("byproveedor/")
  async getByProvider(@Body() proveedor: string) {
    return await this.dolaresService.getByProvider(proveedor);
  }

  @UseGuards(AuthorizationGuard, PermissionGuard)
  @SetMetadata("permissions", ["create:tablas"])
  @Post()
  async cargarValores(@Body() dolarDto: DolarDto[]) {
    return await this.dolaresService.create(dolarDto);
  }

  @UseGuards(AuthorizationGuard, PermissionGuard)
  @SetMetadata("permissions", ["create:tablas"])
  @Post(":proveedor")
  async cargarValorProveedor(
    @Param("proveedor") proveedor: string,
    @Body() dolarDto: Omit<DolarDto, "proveedor">
  ) {
    return await this.dolaresService.upsertOne({ ...dolarDto, proveedor });
  }

  @UseGuards(AuthorizationGuard, PermissionGuard)
  @SetMetadata("permissions", ["create:tablas"])
  @Delete(":proveedor")
  async deleteProveedor(@Param("proveedor") proveedor: string) {
    return await this.dolaresService.deleteProvider(proveedor);
  }
}
