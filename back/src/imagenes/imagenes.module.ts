import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Producto } from "../productos/entities/producto.entity";
import { Proveedor } from "../proveedor/entities/proveedor.entity";
import { ProductImage } from "./entities/product-image.entity";
import { ProductImageSource } from "./entities/product-image-source.entity";
import { ImagenesController } from "./imagenes.controller";
import { ImageCacheService } from "./image-cache.service";
import { MinioStorageService } from "./minio-storage.service";
import { ProveedorModule } from "../proveedor/proveedor.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Producto, Proveedor, ProductImage, ProductImageSource]),
    ProveedorModule,
  ],
  controllers: [ImagenesController],
  providers: [ImageCacheService, MinioStorageService],
  exports: [ImageCacheService],
})
export class ImagenesModule {}

