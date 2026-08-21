import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { Proveedor } from "../../proveedor/entities/proveedor.entity";

@Index("idx_productos_proveedorId", ["proveedorId"])
@Entity({ name: "Productos" })
export class Producto {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  proveedorId: number;

  @ManyToOne(() => Proveedor)
  @JoinColumn({ name: 'proveedorId' })
  proveedor: Proveedor;

  @Column("text")
  producto: string;

  @Column("text", { nullable: true })
  categoria: string;

  @Column("int")
  precio: number;

  @Column({ type: "varchar", length: 255, nullable: true })
  codigo: string | null;

  @Column("text", { nullable: true })
  imagenUrl: string | null;

  @Column("text", { nullable: true })
  descripcion: string | null;

  /** Specs clave-valor, tipicamente [{nombre, valor}] (Elit). */
  @Column({ type: "json", nullable: true })
  atributos: Array<{ nombre: string; valor: string }> | null;
}
