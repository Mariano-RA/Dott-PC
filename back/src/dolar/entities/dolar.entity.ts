import {
  Entity,
  Column,
  PrimaryColumn,
  Double,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity("Dolares")
export class Dolar {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("float")
  precioDolar: number;
}
