import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { EventLog } from "./entities/event-log.entity";

export type EventLogLevel = "info" | "warn" | "error";

export type EventLogEntry = {
  id: string | number;
  ts: string; // ISO
  level: EventLogLevel;
  source: string; // e.g. "productos", "dolar"
  action: string; // e.g. "import_queued"
  message: string;
  meta?: Record<string, any>;
};

function genId(): string {
  // good enough for in-memory log correlation
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

@Injectable()
export class EventLogService {
  private readonly maxEntries = 800;
  private readonly entries: EventLogEntry[] = [];

  constructor(
    @InjectRepository(EventLog)
    private readonly repo: Repository<EventLog>
  ) {}

  private pushInMemory(item: EventLogEntry) {
    this.entries.push(item);
    if (this.entries.length > this.maxEntries) {
      this.entries.splice(0, this.entries.length - this.maxEntries);
    }
  }

  async add(entry: Omit<EventLogEntry, "id" | "ts">) {
    // Persist first; if DB is down, still keep an in-memory event.
    try {
      const metaJson =
        entry.meta !== undefined ? JSON.stringify(entry.meta) : null;
      const saved = await this.repo.save(
        this.repo.create({
          level: entry.level,
          source: entry.source,
          action: entry.action,
          message: entry.message,
          metaJson,
        })
      );
      const item: EventLogEntry = {
        id: saved.id,
        ts: saved.createdAt.toISOString(),
        ...entry,
      };
      this.pushInMemory(item);
      return item;
    } catch {
      const item: EventLogEntry = {
        id: genId(),
        ts: new Date().toISOString(),
        ...entry,
      };
      this.pushInMemory(item);
      return item;
    }
  }

  info(source: string, action: string, message: string, meta?: Record<string, any>) {
    return this.add({ level: "info", source, action, message, meta });
  }

  warn(source: string, action: string, message: string, meta?: Record<string, any>) {
    return this.add({ level: "warn", source, action, message, meta });
  }

  error(source: string, action: string, message: string, meta?: Record<string, any>) {
    return this.add({ level: "error", source, action, message, meta });
  }

  async list(options?: {
    level?: EventLogLevel;
    source?: string;
    q?: string;
    limit?: number;
  }): Promise<EventLogEntry[]> {
    const level = options?.level?.trim();
    const source = options?.source?.trim();
    const q = (options?.q ?? "").trim().toLowerCase();
    const limitRaw = options?.limit ?? 200;
    const limit = Math.max(1, Math.min(500, Number(limitRaw) || 200));

    const qb = this.repo.createQueryBuilder("e").orderBy("e.id", "DESC").take(limit);
    if (level) qb.andWhere("e.level = :level", { level });
    if (source) qb.andWhere("e.source = :source", { source });
    if (q) {
      qb.andWhere(
        "(LOWER(e.message) LIKE :q OR LOWER(e.action) LIKE :q OR LOWER(e.source) LIKE :q OR LOWER(e.metaJson) LIKE :q)",
        { q: `%${q}%` }
      );
    }
    const rows = await qb.getMany();
    return rows.map((r) => ({
      id: r.id,
      ts: r.createdAt?.toISOString?.() ?? new Date().toISOString(),
      level: r.level,
      source: r.source,
      action: r.action,
      message: r.message,
      meta: r.metaJson ? JSON.parse(r.metaJson) : undefined,
    }));
  }
}

