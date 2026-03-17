import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from "typeorm";

@Entity({ name: "CuotaPlanes" })
@Unique(["planKey"])
export class CuotaPlan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("varchar", { length: 64 })
  planKey: string;

  @Column("varchar", { length: 120 })
  label: string;

  @Column("float")
  tasa: number;

  @Column("boolean", { default: true })
  activo: boolean;

  @Column("int", { default: 0 })
  orden: number;

  @CreateDateColumn({ type: "datetime" })
  createdAt: Date;

  @UpdateDateColumn({ type: "datetime" })
  updatedAt: Date;
}
