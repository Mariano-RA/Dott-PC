import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "./entities/user.entity";
import { AuthDto } from "src/auth/dto/auth.dto";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  async findOneByEmail(email: string) {
    return await this.userRepository.findOne({
      where: {
        email: email,
      },
    });
  }

  async findOneById(id: number) {
    return await this.userRepository.findOne({
      where: {
        id: id,
      },
    });
  }

  async createUser(dto: AuthDto) {
    const { email, password } = dto;
    const usuarioExistente = await this.findOneByEmail(email);

    if (!usuarioExistente) {
      return await this.userRepository.save({
        email: email,
        hash: password,
      });
    }
    throw new BadRequestException("Ya existe un usuario con ese email");
  }

  async updateUser(id: number, hash: string) {
    const user = await this.findOneById(id);
    if (user) {
      const updatedUser = { ...user, hashedRt: hash };
      return await this.userRepository.save(updatedUser);
    }
    throw new BadRequestException("No se pudo actualizar el usuario");
  }

  async cleanRt(id: number) {
    console.log(id);
    const user = await this.findOneById(id);
    if (user) {
      const updatedUser = { ...user, hashedRt: null };
      return await this.userRepository.save(updatedUser);
    }
    throw new BadRequestException("No se pudo blanquear el rt");
  }
}
