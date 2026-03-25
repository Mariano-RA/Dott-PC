import { Global, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EventLogService } from "./event-log.service";
import { EventLog } from "./entities/event-log.entity";

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([EventLog])],
  providers: [EventLogService],
  exports: [EventLogService],
})
export class SharedModule {}

