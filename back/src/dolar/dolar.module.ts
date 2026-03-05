import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DolaresController } from './dolar.controller';
import { DolaresService } from './dolar.service';
import { Dolar } from './entities/dolar.entity';
import { DolarHistory } from './entities/dolar-history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Dolar, DolarHistory])],
  controllers: [DolaresController],
  providers: [DolaresService],
  exports: [DolaresService]
})
export class DolaresModule {}
