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

  /** Configuración por pasarela. JSON: { [key]: { costs: [{ id, label, value }], vat, plans: [{ planKey, label, rate }] } } */
  @Column("simple-json", { nullable: true })
  gateways: Record<string, unknown> | null;

  @CreateDateColumn({ type: "datetime" })
  createdAt: Date;

  @UpdateDateColumn({ type: "datetime" })
  updatedAt: Date;
}
