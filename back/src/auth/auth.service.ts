import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { UsersService } from "../users/users.service";
import { JwtService } from "@nestjs/jwt";
import * as argon from "argon2";
import { AuthDto } from "./dto/auth.dto";
import { JwtPayload } from "./types/jwtPayload.type";
import { jwtConstants } from "./constans";
import { error } from "console";
import { LogOutDto } from "./dto/logout.dto";

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async signupLocal(dto: AuthDto) {
    try {
      const hash = await argon.hash(dto.password);

      const user = await this.usersService.createUser({
        ...dto,
        password: hash,
      });

      if (user) {
        const tokens = await this.getTokens(user.id, user.email);
        await this.updateRtHash(user.id, tokens.refresh_token);
        return { ...tokens, id: user.id };
      }
    } catch (error) {
      return error.response;
    }
  }

  async signinLocal(dto: AuthDto) {
    const user = await this.usersService.findOneByEmail(dto.email);

    if (!user) throw new ForbiddenException("Access Denied");

    const passwordMatches = await argon.verify(user.hash, dto.password);
    if (!passwordMatches) throw new ForbiddenException("Access Denied");

    const tokens = await this.getTokens(user.id, user.email);
    await this.updateRtHash(user.id, tokens.refresh_token);

    return tokens;
  }

  async logout(dto: LogOutDto) {
    await this.usersService.cleanRt(dto.userId);
    return true;
  }

  async refreshTokens(userId: number, rt: string) {
    const user = await this.usersService.findOneById(userId);
    if (!user || !user.hashedRt)
      throw new ForbiddenException("El usuario no existe");

    const rtMatches = await argon.verify(user.hashedRt, rt);
    if (!rtMatches) throw new ForbiddenException("RT not matches");

    const tokens = await this.getTokens(user.id, user.email);
    await this.updateRtHash(user.id, tokens.refresh_token);

    return tokens;
  }

  async updateRtHash(userId: number, rt: string) {
    const hash = await argon.hash(rt);
    await this.usersService.updateUser(userId, hash);
  }

  async getTokens(userId: number, email: string) {
    const jwtPayload: JwtPayload = {
      sub: userId,
      email: email,
    };

    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(jwtPayload, {
        secret: jwtConstants.AT_SECRET,
        expiresIn: "60s",
      }),
      this.jwtService.signAsync(jwtPayload, {
        secret: jwtConstants.RT_SECRET,
        expiresIn: "1d",
      }),
    ]);

    return {
      access_token: at,
      refresh_token: rt,
    };
  }
}
