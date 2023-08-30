import { Injectable } from "@nestjs/common";

import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { JwtPayload } from "../types/jwtPayload.type";
import { jwtConstants } from "../constans";

@Injectable()
export class AtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: jwtConstants.AT_SECRET,
    });
  }

  validate(payload: JwtPayload) {
    return payload;
  }
}
