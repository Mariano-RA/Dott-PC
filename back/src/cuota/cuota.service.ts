/* eslint-disable prettier/prettier */
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DeepPartial, Repository } from "typeorm";
import { Cuota } from "./entities/cuota.entity";
import { CuotaDto } from "./dto/cuotaDto";

@Injectable()
export class CuotasService {
  constructor(
    @InjectRepository(Cuota)
    private readonly cuotaRepository: Repository<Cuota>
  ) {}

  async findAll() {
    let tipoCuotas: Cuota[] = [];
    const resDolar = await this.cuotaRepository.find();
    resDolar.forEach((tipoCuota) => {
      let cuota = new Cuota();
      cuota.id = tipoCuota.id;
      cuota.valorTarjeta = tipoCuota.valorTarjeta;
      tipoCuotas.push(cuota);
    });
    return tipoCuotas;
  }

  async loadTable(cuotaDto: CuotaDto[]) {
    try {
      await this.cuotaRepository.query(`DELETE FROM Cuotas `);
    } catch (error) {
      return error;
    }
    try {
      const arrCuotas = await this.cuotaRepository.create(cuotaDto);
      await this.cuotaRepository.save(arrCuotas);
      return "Se cargo la tabla correctamente.";
    } catch (error) {
      return error;
    }
  }
}
