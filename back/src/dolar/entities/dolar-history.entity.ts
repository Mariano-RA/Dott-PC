import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "DolarHistorial" })
export class DolarHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("text")
  proveedor: string;

  @Column("float")
  precioDolar: number;

  @Column("datetime")
  fechaVigencia: Date;

  @Column("text", { nullable: true })
  usuario: string | null;

  @Column("text", { nullable: true })
  motivo: string | null;

  @CreateDateColumn({ type: "datetime" })
  createdAt: Date;
}
