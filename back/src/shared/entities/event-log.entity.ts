import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "event_logs" })
export class EventLog {
  @PrimaryGeneratedColumn()
  id: number;

  /** Fecha del evento (se setea automáticamente). */
  @CreateDateColumn({ type: "datetime", name: "created_at" })
  createdAt: Date;

  @Index()
  @Column({ type: "varchar", length: 10 })
  level: "info" | "warn" | "error";

  @Index()
  @Column({ type: "varchar", length: 64 })
  source: string;

  @Index()
  @Column({ type: "varchar", length: 64 })
  action: string;

  @Column({ type: "varchar", length: 500 })
  message: string;

  /** JSON serializado (evita dependencias de tipo JSON del driver/DB). */
  @Column({ type: "longtext", nullable: true })
  metaJson: string | null;
}

