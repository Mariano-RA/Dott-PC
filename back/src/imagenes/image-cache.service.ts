import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Logger } from "nestjs-pino";
import { In, Repository } from "typeorm";
import { Proveedor } from "../proveedor/entities/proveedor.entity";
import { Producto } from "../productos/entities/producto.entity";
import { ProductImage } from "./entities/product-image.entity";
import { ProductImageSource } from "./entities/product-image-source.entity";
import { MinioStorageService } from "./minio-storage.service";
import {
  ImageCacheProveedor,
  MAX_GALLERY_IMAGES,
  normalizeImageUrls,
  supportsGallery,
} from "./gallery.constants";
import * as sharp from "sharp";

const DEFAULT_TTL_HOURS = 24 * 7; // 7 días
const DEFAULT_CONCURRENCY = 10;
const BATCH_SIZE = 500;
const AIR_MAS_INFO_URL = "https://www.air-intra.com/2025/ar/mas_info.php";
const FETCH_TIMEOUT_MS = 20_000;
const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36";

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
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
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
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
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

function looksLikeHtml(text: string): boolean {
  const head = (text || "").trimStart().slice(0, 256).toLowerCase();
  return head.startsWith("<!") || head.startsWith("<html") || head.startsWith("<!--") || head.startsWith("<");
}

function isAirPlaceholderImage(uri: string): boolean {
  const path = uri.split("?")[0].toLowerCase();
  return path.endsWith("/nd.png") || path.endsWith("nd.png");
}

async function resolveAirImageUrls(codigo: string): Promise<string[]> {
  const url = `${AIR_MAS_INFO_URL}?codiart=${encodeURIComponent(codigo)}`;
  const r = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "User-Agent": DEFAULT_USER_AGENT,
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!r.ok) throw new Error(`mas_info HTTP ${r.status}`);

  const text = await r.text();
  if (looksLikeHtml(text)) throw new Error("mas_info devolvió HTML");

  let payload: any;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error("mas_info JSON inválido");
  }

  const imgs = Array.isArray(payload?.imgs) ? payload.imgs : [];
  const urls: string[] = [];
  const seen = new Set<string>();
  for (const img of imgs) {
    const uri = String(img?.uri ?? img?.url ?? "").trim();
    if (!uri || isAirPlaceholderImage(uri) || seen.has(uri)) continue;
    seen.add(uri);
    urls.push(uri);
    if (urls.length >= MAX_GALLERY_IMAGES) break;
  }
  return urls;
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

function pickPrimary(records: ProductImage[] | undefined): ProductImage | null {
  if (!records?.length) return null;
  return records.find((r) => r.isPrimary) || records.find((r) => r.sortOrder === 0) || records[0];
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
    @InjectRepository(ProductImageSource)
    private readonly productImageSourceRepo: Repository<ProductImageSource>,
    private readonly storage: MinioStorageService,
    private readonly logger: Logger
  ) {}

  private async getProveedorId(nombre: string): Promise<number | null> {
    const p = await this.proveedorRepo.findOneBy({ nombre: nombre.trim().toLowerCase() });
    return p?.id ?? null;
  }

  async replaceGallerySources(
    proveedorId: number,
    items: Array<{ codigo: string; urls: string[] }>
  ) {
    await this.productImageSourceRepo.delete({ proveedorId });
    const rows: Partial<ProductImageSource>[] = [];
    for (const item of items) {
      const codigo = normalizeCode(item.codigo);
      const urls = normalizeImageUrls(item.urls);
      if (!codigo || urls.length === 0) continue;
      urls.forEach((sourceUrl, sortOrder) => {
        rows.push({ proveedorId, codigo, sortOrder, sourceUrl });
      });
    }
    const chunkSize = 500;
    for (let i = 0; i < rows.length; i += chunkSize) {
      await this.productImageSourceRepo.save(this.productImageSourceRepo.create(rows.slice(i, i + chunkSize)));
    }
  }

  async cacheProveedorImages(options: {
    proveedor: ImageCacheProveedor;
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
    const gallery = supportsGallery(options.proveedor);
    const isAir = options.proveedor === "air";

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

    const existingByCodigo = new Map<string, ProductImage[]>();
    const sourcesByCodigo = new Map<string, string[]>();
    if (productos.length > 0) {
      const codigos = [...new Set(productos.map((p) => normalizeCode((p as any).codigo)).filter(Boolean))];
      const chunkSize = 1000;
      for (let i = 0; i < codigos.length; i += chunkSize) {
        const chunk = codigos.slice(i, i + chunkSize);
        const existingList = await this.productImageRepo.find({
          where: { proveedorId, codigo: In(chunk) },
        });
        existingList.forEach((e) => {
          const list = existingByCodigo.get(e.codigo) ?? [];
          list.push(e);
          existingByCodigo.set(e.codigo, list);
        });
        if (gallery && !isAir) {
          const sources = await this.productImageSourceRepo.find({
            where: { proveedorId, codigo: In(chunk) },
            order: { sortOrder: "ASC" },
          });
          sources.forEach((s) => {
            const list = sourcesByCodigo.get(s.codigo) ?? [];
            list.push(s.sourceUrl);
            sourcesByCodigo.set(s.codigo, list);
          });
        }
      }
    }

    type WorkItem = {
      prod: Producto;
      codigo: string;
      urls: string[];
      existing: ProductImage[];
    };

    const toProcess: WorkItem[] = [];
    let skipped = 0;

    const seenCodes = new Set<string>();
    for (const prod of productos) {
      const codigo = normalizeCode((prod as any).codigo);
      const fallbackUrl = String((prod as any).imagenUrl ?? "").trim();
      if (!codigo) {
        skipped++;
        continue;
      }
      if (seenCodes.has(codigo)) {
        skipped++;
        continue;
      }
      seenCodes.add(codigo);

      const sourceUrls = sourcesByCodigo.get(codigo) ?? [];
      const urls = sourceUrls.length > 0 ? sourceUrls : fallbackUrl ? [fallbackUrl] : [];
      if (!isAir && urls.length === 0) {
        skipped++;
        continue;
      }

      const existing = existingByCodigo.get(codigo) ?? [];
      const primary = pickPrimary(existing);
      const expectedCount = isAir ? null : urls.length;
      if (!force && primary?.lastFetchedAt) {
        const age = Date.now() - new Date(primary.lastFetchedAt).getTime();
        const enough = expectedCount == null || existing.length >= expectedCount;
        if (age >= 0 && age < ttlMs && enough) {
          skipped++;
          continue;
        }
      }

      toProcess.push({ prod, codigo, urls, existing });
    }

    let cached = 0;
    let errors = 0;

    await runWithConcurrency(toProcess, concurrency, async (item) => {
      const { prod, codigo, existing } = item;
      let urls = item.urls;
      try {
        if (isAir) {
          urls = await resolveAirImageUrls(codigo);
          if (urls.length === 0) {
            skipped++;
            return;
          }
        }

        const existingByOrder = new Map<number, ProductImage>();
        existing.forEach((e) => existingByOrder.set(Number(e.sortOrder ?? 0), e));

        let cachedAny = false;
        let imageErrors = 0;
        for (let sortOrder = 0; sortOrder < urls.length; sortOrder++) {
          const url = urls[sortOrder];
          const current = existingByOrder.get(sortOrder) ?? null;
          try {
            await this.cacheOneImage({
              proveedor: options.proveedor,
              proveedorId,
              codigo,
              url,
              sortOrder,
              existing: current,
            });
            cachedAny = true;
          } catch (e: any) {
            imageErrors++;
            this.logger.warn(
              {
                proveedor: options.proveedor,
                proveedorId,
                codigo,
                url,
                sortOrder,
                err: String(e?.message ?? e),
              },
              "No se pudo cachear imagen"
            );
          }
        }
        if (imageErrors > 0 && !cachedAny) {
          errors++;
          return;
        }

        if (isAir && urls[0] && prod.imagenUrl !== urls[0]) {
          prod.imagenUrl = urls[0];
          await this.productoRepo.save(prod);
        }

        await this.removeStaleImages(existing, urls.length);

        if (cachedAny) cached++;
      } catch (e: any) {
        errors++;
        this.logger.warn(
          {
            proveedor: options.proveedor,
            proveedorId,
            codigo,
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

  private async cacheOneImage(params: {
    proveedor: ImageCacheProveedor;
    proveedorId: number;
    codigo: string;
    url: string;
    sortOrder: number;
    existing: ProductImage | null;
  }): Promise<boolean> {
    const { proveedor, proveedorId, codigo, url, sortOrder, existing } = params;
    const r = await fetch(url, {
      method: "GET",
      headers: { "User-Agent": DEFAULT_USER_AGENT },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status} (${url})`);

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
    const key = `${proveedor}/${encodeURIComponent(codigo)}/${sortOrder}.${ext}`;
    const bodyBytes = compressedWebp ? compressedWebp : buf;

    await this.storage.putObject({
      key,
      body: new Uint8Array(bodyBytes),
      contentType: mimeType.includes("image/") ? mimeType : null,
    });

    const patch = {
      storageKey: key,
      sourceUrl: url,
      mimeType,
      sizeBytes: bodyBytes.byteLength,
      etag,
      lastFetchedAt: new Date(),
      sortOrder,
      isPrimary: sortOrder === 0,
    };

    const record = existing
      ? this.productImageRepo.merge(existing, patch)
      : this.productImageRepo.create({
          proveedorId,
          codigo,
          ...patch,
        });

    await this.productImageRepo.save(record);

    if (existing?.storageKey && existing.storageKey !== key) {
      try {
        await this.storage.deleteObject(existing.storageKey);
      } catch {
        // ignore leftover object
      }
    }
    return true;
  }

  private async removeStaleImages(existing: ProductImage[], keepCount: number) {
    const stale = existing.filter((e) => Number(e.sortOrder ?? 0) >= keepCount);
    for (const img of stale) {
      try {
        if (img.storageKey) await this.storage.deleteObject(img.storageKey);
      } catch {
        // ignore
      }
      await this.productImageRepo.remove(img);
    }
  }
}
