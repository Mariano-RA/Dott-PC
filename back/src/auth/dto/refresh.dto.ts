import { IsNotEmpty } from "class-validator";

export class RefreshDto {
  @IsNotEmpty()
  userId: number;

  @IsNotEmpty()
  refreshToken: string;
}
