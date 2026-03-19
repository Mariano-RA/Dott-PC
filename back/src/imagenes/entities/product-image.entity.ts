import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity({ name: "ProductImages" })
@Index(["proveedorId", "codigo"], { unique: true })
export class ProductImage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("int")
  proveedorId: number;

  @Column("varchar", { length: 128 })
  codigo: string;

  /**
   * Path/Key dentro del bucket en MinIO.
   * Ej: "elit/18667/main.webp"
   */
  @Column("varchar", { length: 512 })
  storageKey: string;

  @Column("varchar", { length: 1024, nullable: true })
  sourceUrl?: string | null;

  @Column("varchar", { length: 255, nullable: true })
  mimeType?: string | null;

  @Column("int", { nullable: true })
  sizeBytes?: number | null;

  @Column("varchar", { length: 128, nullable: true })
  etag?: string | null;

  @Column("datetime", { nullable: true })
  lastFetchedAt?: Date | null;

  @CreateDateColumn({ type: "datetime" })
  createdAt: Date;

  @UpdateDateColumn({ type: "datetime" })
  updatedAt: Date;
}

