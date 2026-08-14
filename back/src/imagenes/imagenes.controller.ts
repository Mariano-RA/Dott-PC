import { Controller, Get, Param, Query, Res } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Response } from "express";
import { Repository } from "typeorm";
import { Proveedor } from "../proveedor/entities/proveedor.entity";
import { MinioStorageService } from "./minio-storage.service";
import { ImageCacheService } from "./image-cache.service";
import { ProductImage } from "./entities/product-image.entity";
import { IMAGE_CACHE_PROVIDERS } from "./gallery.constants";

function guessMimeTypeFromKey(key: string): string {
  const lower = String(key || "").toLowerCase();
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".gif")) return "image/gif";
  return "application/octet-stream";
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

@Controller("imagenes")
export class ImagenesController {
  constructor(
    private readonly imageCache: ImageCacheService,
    private readonly storage: MinioStorageService,
    @InjectRepository(ProductImage)
    private readonly productImageRepo: Repository<ProductImage>,
    @InjectRepository(Proveedor)
    private readonly proveedorRepo: Repository<Proveedor>
  ) {}

  /** Cachea imágenes de todos los proveedores. Ej: GET /imagenes/cache?all=true&concurrency=10 */
  @Get("cache")
  cacheAll(
    @Query("limit") limit?: string,
    @Query("force") force?: string,
    @Query("concurrency") concurrency?: string,
    @Query("all") all?: string
  ) {
    const processAll = String(all || "").toLowerCase() === "true" || String(limit || "").toLowerCase() === "all";
    const limitNum = processAll ? undefined : (limit ? Number(limit) : undefined);
    const opts = {
      limit: limitNum,
      force: String(force || "").toLowerCase() === "true",
      concurrency: concurrency ? Number(concurrency) : undefined,
      processAll,
    };
    return Promise.all(
      IMAGE_CACHE_PROVIDERS.map((proveedor) =>
        this.imageCache.cacheProveedorImages({ ...opts, proveedor })
      )
    );
  }

  @Get("cache/:proveedor")
  cacheProveedor(
    @Param("proveedor") proveedor: string,
    @Query("limit") limit?: string,
    @Query("force") force?: string,
    @Query("concurrency") concurrency?: string,
    @Query("all") all?: string
  ) {
    const p = (proveedor || "").trim().toLowerCase();
    if (!IMAGE_CACHE_PROVIDERS.includes(p as any)) {
      return { ok: false, error: "Proveedor no soportado para cache (elit/nb/eikon/mega/air)." };
    }

    const processAll = String(all || "").toLowerCase() === "true" || String(limit || "").toLowerCase() === "all";
    const limitNum = processAll ? undefined : (limit ? Number(limit) : undefined);

    return this.imageCache.cacheProveedorImages({
      proveedor: p as (typeof IMAGE_CACHE_PROVIDERS)[number],
      limit: limitNum,
      force: String(force || "").toLowerCase() === "true",
      concurrency: concurrency ? Number(concurrency) : undefined,
      processAll,
    });
  }

  @Get(":proveedor/:codigo/meta")
  async getImagenMeta(
    @Param("proveedor") proveedor: string,
    @Param("codigo") codigo: string
  ) {
    const resolved = await this.findRecords(proveedor, codigo);
    if (!resolved) return { count: 0, images: [] };
    const { proveedorNombre, records } = resolved;
    return {
      proveedor: proveedorNombre,
      codigo: String(codigo || "").trim(),
      count: records.length,
      images: records.map((r) => ({
        index: Number(r.sortOrder ?? 0),
        url: `/imagenes/${encodeURIComponent(proveedorNombre)}/${encodeURIComponent(String(codigo).trim())}/${Number(r.sortOrder ?? 0)}`,
      })),
    };
  }

  @Get(":proveedor/:codigo/:index")
  async getImagenByIndex(
    @Param("proveedor") proveedor: string,
    @Param("codigo") codigo: string,
    @Param("index") index: string,
    @Res() res: Response
  ) {
    const sortOrder = Number(index);
    if (!Number.isInteger(sortOrder) || sortOrder < 0) {
      return res.status(400).json({ error: "Índice inválido" });
    }
    return this.sendImage(res, proveedor, codigo, sortOrder);
  }

  @Get(":proveedor/:codigo")
  async getImagen(
    @Param("proveedor") proveedor: string,
    @Param("codigo") codigo: string,
    @Res() res: Response
  ) {
    return this.sendImage(res, proveedor, codigo, 0);
  }

  private async findRecords(proveedor: string, codigo: string) {
    const p = (proveedor || "").trim().toLowerCase();
    const code = String(codigo || "").trim();
    if (!p || !code) return null;

    const prov = await this.proveedorRepo.findOneBy({ nombre: p });
    if (!prov) return null;

    const records = await this.productImageRepo.find({
      where: { proveedorId: prov.id, codigo: code },
      order: { sortOrder: "ASC" },
    });
    if (!records.length) return null;
    return { proveedorNombre: p, records };
  }

  private async sendImage(res: Response, proveedor: string, codigo: string, sortOrder: number) {
    const resolved = await this.findRecords(proveedor, codigo);
    if (!resolved) return res.status(404).end();

    const record =
      resolved.records.find((r) => Number(r.sortOrder ?? 0) === sortOrder) ||
      (sortOrder === 0
        ? resolved.records.find((r) => r.isPrimary) || resolved.records[0]
        : null);
    if (!record) return res.status(404).end();

    const obj = await this.storage.getObject(record.storageKey);
    const body: any = obj.Body;
    const bytes = body
      ? Buffer.from(await body.transformToByteArray())
      : Buffer.alloc(0);

    const inferredMime =
      record.mimeType || guessMimeTypeFromBytes(bytes) || guessMimeTypeFromKey(record.storageKey);

    res.setHeader("Content-Type", inferredMime);
    res.setHeader("Content-Disposition", "inline");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");

    return res.send(bytes);
  }
}
