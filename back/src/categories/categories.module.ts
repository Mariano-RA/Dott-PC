import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CategoriesController } from "./categories.controller";
import { CategoriesService } from "./categories.service";
import { DictionaryFileService } from "./services/dictionary-file.service";
import { MasterCategory } from "./entities/master-category.entity";
import { CategoryProvider } from "./entities/category-provider.entity";
import { ProviderCategoryMapping } from "./entities/provider-category-mapping.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MasterCategory,
      CategoryProvider,
      ProviderCategoryMapping,
    ]),
  ],
  controllers: [CategoriesController],
  providers: [CategoriesService, DictionaryFileService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
