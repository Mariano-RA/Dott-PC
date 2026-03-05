import {
  CanActivate,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from "@nestjs/common";
import { Request, Response } from "express";
import {
  auth,
  InvalidTokenError,
  UnauthorizedError,
} from "express-oauth2-jwt-bearer";

@Injectable()
export class AuthorizationGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const localBypassEnabled =
      process.env.NODE_ENV !== "production" && process.env.LOCAL_DEV_AUTH_BYPASS === "true";

    if (localBypassEnabled) {
      console.warn("[LOCAL_DEV_AUTH_BYPASS] AuthorizationGuard bypass activo");
      // Simula un payload minimo para que PermissionGuard no falle por req.auth undefined.
      (request as any).auth = {
        payload: {
          permissions: ["create:tablas"],
        },
      };
      return true;
    }

    const next = (err?: any) => {
      if (err) {
        throw err;
      }
    };

    try {
      // await validateAccessToken(request, response);
      await auth()(request, response, next);

      return true;
    } catch (error) {
      if (error instanceof InvalidTokenError) {
        throw new UnauthorizedException("Bad credentials");
      }

      if (error instanceof UnauthorizedError) {
        throw new UnauthorizedException("Requires authentication");
      }

      throw new InternalServerErrorException();
    }
  }
}
