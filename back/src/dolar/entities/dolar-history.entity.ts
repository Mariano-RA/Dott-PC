import { Proveedor } from "src/proveedor/entities/proveedor.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "DolarHistorial" })
export class DolarHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("int")
  proveedorId: number;

  @ManyToOne(() => Proveedor, { eager: true })
  @JoinColumn({ name: "proveedorId" })
  proveedor: Proveedor;

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
