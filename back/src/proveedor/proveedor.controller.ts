import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  SetMetadata,
  UseGuards,
} from "@nestjs/common";
import { ProveedorService } from "./proveedor.service";
import { ProveedorDto } from "./dto/proveedor.dto";
import { AuthorizationGuard } from "src/authTest/authorization.guard";
import { PermissionGuard } from "src/authTest/permission.guard";

@Controller("proveedores")
export class ProveedorController {
  constructor(private readonly proveedorService: ProveedorService) {}

  @Get()
  async findAll() {
    return this.proveedorService.findAllViews();
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    const proveedor = await this.proveedorService.findOne(Number(id));
    return proveedor ? this.proveedorService.toView(proveedor) : null;
  }

  @UseGuards(AuthorizationGuard, PermissionGuard)
  @SetMetadata("permissions", ["create:tablas"])
  @Post()
  async create(@Body() dto: ProveedorDto) {
    try {
      return await this.proveedorService.create(dto);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @UseGuards(AuthorizationGuard, PermissionGuard)
  @SetMetadata("permissions", ["create:tablas"])
  @Put(":id")
  async update(@Param("id") id: string, @Body() dto: Partial<ProveedorDto>) {
    try {
      return await this.proveedorService.update(Number(id), dto);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @UseGuards(AuthorizationGuard, PermissionGuard)
  @SetMetadata("permissions", ["create:tablas"])
  @Delete(":id")
  async delete(@Param("id") id: string) {
    try {
      await this.proveedorService.delete(Number(id));
      return { message: "Proveedor eliminado correctamente" };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
