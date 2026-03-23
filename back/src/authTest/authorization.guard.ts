import {
  CanActivate,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Request, Response } from "express";
import {
  auth,
  InvalidTokenError,
  UnauthorizedError,
} from "express-oauth2-jwt-bearer";
import { EnvKeys } from "../shared/config";

@Injectable()
export class AuthorizationGuard implements CanActivate {
  private authMiddleware: any;

  constructor(private readonly configService: ConfigService) {
    this.authMiddleware = auth({
      issuerBaseURL: this.configService.get<string>(EnvKeys.ISSUER_BASE_URL),
      audience: this.configService.get<string>(EnvKeys.AUDIENCE),
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const localBypassEnabled =
      this.configService.get<string>(EnvKeys.NODE_ENV) !== "production" &&
      this.configService.get<string>(EnvKeys.LOCAL_DEV_AUTH_BYPASS) === "true";

    if (localBypassEnabled) {
      // Bypass solo para desarrollo explícito
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
      await this.authMiddleware(request, response, next);
      return true;
    } catch (error: any) {
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
