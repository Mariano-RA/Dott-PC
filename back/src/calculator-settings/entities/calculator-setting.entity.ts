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

  @CreateDateColumn({ type: "datetime" })
  createdAt: Date;

  @UpdateDateColumn({ type: "datetime" })
  updatedAt: Date;
}
