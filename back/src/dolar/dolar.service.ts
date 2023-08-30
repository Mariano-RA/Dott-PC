/* eslint-disable prettier/prettier */
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DeepPartial, Repository } from "typeorm";
import { DolarDto } from "./dto/dolarDto";
import { Dolar } from "./entities/dolar.entity";

@Injectable()
export class DolaresService {
  constructor(
    @InjectRepository(Dolar)
    private readonly dolarRepository: Repository<Dolar>
  ) {}

  async getLastOne() {
    const resDolar = await this.dolarRepository
      .createQueryBuilder()
      .select()
      .orderBy("id", "DESC")
      .getOne();

    if (resDolar != null) {
      const dolarFinal = new Dolar();
      dolarFinal.id = resDolar.id;
      dolarFinal.precioDolar = resDolar.precioDolar;
      return dolarFinal;
    }
    return null;
  }

  async create(dolarDto: DolarDto) {
    try {
      await this.dolarRepository.save({ precioDolar: dolarDto.precioDolar });
      return "Se creo el registro correctamente";
    } catch (error) {
      return error;
    }
  }
}
