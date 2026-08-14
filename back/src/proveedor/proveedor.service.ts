import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Proveedor } from "./entities/proveedor.entity";
import { ProveedorDto } from "./dto/proveedor.dto";
import {
  hasFetcher,
  hasImageCache,
  hasManualUpload,
  normalizeProveedorNombre,
} from "./proveedor.capabilities";

export type ProveedorView = {
  id: number;
  nombre: string;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
  tieneFetcher: boolean;
  cargaManual: boolean;
  cacheImagenes: boolean;
};

@Injectable()
export class ProveedorService {
  constructor(
    @InjectRepository(Proveedor)
    private readonly proveedorRepository: Repository<Proveedor>
  ) {}

  toView(proveedor: Proveedor): ProveedorView {
    const nombre = normalizeProveedorNombre(proveedor.nombre);
    return {
      id: proveedor.id,
      nombre,
      activo: proveedor.activo !== false,
      createdAt: proveedor.createdAt,
      updatedAt: proveedor.updatedAt,
      tieneFetcher: hasFetcher(nombre),
      cargaManual: hasManualUpload(nombre),
      cacheImagenes: hasImageCache(nombre),
    };
  }

  async findAll(): Promise<Proveedor[]> {
    return this.proveedorRepository.find({ order: { nombre: "ASC" } });
  }

  async findAllViews(): Promise<ProveedorView[]> {
    const rows = await this.findAll();
    return rows.map((row) => this.toView(row));
  }

  async findActivos(): Promise<Proveedor[]> {
    return this.proveedorRepository.find({
      where: { activo: true },
      order: { nombre: "ASC" },
    });
  }

  async findNombresDescargaAutomatica(): Promise<string[]> {
    const activos = await this.findActivos();
    return activos
      .map((p) => normalizeProveedorNombre(p.nombre))
      .filter((n) => n && hasFetcher(n));
  }

  async findNombresCacheImagenes(): Promise<string[]> {
    const activos = await this.findActivos();
    return activos
      .map((p) => normalizeProveedorNombre(p.nombre))
      .filter((n) => n && hasImageCache(n));
  }

  async canDescargaAutomatica(nombre: string): Promise<boolean> {
    const proveedor = await this.findByNombre(nombre);
    return Boolean(proveedor?.activo && hasFetcher(proveedor.nombre));
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
