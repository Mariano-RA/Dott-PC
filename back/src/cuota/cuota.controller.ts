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
import { CuotasService } from "./cuota.service";
import { CuotaDto } from "./dto/cuotaDto";

import { Public } from "src/auth/decorators/public.decorator";
import { AuthorizationGuard } from "src/authTest/authorization.guard";
import { AuthGuard } from "@nestjs/passport";
import { PermissionGuard } from "src/authTest/permission.guard";

@Controller("cuota")
export class CuotasController {
  constructor(private readonly cuotasService: CuotasService) {}

  @Get()
  findAll() {
    return this.cuotasService.findAll();
  }

  @UseGuards(AuthorizationGuard, PermissionGuard)
  @SetMetadata("permissions", ["create:tablas"])
  @Post()
  loadTable(@Body() cuotaDto: CuotaDto[]) {
    return this.cuotasService.loadTable(cuotaDto);
  }
}
