/* eslint-disable prettier/prettier */
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { DolarDto } from "./dto/dolarDto";
import { Dolar } from "./entities/dolar.entity";
import { DolarHistory } from "./entities/dolar-history.entity";
import { DolarHistoryQueryDto } from "./dto/dolarHistoryQuery.dto";
import { ProveedorService } from "../proveedor/proveedor.service";

@Injectable()
export class DolaresService {
  constructor(
    @InjectRepository(Dolar)
    private readonly dolarRepository: Repository<Dolar>,
    @InjectRepository(DolarHistory)
    private readonly dolarHistoryRepository: Repository<DolarHistory>,
    private readonly proveedorService: ProveedorService,
  ) {}

  async findAll() {
    try{
      const resDolar = await this.dolarRepository.find({
        relations: ['proveedor'],
      });
      console.log("Valores del dólar encontrados:", resDolar);
      return resDolar;
    } catch (error) {
      console.error("Error al obtener los valores del dólar:", error.message);
      throw error;
    }
  }

  async getByProvider(proveedor: string | number){
    try{
      let valorDolar;
      
      if (typeof proveedor === 'number') {
        // Buscar por proveedorId
        valorDolar = await this.dolarRepository.findOne({
          where: { proveedorId: proveedor },
          relations: ['proveedor'],
        });
      } else {
        // Buscar por nombre de proveedor (legacy)
        const proveedorEntity = await this.proveedorService.findByNombre(proveedor);
        if (proveedorEntity) {
          valorDolar = await this.dolarRepository.findOne({
            where: { proveedorId: proveedorEntity.id },
            relations: ['proveedor'],
          });
        }
      }
      
      console.log(`Valor del dólar obtenido para el proveedor ${proveedor}:`, valorDolar);
      return valorDolar;
    }catch (error) {
      console.error(`Error al obtener el valor del dólar para el proveedor ${proveedor}:`, error.message);
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
    try {
      const precioDolar = Number(input.precioDolar);

      if (!Number.isFinite(precioDolar)) {
        throw new Error("precioDolar debe ser un número válido");
      }

      let proveedorId: number;

      // Obtener o crear el proveedor
      if (input.proveedorId) {
        // Si viene el ID, validar que existe
        const proveedor = await this.proveedorService.findOne(input.proveedorId);
        if (!proveedor) {
          throw new Error(`No existe proveedor con ID ${input.proveedorId}`);
        }
        proveedorId = input.proveedorId;
      } else if (input.proveedor) {
        // Si viene el nombre, obtener o crear
        const proveedor = await this.proveedorService.getOrCreate(input.proveedor.trim());
        proveedorId = proveedor.id;
      } else {
        throw new Error("Debe proporcionar proveedorId o proveedor");
      }

      // Buscar dolar existente para este proveedor
      const existing = await this.dolarRepository.findOne({
        where: { proveedorId },
      });

      if (!existing) {
        await this.dolarRepository.save({ proveedorId, precioDolar });
        console.log(`Nuevo valor del dólar guardado para proveedorId ${proveedorId}`);
      } else {
        await this.dolarRepository
          .createQueryBuilder()
          .update(Dolar)
          .set({ precioDolar })
          .where("proveedorId = :id", { id: proveedorId })
          .execute();
        console.log(`Valor del dólar actualizado para proveedorId ${proveedorId}`);
      }

      // Guardar en historial
      const historyRecord = this.dolarHistoryRepository.create({
        proveedorId,
        precioDolar,
        fechaVigencia: input.fechaVigencia ? new Date(input.fechaVigencia) : new Date(),
        usuario: input.usuario || null,
        motivo: input.motivo || null,
      });
      
      await this.dolarHistoryRepository.save(historyRecord);

      return this.getByProvider(proveedorId);
    } catch (error) {
      console.error("Error en upsertOne:", error.message);
      throw new Error(`Error al guardar proveedor: ${error.message}`);
    }
  }

  async findHistory(query: DolarHistoryQueryDto) {
    const limit = query.limit || 100;
    let where = {};

    if (query.proveedor) {
      // Buscar por nombre de proveedor
      const proveedorEntity = await this.proveedorService.findByNombre(query.proveedor.trim());
      if (proveedorEntity) {
        where = { proveedorId: proveedorEntity.id };
      } else {
        // Si no existe el proveedor, retornar vacío
        return [];
      }
    }

    return this.dolarHistoryRepository.find({
      where,
      relations: ['proveedor'],
      order: { fechaVigencia: "DESC", id: "DESC" },
      take: limit,
    });
  }

  async deleteProvider(proveedor: string | number) {
    let proveedorId: number;
    let proveedorNombre: string;

    if (typeof proveedor === 'number') {
      proveedorId = proveedor;
      const proveedorEntity = await this.proveedorService.findOne(proveedorId);
      if (!proveedorEntity) {
        throw new Error(`No existe proveedor con ID ${proveedorId}`);
      }
      proveedorNombre = proveedorEntity.nombre;
    } else {
      const normalized = String(proveedor || "").trim();
      if (!normalized) {
        throw new Error("Proveedor inválido.");
      }
      
      const proveedorEntity = await this.proveedorService.findByNombre(normalized);
      if (!proveedorEntity) {
        throw new Error(`No existe proveedor ${normalized}.`);
      }
      proveedorId = proveedorEntity.id;
      proveedorNombre = proveedorEntity.nombre;
    }

    const existing = await this.dolarRepository.findOne({
      where: { proveedorId },
    });
    
    if (!existing) {
      throw new Error(`No existe tarifa de dólar para el proveedor ${proveedorNombre}.`);
    }

    await this.dolarRepository.delete({ proveedorId });
    return {
      deleted: true,
      proveedor: proveedorNombre,
      proveedorId,
    };
  }
}
