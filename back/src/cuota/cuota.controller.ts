/* eslint-disable prettier/prettier */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  SetMetadata,
  UseGuards,
} from "@nestjs/common";
import { CuotasService } from "./cuota.service";
import { AuthorizationGuard } from "src/authTest/authorization.guard";
import { PermissionGuard } from "src/authTest/permission.guard";
import { CuotaPlanDto } from "./dto/cuotaPlan.dto";

@Controller("cuota")
export class CuotasController {
  constructor(private readonly cuotasService: CuotasService) {}

  @Get("plans")
  findPlans(@Query("active") active?: string) {
    return this.cuotasService.findPlans(active === "true");
  }

  @UseGuards(AuthorizationGuard, PermissionGuard)
  @SetMetadata("permissions", ["create:tablas"])
  @Post("plans")
  upsertPlans(@Body() plans: CuotaPlanDto[]) {
    return this.cuotasService.upsertPlans(plans);
  }

  @UseGuards(AuthorizationGuard, PermissionGuard)
  @SetMetadata("permissions", ["create:tablas"])
  @Post("plans/:planKey")
  upsertPlan(@Param("planKey") planKey: string, @Body() plan: CuotaPlanDto) {
    return this.cuotasService.upsertPlan(planKey, plan);
  }

  @UseGuards(AuthorizationGuard, PermissionGuard)
  @SetMetadata("permissions", ["create:tablas"])
  @Delete("plans/:planKey")
  deletePlan(@Param("planKey") planKey: string) {
    return this.cuotasService.deletePlan(planKey);
  }
}
