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
      console.log("[AuthorizationGuard] Validating with issuer:", process.env.ISSUER_BASE_URL);
      console.log("[AuthorizationGuard] Validating with audience:", process.env.AUDIENCE);
      
      const authMiddleware = await auth({
        issuerBaseURL: process.env.ISSUER_BASE_URL,
        audience: process.env.AUDIENCE,
      });
      await authMiddleware(request, response, next);
      
      console.log("[AuthorizationGuard] Token validated successfully");
      return true;
    } catch (error) {
      console.error("[AuthorizationGuard] Token validation failed:", error);
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
