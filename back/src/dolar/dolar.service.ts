/* eslint-disable prettier/prettier */
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { DolarDto } from "./dto/dolarDto";
import { Dolar } from "./entities/dolar.entity";
import { DolarHistory } from "./entities/dolar-history.entity";
import { DolarHistoryQueryDto } from "./dto/dolarHistoryQuery.dto";

@Injectable()
export class DolaresService {
  constructor(
    @InjectRepository(Dolar)
    private readonly dolarRepository: Repository<Dolar>,
    @InjectRepository(DolarHistory)
    private readonly dolarHistoryRepository: Repository<DolarHistory>
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
        await this.upsertOne(valor);
      };
      return "Se actualizo el valor del dolar correctamente";
    } catch (error) {
      console.error("Error al crear o actualizar los valores del dólar:", error.message);
      return error.message;
    }
  }

  async upsertOne(input: DolarDto) {
    const proveedor = input.proveedor?.trim().toLowerCase();
    const precioDolar = Number(input.precioDolar);

    const existing = await this.dolarRepository.findOneBy({ proveedor });

    if (!existing) {
      await this.dolarRepository.save({ proveedor, precioDolar });
      console.log(`Nuevo valor del dólar guardado para el proveedor ${proveedor}`);
    } else {
      await this.dolarRepository
        .createQueryBuilder()
        .update(Dolar)
        .set({ precioDolar })
        .where("proveedor = :id", { id: proveedor })
        .execute();
      console.log(`Valor del dólar actualizado para el proveedor ${proveedor}`);
    }

    await this.dolarHistoryRepository.save(
      this.dolarHistoryRepository.create({
        proveedor,
        precioDolar,
        fechaVigencia: input.fechaVigencia ? new Date(input.fechaVigencia) : new Date(),
        usuario: input.usuario || null,
        motivo: input.motivo || null,
      })
    );

    return this.getByProvider(proveedor);
  }

  async findHistory(query: DolarHistoryQueryDto) {
    const limit = query.limit || 100;
    const where = query.proveedor
      ? { proveedor: query.proveedor.trim().toLowerCase() }
      : {};

    return this.dolarHistoryRepository.find({
      where,
      order: { fechaVigencia: "DESC", id: "DESC" },
      take: limit,
    });
  }

  async deleteProvider(proveedor: string) {
    const normalized = String(proveedor || "").trim().toLowerCase();
    if (!normalized) {
      throw new Error("Proveedor inválido.");
    }

    const existing = await this.dolarRepository.findOneBy({ proveedor: normalized });
    if (!existing) {
      throw new Error(`No existe proveedor ${normalized}.`);
    }

    await this.dolarRepository.delete({ proveedor: normalized });
    return {
      deleted: true,
      proveedor: normalized,
    };
  }
}
