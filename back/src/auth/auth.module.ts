import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
// Legacy local auth module removido. Usar solo Auth0 guards.
@Module({})
export class AuthModule {}
