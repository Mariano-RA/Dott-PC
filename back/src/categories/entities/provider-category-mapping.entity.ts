import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { CategoryProvider } from "./category-provider.entity";
import { MasterCategory } from "./master-category.entity";

@Entity({ name: "provider_category_mappings" })
@Index(["provider", "providerCategoryKey"], { unique: true })
export class ProviderCategoryMapping {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  @ManyToOne(() => CategoryProvider, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "provider_id" })
  provider: CategoryProvider;

  @Column({ type: "varchar", length: 255 })
  providerCategoryKey: string;

  /** Nombre de un producto con el que llegó esta categoría raw (para mostrar como ejemplo en el admin). */
  @Column({ type: "varchar", length: 500, nullable: true })
  exampleProduct: string | null;

  @ManyToOne(() => MasterCategory, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "master_category_id" })
  masterCategory: MasterCategory | null;

  @CreateDateColumn({ type: "datetime" })
  createdAt: Date;

  @UpdateDateColumn({ type: "datetime" })
  updatedAt: Date;
}

