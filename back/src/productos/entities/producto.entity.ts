import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from "typeorm";
import { Proveedor } from "../../proveedor/entities/proveedor.entity";

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

  @Column("text")
  categoria: string;

  @Column("int")
  precio: number;
}
