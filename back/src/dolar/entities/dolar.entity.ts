import { Proveedor } from "src/proveedor/entities/proveedor.entity";
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";

@Entity({ name: "Dolares" })
export class Dolar {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("float")
  precioDolar: number;

  @Column("int")
  proveedorId: number;

  @ManyToOne(() => Proveedor, { eager: true })
  @JoinColumn({ name: "proveedorId" })
  proveedor: Proveedor;
}
