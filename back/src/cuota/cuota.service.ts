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
    try {
      const resDolar = await this.cuotaRepository.find();
      resDolar.forEach((tipoCuota) => {
        let cuota = new Cuota();
        cuota.id = tipoCuota.id;
        cuota.valorTarjeta = tipoCuota.valorTarjeta;
        tipoCuotas.push(cuota);
      });
      console.log("Valores de las cuotas encontrados:", tipoCuotas);
    } catch (error) {
      console.error(
        "Error al obtener los valores de las cuotas:",
        error.message
      );
      throw error;
    }
    return tipoCuotas;
  }

  async loadTable(cuotaDto: CuotaDto[]) {
    try {
      await this.cuotaRepository.query(`DELETE FROM Cuotas `);
    } catch (error) {
      console.error(
        "Error al eliminar los valores de las cuotas:",
        error.message
      );
      return error;
    }

    try {
      const arrCuotas = await this.cuotaRepository.create(cuotaDto);
      await this.cuotaRepository.save(arrCuotas);
      return "Se actualizaron las cuotas correctamente.";
    } catch (error) {
      console.error("Error al actualizar los valores de las cuotas:", error.message);
      return error;
    }
  }
}
