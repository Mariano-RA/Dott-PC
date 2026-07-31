import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Proveedor } from "./entities/proveedor.entity";
import { ProveedorDto } from "./dto/proveedor.dto";

@Injectable()
export class ProveedorService {
  constructor(
    @InjectRepository(Proveedor)
    private readonly proveedorRepository: Repository<Proveedor>
  ) {}

  async findAll(): Promise<Proveedor[]> {
    return this.proveedorRepository.find({ order: { nombre: "ASC" } });
  }

  async findActivos(): Promise<Proveedor[]> {
    return this.proveedorRepository.find({
      where: { activo: true },
      order: { nombre: "ASC" },
    });
  }

  async findOne(id: number): Promise<Proveedor> {
    return this.proveedorRepository.findOneBy({ id });
  }

  async findByNombre(nombre: string): Promise<Proveedor> {
    const normalized = nombre.trim().toLowerCase();
    return this.proveedorRepository.findOneBy({ nombre: normalized });
  }

  async create(dto: ProveedorDto): Promise<Proveedor> {
    const normalized = dto.nombre.trim().toLowerCase();
    
    const existing = await this.findByNombre(normalized);
    if (existing) {
      throw new Error(`El proveedor "${normalized}" ya existe.`);
    }

    const proveedor = this.proveedorRepository.create({
      nombre: normalized,
      activo: dto.activo !== undefined ? dto.activo : true,
    });

    return this.proveedorRepository.save(proveedor);
  }

  async update(id: number, dto: Partial<ProveedorDto>): Promise<Proveedor> {
    const proveedor = await this.findOne(id);
    if (!proveedor) {
      throw new Error(`Proveedor con id ${id} no encontrado.`);
    }

    if (dto.nombre) {
      proveedor.nombre = dto.nombre.trim().toLowerCase();
    }
    if (dto.activo !== undefined) {
      proveedor.activo = dto.activo;
    }

    return this.proveedorRepository.save(proveedor);
  }

  async delete(id: number): Promise<void> {
    const result = await this.proveedorRepository.delete(id);
    if (result.affected === 0) {
      throw new Error(`Proveedor con id ${id} no encontrado.`);
    }
  }

  async getOrCreate(nombre: string): Promise<Proveedor> {
    const normalized = nombre.trim().toLowerCase();
    let proveedor = await this.findByNombre(normalized);
    
    if (!proveedor) {
      proveedor = await this.create({ nombre: normalized, activo: true });
    }

    return proveedor;
  }
}
