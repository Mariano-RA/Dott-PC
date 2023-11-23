/* eslint-disable prettier/prettier */
import {
  Body,
  Controller,
  Get,
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

@Controller("dolar")
export class DolaresController {
  constructor(private readonly dolaresService: DolaresService) {}

  @Get()
  async findAll() {
    return await this.dolaresService.findAll();
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
}
