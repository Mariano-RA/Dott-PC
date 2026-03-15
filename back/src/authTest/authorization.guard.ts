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
    // #region agent log
    const hasAuthHeader = !!(request.headers?.authorization?.length);
    fetch('http://127.0.0.1:7901/ingest/a43c9f0d-9231-46cb-8160-6f5aa7d983c8',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'bcf522'},body:JSON.stringify({sessionId:'bcf522',location:'authorization.guard.ts:canActivate',message:'Nest guard auth state',data:{localBypassEnabled,hasAuthHeader},timestamp:Date.now(),hypothesisId:'H1-H3-H4-H5'})}).catch(()=>{});
    // #endregion

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
      // #region agent log
      const errorType = error instanceof InvalidTokenError ? 'InvalidTokenError' : error instanceof UnauthorizedError ? 'UnauthorizedError' : 'other';
      fetch('http://127.0.0.1:7901/ingest/a43c9f0d-9231-46cb-8160-6f5aa7d983c8',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'bcf522'},body:JSON.stringify({sessionId:'bcf522',location:'authorization.guard.ts:catch',message:'Nest guard auth error',data:{errorType},timestamp:Date.now(),hypothesisId:'H4'})}).catch(()=>{});
      // #endregion
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
