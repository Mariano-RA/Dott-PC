import { Module } from "@nestjs/common";
import { AdminController } from "./admin.controller";
import { ApiNestAdminController } from "./api-nest-admin.controller";

@Module({
  controllers: [AdminController, ApiNestAdminController],
})
export class AdminModule {}

