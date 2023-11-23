import { Producto } from "src/productos/entities/producto.entity";
import {
  Entity,
  Column,
  PrimaryColumn,
  Double,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
} from "typeorm";

@Entity({ name: "Dolares" })
export class Dolar {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("float")
  precioDolar: number;

  @Column("text")
  proveedor: string;
}
