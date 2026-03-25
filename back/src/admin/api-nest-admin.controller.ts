import {
  Controller,
  Get,
  Query,
  SetMetadata,
  UseGuards,
} from "@nestjs/common";
import { AuthorizationGuard } from "src/authTest/authorization.guard";
import { PermissionGuard } from "src/authTest/permission.guard";
import { EventLogService } from "src/shared/event-log.service";

/**
 * Compat layer: en algunos despliegues el frontend llama a /api/nest/* en el mismo origen.
 * Exponemos el mismo endpoint que /admin/logs bajo /api/nest/admin/logs.
 */
@Controller("api/nest/admin")
export class ApiNestAdminController {
  constructor(private readonly eventLogService: EventLogService) {}

  @UseGuards(AuthorizationGuard, PermissionGuard)
  @SetMetadata("permissions", ["create:tablas"])
  @Get("logs")
  async listLogs(
    @Query("level") level?: "info" | "warn" | "error",
    @Query("source") source?: string,
    @Query("q") q?: string,
    @Query("limit") limit?: string
  ) {
    const limitNum = limit != null ? Number(limit) : undefined;
    return await this.eventLogService.list({ level, source, q, limit: limitNum });
  }
}

