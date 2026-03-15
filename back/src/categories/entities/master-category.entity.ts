import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity({ name: "master_categories" })
export class MasterCategory {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  @Column({ type: "varchar", length: 100, unique: true })
  slug: string;

  @Column({ type: "varchar", length: 190, unique: true })
  name: string;

  @CreateDateColumn({ type: "datetime" })
  createdAt: Date;

  @UpdateDateColumn({ type: "datetime" })
  updatedAt: Date;
}

