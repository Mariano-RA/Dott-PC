import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DolaresController } from './dolar.controller';
import { DolaresService } from './dolar.service';
import { Dolar } from './entities/dolar.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Dolar])],
  controllers: [DolaresController],
  providers: [DolaresService],
  exports: [DolaresService]
})
export class DolaresModule {}
