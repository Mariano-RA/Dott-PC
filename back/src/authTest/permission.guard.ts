import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import { EnvKeys } from "../shared/config";

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly configService: ConfigService,
  ) {}
  canActivate(context: ExecutionContext): boolean {
    const localBypassEnabled =
      this.configService.get<string>(EnvKeys.NODE_ENV) !== "production" &&
      this.configService.get<string>(EnvKeys.LOCAL_DEV_AUTH_BYPASS) === "true";

    if (localBypassEnabled) {
      return true;
    }

    const [req] = context.getArgs();
      let userPermissions = req?.auth?.payload?.permissions ?? [];
      // Si no hay 'permissions', intenta usar 'scope' (string)
      if (userPermissions.length === 0 && typeof req?.auth?.payload?.scope === "string") {
        userPermissions = req.auth.payload.scope.split(" ");
      }

    const requiredPermissions =
      this.reflector.get("permissions", context.getHandler()) || [];
    const hasAllRequiredPermissions = requiredPermissions.every((permission) =>
      userPermissions.includes(permission)
    );
    if (requiredPermissions.length === 0 || hasAllRequiredPermissions) {
      return true;
    }
    throw new ForbiddenException("No posee los permisos suficientes.");
  }
}
