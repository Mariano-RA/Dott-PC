import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DolaresModule } from "src/dolar/dolar.module";
import { Producto } from "./entities/producto.entity";
import { ProductosController } from "./producto.controller";
import { ProductosService } from "./producto.service";
import { CuotasModule } from "src/cuota/cuota.module";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { ProveedorModule } from "src/proveedor/proveedor.module";
import { createProductoDto } from '../shared/createProductoDto';

@Module({
  imports: [
    CuotasModule, 
    DolaresModule, 
    ProveedorModule,
    TypeOrmModule.forFeature([Producto])
  ],
  controllers: [ProductosController],
  providers: [ProductosService],
})
export class ProductosModule {}
