import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity({ name: "Proveedores" })
export class Proveedor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("text", { unique: true })
  nombre: string;

  @Column("boolean", { default: true })
  activo: boolean;

  @CreateDateColumn({ type: "datetime" })
  createdAt: Date;

  @UpdateDateColumn({ type: "datetime" })
  updatedAt: Date;
}
