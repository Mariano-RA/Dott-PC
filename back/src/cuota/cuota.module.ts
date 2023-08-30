import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Cuota } from "./entities/cuota.entity";
import { CuotasController } from "./cuota.controller";
import { CuotasService } from "./cuota.service";

@Module({
  imports: [TypeOrmModule.forFeature([Cuota])],
  controllers: [CuotasController],
  providers: [CuotasService],
  exports: [CuotasService],
})
export class CuotasModule {}
