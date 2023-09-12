import {
  Entity,
  Column,
  PrimaryColumn,
  Double,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity({ name: "Dolares" })
export class Dolar {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("float")
  precioDolar: number;
}
