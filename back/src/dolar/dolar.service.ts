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

  async findAll() {
    let valorDolar: Dolar[] = [];
    const resDolar = await this.dolarRepository.find();
    resDolar.forEach((tipoDolar) => {
      let dolar = new Dolar();
      dolar.id = tipoDolar.id;
      dolar.precioDolar = tipoDolar.precioDolar;
      dolar.proveedor= tipoDolar.proveedor;
      valorDolar.push(dolar);
    });
    return valorDolar;
  }

  async getByProvider(proveedor: string){
    const valorDolar =  await this.dolarRepository.findOneBy({
      proveedor: proveedor,
    });
  }

  async create(arrayDolar: DolarDto[]) {
    try {
      for(const valor of arrayDolar) {
        const valorDolar = await this.dolarRepository.findOneBy({
          proveedor: valor.proveedor,
        });
        if(!valorDolar){
          this.dolarRepository.save({proveedor: valor.proveedor, precioDolar:valor.precioDolar});
        }else{
          this.dolarRepository.createQueryBuilder()
          .update(Dolar)
          .set({ precioDolar: valor.precioDolar })
          .where("proveedor = :id", { id: valor.proveedor })
          .execute()
        }
      };
      // return Ok "Se crearon y/o actualizaron los valores correctamente";
      return "Se actualizo el valor del colar correctamente";
    } catch (error) {
      return error.message;
    }
  }
}
