import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CuotasController } from "./cuota.controller";
import { CuotasService } from "./cuota.service";
import { CuotaPlan } from "./entities/cuota-plan.entity";

@Module({
  imports: [TypeOrmModule.forFeature([CuotaPlan])],
  controllers: [CuotasController],
  providers: [CuotasService],
  exports: [CuotasService],
})
export class CuotasModule {}
