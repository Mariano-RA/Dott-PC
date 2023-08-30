import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";

@Entity("Productos")
export class Producto {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("text")
  proveedor: string;

  @Column("text")
  producto: string;

  @Column("text")
  categoria: string;

  @Column("int")
  precio: number;
}
