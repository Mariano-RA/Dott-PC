import { Module } from "@nestjs/common";
import { AuthDto } from '../shared/auth.dto';
// Legacy local auth module removido. Usar solo Auth0 guards.
@Module({})
export class AuthModule {}
