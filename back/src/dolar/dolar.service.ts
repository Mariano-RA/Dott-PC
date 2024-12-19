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
    try{
      const resDolar = await this.dolarRepository.find();
      resDolar.forEach((tipoDolar) => {
        let dolar = new Dolar();
        dolar.id = tipoDolar.id;
        dolar.precioDolar = tipoDolar.precioDolar;
        dolar.proveedor= tipoDolar.proveedor;
        valorDolar.push(dolar);
      });
      console.log("Valores del dólar encontrados:", valorDolar);
    } catch (error) {
      console.error("Error al obtener los valores del dólar:", error.message);
      throw error;
    }
    return valorDolar;
  }

  async getByProvider(proveedor: string){
    try{
      const valorDolar =  await this.dolarRepository.findOneBy({
        proveedor: proveedor,
      });
      console.log(`Valor del dólar obtenido para el proveedor ${proveedor}:`, valorDolar);
      return valorDolar;
    }catch (error) {
      console.error(`Error al obtener el valor del dólar para el proveedor ${proveedor}:`, error.message); // Log de error
      throw error;
    }
  }

  async create(arrayDolar: DolarDto[]) {
    try {
      for(const valor of arrayDolar) {
        const valorDolar = await this.dolarRepository.findOneBy({
          proveedor: valor.proveedor,
        });
        if(!valorDolar){
          await this.dolarRepository.save({proveedor: valor.proveedor, precioDolar:valor.precioDolar});
          console.log(`Nuevo valor del dólar guardado para el proveedor ${valor.proveedor}`);
        }else{
          await this.dolarRepository
            .createQueryBuilder()
            .update(Dolar)
            .set({ precioDolar: valor.precioDolar })
            .where("proveedor = :id", { id: valor.proveedor })
            .execute();
            console.log(`Valor del dólar actualizado para el proveedor ${valor.proveedor}`);
        }
      };
      return "Se actualizo el valor del dolar correctamente";
    } catch (error) {
      console.error("Error al crear o actualizar los valores del dólar:", error.message);
      return error.message;
    }
  }
}
