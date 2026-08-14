import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity({ name: "CalculatorSettings" })
export class CalculatorSetting {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("float", { default: 1.8 })
  cardFee: number;

  @Column("float", { default: 6 })
  advanceFee: number;

  @Column("float", { default: 21 })
  vat: number;

  /** Pasarela usada para mostrar cuotas en catálogo, detalle y carrito. */
  @Column("varchar", { length: 64, nullable: true })
  displayGatewayKey: string | null;

  /** Configuración por pasarela. JSON: { [key]: { label, costs, vat, plans } } */
  @Column("simple-json", { nullable: true })
  gateways: Record<string, unknown> | null;

  @CreateDateColumn({ type: "datetime" })
  createdAt: Date;

  @UpdateDateColumn({ type: "datetime" })
  updatedAt: Date;
}
