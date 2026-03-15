import { Body, Controller, Delete, Get, Post, Query, UseGuards } from "@nestjs/common";
import { AuthorizationGuard } from "src/authTest/authorization.guard";
import { PermissionGuard } from "src/authTest/permission.guard";
import { SetMetadata } from "@nestjs/common";
import { CategoriesService } from "./categories.service";
import { AddMappingDto } from "./dto/add-mapping.dto";
import { AddMappingBulkDto } from "./dto/add-mapping-bulk.dto";
import { DiscardNewBulkDto } from "./dto/discard-new-bulk.dto";
import { UpsertSqlMappingDto } from "./dto/upsert-sql-mapping.dto";

@Controller("categories")
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get("new")
  async getNew() {
    return this.categoriesService.getNewGrouped();
  }

  @Get("new/raw")
  async getNewRaw() {
    return this.categoriesService.getNewRaw();
  }

  @Get("dictionary")
  async getDictionary() {
    return this.categoriesService.getDictionary();
  }

  @UseGuards(AuthorizationGuard, PermissionGuard)
  @SetMetadata("permissions", ["create:tablas"])
  @Post("dictionary")
  async addMapping(@Body() dto: AddMappingDto) {
    return this.categoriesService.addMapping(dto);
  }

  @UseGuards(AuthorizationGuard, PermissionGuard)
  @SetMetadata("permissions", ["create:tablas"])
  @Post("dictionary/bulk")
  async addMappingsBulk(@Body() dto: AddMappingBulkDto) {
    return this.categoriesService.addMappingsBulk(dto.mappings);
  }

  @UseGuards(AuthorizationGuard, PermissionGuard)
  @SetMetadata("permissions", ["create:tablas"])
  @Delete("new")
  async discardNew(
    @Query("proveedor") proveedor: string,
    @Query("categoriaRaw") categoriaRaw: string,
  ) {
    return this.categoriesService.discardNew(proveedor || "", categoriaRaw || "");
  }

  @UseGuards(AuthorizationGuard, PermissionGuard)
  @SetMetadata("permissions", ["create:tablas"])
  @Post("new/discard-bulk")
  async discardNewBulk(@Body() dto: DiscardNewBulkDto) {
    return this.categoriesService.discardNewBulk(dto.items);
  }

  // --- Endpoints SQL para el frontend ---

  /** Estado de importación: si existe diccionarios.json y cuántos mapeos hay en SQL. */
  @Get("sql/import-status")
  async getSqlImportStatus() {
    return this.categoriesService.getSqlImportStatus();
  }

  @Get("sql/master")
  async getMasterCategoriesSql() {
    return this.categoriesService.listMasterCategories();
  }

  @Get("sql/mappings")
  async getSqlMappingsByProvider(@Query("provider") provider: string) {
    const code = (provider || "").trim().toLowerCase();
    if (!code) return [];
    return this.categoriesService.listSqlMappingsByProvider(code);
  }

  @UseGuards(AuthorizationGuard, PermissionGuard)
  @SetMetadata("permissions", ["create:tablas"])
  @Post("sql/mappings")
  async upsertSqlMapping(@Body() dto: UpsertSqlMappingDto) {
    const mapping = await this.categoriesService.upsertSqlMapping(
      dto.providerCode,
      dto.providerCategoryKey,
      dto.masterCategoryName,
    );
    return mapping;
  }

  /** Carga inicial: importa providers, master_categories y mapeos desde diccionarios.json (CATEGORIES_DATA_PATH). */
  @UseGuards(AuthorizationGuard, PermissionGuard)
  @SetMetadata("permissions", ["create:tablas"])
  @Post("sql/import")
  async importFromJson(@Query("skip") skipProvider?: string) {
    return this.categoriesService.importFromDictionaryJson(skipProvider);
  }
}
