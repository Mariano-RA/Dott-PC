import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { Public } from "./decorators/public.decorator";
import { AuthDto } from "./dto/auth.dto";
import { RefreshDto } from "./dto/refresh.dto";

import { LogOutDto } from "./dto/logout.dto";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post("signup")
  signupLocal(@Body() dto: AuthDto) {
    return this.authService.signupLocal(dto);
  }

  @Public()
  @Post("signin")
  @HttpCode(HttpStatus.OK)
  signinLocal(@Body() dto: AuthDto) {
    return this.authService.signinLocal(dto);
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  logout(@Body() dto: LogOutDto) {
    return this.authService.logout(dto);
  }

  @Public()
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  refreshTokens(@Body() dto: RefreshDto) {
    return this.authService.refreshTokens(dto.userId, dto.refreshToken);
  }
}
