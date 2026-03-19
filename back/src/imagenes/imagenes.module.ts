import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Producto } from "../productos/entities/producto.entity";
import { Proveedor } from "../proveedor/entities/proveedor.entity";
import { ProductImage } from "./entities/product-image.entity";
import { ImagenesController } from "./imagenes.controller";
import { ImageCacheService } from "./image-cache.service";
import { MinioStorageService } from "./minio-storage.service";

@Module({
  imports: [TypeOrmModule.forFeature([Producto, Proveedor, ProductImage])],
  controllers: [ImagenesController],
  providers: [ImageCacheService, MinioStorageService],
  exports: [],
})
export class ImagenesModule {}

