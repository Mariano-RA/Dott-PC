import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "Users" })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("text")
  email: string;

  @Column("text")
  hash: string;

  @Column({ type: "text", nullable: true })
  hashedRt!: string;
}
