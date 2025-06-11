/* eslint-disable prettier/prettier */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseArrayPipe,
  Post,
  Query,
  SetMetadata,
  UseGuards,
} from "@nestjs/common";
import { ProductosService } from "./producto.service";
import { Public } from "src/auth/decorators/public.decorator";
import { AuthorizationGuard } from "src/authTest/authorization.guard";
import { PermissionGuard } from "src/authTest/permission.guard";
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from "@nestjs/microservices";
import { newTableDto } from "./dto/newTableDto";
import { newMessageDto } from "./dto/newMessageDto";

@Controller("productos")
export class ProductosController {
  constructor(private readonly productosService: ProductosService) {}

  @UseGuards(AuthorizationGuard, PermissionGuard)
  @SetMetadata("permissions", ["create:tablas"])
  @Post()
  async updateTable(@Body() newMessageDto: newMessageDto) {
    return await this.productosService.sendMessageData(newMessageDto);
  }

  @MessagePattern("carga_tabla")
  async cargaTabla(@Payload() data: newTableDto, @Ctx() context: RmqContext) {
    return await this.productosService.updateTable(data);
  }

  @Get()
  findAll(
    @Query("skip") skip: number,
    @Query("take") take: number,
    @Query("orderBy") orderBy: string
  ) {
    return this.productosService.findAll(skip, take, orderBy);
  }

  @Get("categorias/")
  findAllCategories() {
    return this.productosService.findAllCategories();
  }

  @Get("/buscarPorPalabrasClaves/")
  findByKeyWord(
    // @Query("keywords", new ParseArrayPipe({ items: String, separator: "," }))
    @Query("keywords") keywords: string,
    @Query("skip") skip: number,
    @Query("take") take: number,
    @Query("orderBy") orderBy: string
  ) {
    return this.productosService.findByKeyWord(keywords, skip, take, orderBy);
  }

  @Get("categoria/")
  findByCategory(
    @Query("category") category: string,
    @Query("skip") skip: number,
    @Query("take") take: number,
    @Query("orderBy") orderBy: string
  ) {
    return this.productosService.findByCategory(category, skip, take, orderBy);
  }

  @Get("palabrasClavesYCategoria/")
  findByKeyWordAndCategory(
    @Query("category") category: string,
    @Query("keywords", new ParseArrayPipe({ items: String, separator: "," }))
    keywords: String[],
    @Query("skip") skip: number,
    @Query("take") take: number,
    @Query("orderBy") orderBy: string
  ) {
    return this.productosService.findByKeyWordAndCategory(
      keywords,
      category,
      skip,
      take,
      orderBy
    );
  }

  @UseGuards(AuthorizationGuard, PermissionGuard)
  @SetMetadata("permissions", ["create:tablas"])
  @Delete(':idProveedor')
  async delete(@Param('idProveedor') id: string) {
    return await this.productosService.deleteProductosByProveedor({ proveedor: id });
  }
}
