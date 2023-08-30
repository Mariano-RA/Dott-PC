import { Entity, Column, PrimaryColumn, Double } from "typeorm";

@Entity("Cuotas")
export class Cuota {
  @PrimaryColumn("int")
  id: number;

  @Column("float")
  valorTarjeta: number;
}
