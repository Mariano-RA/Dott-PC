import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DolaresModule } from "src/dolar/dolar.module";
import { Producto } from "./entities/producto.entity";
import { ProductosController } from "./producto.controller";
import { ProductosService } from "./producto.service";
import { FetchPricesTriggerService } from "./fetch-prices-trigger.service";
import { CuotasModule } from "src/cuota/cuota.module";
import { ProveedorModule } from "src/proveedor/proveedor.module";
import { CategoriesModule } from "src/categories/categories.module";
import { ImportStatusService } from "./import-status.service";
import { ImagenesModule } from "src/imagenes/imagenes.module";

@Module({
  imports: [
    CuotasModule,
    DolaresModule,
    ProveedorModule,
    CategoriesModule,
    ImagenesModule,
    TypeOrmModule.forFeature([Producto]),
  ],
  controllers: [ProductosController],
  providers: [ProductosService, FetchPricesTriggerService, ImportStatusService],
})
export class ProductosModule {}
