import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

/** URLs de galería declaradas por el listado (Elit). AIR se resuelve en el job de cache. */
@Entity({ name: "ProductImageSources" })
@Index("IDX_product_image_sources_prov_codigo_order", ["proveedorId", "codigo", "sortOrder"], {
  unique: true,
})
export class ProductImageSource {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("int")
  proveedorId: number;

  @Column("varchar", { length: 128 })
  codigo: string;

  @Column("int", { default: 0 })
  sortOrder: number;

  @Column("varchar", { length: 1024 })
  sourceUrl: string;

  @CreateDateColumn({ type: "datetime" })
  createdAt: Date;

  @UpdateDateColumn({ type: "datetime" })
  updatedAt: Date;
}
