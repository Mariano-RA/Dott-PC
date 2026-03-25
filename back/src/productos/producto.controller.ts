/* eslint-disable prettier/prettier */
import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseArrayPipe,
  ParseIntPipe,
  Post,
  Query,
  SetMetadata,
  UseGuards,
} from "@nestjs/common";
import { ProductosService } from "./producto.service";
import { FetchPricesTriggerService } from "./fetch-prices-trigger.service";
import { ImportStatusService } from "./import-status.service";
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
import { FetchPricesDto } from "./dto/fetchPricesDto";

@Controller("productos")
export class ProductosController {
  constructor(
    private readonly productosService: ProductosService,
    private readonly fetchPricesTriggerService: FetchPricesTriggerService,
    private readonly importStatusService: ImportStatusService,
  ) {}

  private safeDecodeURIComponent(value: string): string {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }

  /**
   * Normaliza params de query que a veces llegan:
   * - como array (category=a&category=b)
   * - doble-encodeados (Memorias%2520RAM => Memorias%20RAM => Memorias RAM)
   */
  private asQueryText(value: unknown): string {
    const raw = Array.isArray(value) ? value.map(String).join(" ").trim() : String(value ?? "").trim();
    if (!raw) return "";

    // Decodificamos hasta 2 veces para cubrir el caso "%2520" (doble encoding).
    let decoded = raw;
    for (let i = 0; i < 2; i++) {
      const next = this.safeDecodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    }
    return decoded.trim();
  }

  @UseGuards(AuthorizationGuard, PermissionGuard)
  @SetMetadata("permissions", ["create:tablas"])
  @Post()
  async updateTable(@Body() newMessageDto: newMessageDto) {
    return await this.productosService.sendMessageData(newMessageDto);
  }

  @Get("import-status")
  importStatus(@Query("proveedor") proveedor?: string) {
    return this.importStatusService.get(String(proveedor ?? ""));
  }

  @UseGuards(AuthorizationGuard, PermissionGuard)
  @SetMetadata("permissions", ["create:tablas"])
  @Post("fetch-prices")
  async fetchPrices(@Body() dto: FetchPricesDto) {
    return await this.fetchPricesTriggerService.triggerFetchPrices(dto.proveedor);
  }

  @MessagePattern("carga_tabla")
  async cargaTabla(@Payload() data: newTableDto, @Ctx() context: RmqContext) {
    return await this.productosService.updateTable(data);
  }

  @Get()
  findAll(
    @Query("skip", new DefaultValuePipe(1), ParseIntPipe) skip: number,
    @Query("take", new DefaultValuePipe(20), ParseIntPipe) take: number,
    @Query("orderBy", new DefaultValuePipe("mayor")) orderBy: string,
    @Query("proveedor") proveedor?: string
  ) {
    return this.productosService.findAll(skip, take, orderBy, proveedor);
  }

  @Get("categorias")
  findAllCategories() {
    return this.productosService.findAllCategories();
  }

  @Get("buscarPorPalabrasClaves")
  findByKeyWord(
    // @Query("keywords", new ParseArrayPipe({ items: String, separator: "," }))
    @Query("keywords") keywords: string,
    @Query("skip", new DefaultValuePipe(1), ParseIntPipe) skip: number,
    @Query("take", new DefaultValuePipe(20), ParseIntPipe) take: number,
    @Query("orderBy", new DefaultValuePipe("mayor")) orderBy: string,
    @Query("proveedor") proveedor?: string
  ) {
    return this.productosService.findByKeyWord(keywords, skip, take, orderBy, proveedor);
  }

  @Get("categoria")
  findByCategory(
    @Query("skip", new DefaultValuePipe(1), ParseIntPipe) skip: number,
    @Query("take", new DefaultValuePipe(20), ParseIntPipe) take: number,
    @Query("orderBy", new DefaultValuePipe("mayor")) orderBy: string,
    @Query("proveedor") proveedor?: string,
    @Query("category") category?: string | string[],
    @Query("categoria") categoria?: string | string[],
  ) {
    return this.productosService.findByCategory(
      this.asQueryText(category ?? categoria),
      skip,
      take,
      orderBy,
      proveedor
    );
  }

  @Get("palabrasClavesYCategoria")
  findByKeyWordAndCategory(
    @Query("keywords", new ParseArrayPipe({ items: String, separator: "," }))
    keywords: string[],
    @Query("skip", new DefaultValuePipe(1), ParseIntPipe) skip: number,
    @Query("take", new DefaultValuePipe(20), ParseIntPipe) take: number,
    @Query("orderBy", new DefaultValuePipe("mayor")) orderBy: string,
    @Query("proveedor") proveedor?: string,
    @Query("category") category?: string | string[],
    @Query("categoria") categoria?: string | string[],
  ) {
    return this.productosService.findByKeyWordAndCategory(
      Array.isArray(keywords) ? keywords.map(String) : [],
      this.asQueryText(category ?? categoria),
      skip,
      take,
      orderBy,
      proveedor
    );
  }

  @UseGuards(AuthorizationGuard, PermissionGuard)
  @SetMetadata("permissions", ["create:tablas"])
  @Delete(":idProveedor")
  async delete(@Param("idProveedor") id: string) {
    return await this.productosService.deleteProductosByProveedor({
      proveedor: id,
    });
  }
}
