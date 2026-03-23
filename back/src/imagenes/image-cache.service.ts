import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Logger } from "nestjs-pino";
import { In, Repository } from "typeorm";
import { Proveedor } from "../proveedor/entities/proveedor.entity";
import { Producto } from "../productos/entities/producto.entity";
import { ProductImage } from "./entities/product-image.entity";
import { MinioStorageService } from "./minio-storage.service";
import * as sharp from "sharp";

const DEFAULT_TTL_HOURS = 24 * 7; // 7 días
const DEFAULT_CONCURRENCY = 10;
const BATCH_SIZE = 500; // productos por consulta cuando se cachea "todo"

/** Ejecuta tareas con un máximo de `concurrency` en paralelo. */
async function runWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const chunk = items.slice(i, i + concurrency);
    const chunkResults = await Promise.all(chunk.map(fn));
    results.push(...chunkResults);
  }
  return results;
}

function normalizeCode(value: unknown): string {
  return String(value ?? "").trim();
}

function guessMimeTypeFromBytes(bytes: Buffer): string | null {
  if (!bytes || bytes.length < 12) return null;

  // WEBP: RIFF....WEBP
  if (
    bytes[0] === 0x52 && // R
    bytes[1] === 0x49 && // I
    bytes[2] === 0x46 && // F
    bytes[3] === 0x46 && // F
    bytes[8] === 0x57 && // W
    bytes[9] === 0x45 && // E
    bytes[10] === 0x42 && // B
    bytes[11] === 0x50 // P
  ) {
    return "image/webp";
  }

  // PNG signature: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }

  // JPEG signature: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }

  // GIF: GIF87a / GIF89a
  const header = bytes.slice(0, 6).toString("ascii");
  if (header === "GIF87a" || header === "GIF89a") return "image/gif";

  return null;
}

function guessExtensionFromMime(mime: string | null): string {
  const m = (mime || "").toLowerCase();
  if (m.includes("image/webp")) return "webp";
  if (m.includes("image/png")) return "png";
  if (m.includes("image/jpeg")) return "jpg";
  if (m.includes("image/gif")) return "gif";
  return "img";
}

async function tryCompressToWebp(input: Buffer): Promise<Buffer | null> {
  try {
    const out = await sharp(input)
      .rotate()
      .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
    return out;
  } catch {
    return null;
  }
}

@Injectable()
export class ImageCacheService {
  constructor(
    @InjectRepository(Producto)
    private readonly productoRepo: Repository<Producto>,
    @InjectRepository(Proveedor)
    private readonly proveedorRepo: Repository<Proveedor>,
    @InjectRepository(ProductImage)
    private readonly productImageRepo: Repository<ProductImage>,
    private readonly storage: MinioStorageService,
    private readonly logger: Logger
  ) {}

  private async getProveedorId(nombre: string): Promise<number | null> {
    const p = await this.proveedorRepo.findOneBy({ nombre: nombre.trim().toLowerCase() });
    return p?.id ?? null;
  }

  async cacheProveedorImages(options: {
    proveedor: "elit" | "nb" | "eikon" | "mega" | "air";
    limit?: number;
    force?: boolean;
    ttlHours?: number;
    concurrency?: number;
    processAll?: boolean;
  }) {
    const proveedorId = await this.getProveedorId(options.proveedor);
    if (!proveedorId) {
      return { proveedor: options.proveedor, processed: 0, cached: 0, skipped: 0, errors: 0, durationMs: 0 };
    }

    const processAll = Boolean(options.processAll);
    const limit =
      processAll
        ? 0
        : Number.isFinite(options.limit) && (options.limit as number) > 0
          ? Math.min((options.limit as number), 10000)
          : 200;
    const ttlHours =
      Number.isFinite(options.ttlHours) && (options.ttlHours as number) > 0
        ? (options.ttlHours as number)
        : DEFAULT_TTL_HOURS;
    const force = Boolean(options.force);
    const concurrency = Number.isFinite(options.concurrency) && (options.concurrency as number) > 0
      ? Math.min((options.concurrency as number), 20)
      : DEFAULT_CONCURRENCY;
    const ttlMs = ttlHours * 60 * 60 * 1000;

    const startMs = Date.now();
    const productos: Producto[] = [];

    if (processAll) {
      let skip = 0;
      while (true) {
        const page = await this.productoRepo.find({
          where: { proveedorId },
          take: BATCH_SIZE,
          skip,
          order: { id: "ASC" },
        });
        if (page.length === 0) break;
        productos.push(...page);
        if (page.length < BATCH_SIZE) break;
        skip += BATCH_SIZE;
      }
    } else {
      const page = await this.productoRepo.find({
        where: { proveedorId },
        take: limit,
        order: { id: "DESC" },
      });
      productos.push(...page);
    }

    const existingByCodigo = new Map<string, ProductImage>();
    if (productos.length > 0) {
      const codigos = [...new Set(productos.map((p) => normalizeCode((p as any).codigo)).filter(Boolean))];
      const chunkSize = 1000;
      for (let i = 0; i < codigos.length; i += chunkSize) {
        const chunk = codigos.slice(i, i + chunkSize);
        const existingList = await this.productImageRepo.find({
          where: { proveedorId, codigo: In(chunk) },
        });
        existingList.forEach((e) => existingByCodigo.set(e.codigo, e));
      }
    }

    type WorkItem = {
      prod: Producto;
      codigo: string;
      url: string;
      existing: ProductImage | null;
    };

    const toProcess: WorkItem[] = [];
    let skipped = 0;

    const seenCodes = new Set<string>();
    for (const prod of productos) {
      const codigo = normalizeCode((prod as any).codigo);
      const url = String((prod as any).imagenUrl ?? "").trim();
      if (!codigo || !url) {
        skipped++;
        continue;
      }
      if (seenCodes.has(codigo)) {
        skipped++;
        continue;
      }
      seenCodes.add(codigo);

      const existing = existingByCodigo.get(codigo) ?? null;
      if (!force && existing?.lastFetchedAt) {
        const age = Date.now() - new Date(existing.lastFetchedAt).getTime();
        if (age >= 0 && age < ttlMs) {
          skipped++;
          continue;
        }
      }

      toProcess.push({ prod, codigo, url, existing });
    }

    let cached = 0;
    let errors = 0;

    await runWithConcurrency(toProcess, concurrency, async (item) => {
      const { codigo, url, existing } = item;
      try {
        const r = await fetch(url, { method: "GET" });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);

        const contentType = r.headers.get("content-type");
        const etag = r.headers.get("etag");
        const bufU8 = new Uint8Array(await r.arrayBuffer());
        const buf = Buffer.from(bufU8);

        const compressedWebp = await tryCompressToWebp(buf);
        const mimeType =
          compressedWebp
            ? "image/webp"
            : guessMimeTypeFromBytes(buf) || contentType || "application/octet-stream";
        const ext = compressedWebp ? "webp" : guessExtensionFromMime(mimeType);

        const key = `${options.proveedor}/${encodeURIComponent(codigo)}/main.${ext}`;
        const bodyBytes = compressedWebp ? compressedWebp : buf;

        await this.storage.putObject({
          key,
          body: new Uint8Array(bodyBytes),
          contentType: mimeType.includes("image/") ? mimeType : null,
        });

        const record = existing
          ? this.productImageRepo.merge(existing, {
              storageKey: key,
              sourceUrl: url,
              mimeType,
              sizeBytes: bodyBytes.byteLength,
              etag,
              lastFetchedAt: new Date(),
            })
          : this.productImageRepo.create({
              proveedorId,
              codigo,
              storageKey: key,
              sourceUrl: url,
              mimeType,
              sizeBytes: bodyBytes.byteLength,
              etag,
              lastFetchedAt: new Date(),
            });

        await this.productImageRepo.save(record);
        cached++;
      } catch (e: any) {
        errors++;
        this.logger.warn(
          {
            proveedor: options.proveedor,
            proveedorId,
            codigo,
            url,
            err: String(e?.message ?? e),
          },
          "No se pudo cachear imagen"
        );
      }
    });

    const durationMs = Date.now() - startMs;
    const processed = productos.length;
    this.logger.log(
      {
        proveedor: options.proveedor,
        processed,
        cached,
        skipped,
        errors,
        durationMs,
      },
      "Cache de imágenes finalizado"
    );

    return {
      proveedor: options.proveedor,
      processed,
      cached,
      skipped,
      errors,
      durationMs,
    };
  }
}

