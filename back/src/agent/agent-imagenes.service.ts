import { BadRequestException, ConflictException, Injectable, Logger } from "@nestjs/common";
import { ImageCacheProveedor } from "../imagenes/gallery.constants";
import { ImageCacheService } from "../imagenes/image-cache.service";
import { ProveedorService } from "../proveedor/proveedor.service";

/** Descargas de imágenes simultáneas. Fijo: lo decide el dueño del sistema, no el agente. */
export const CONCURRENCIA_IMAGENES = 5;

type ResultadoProveedor = {
  proveedor: string;
  procesadas: number;
  cacheadas: number;
  salteadas: number;
  errores: number;
  duracionSeg: number;
  error: string | null;
};

type EstadoTrabajo = {
  enCurso: boolean;
  iniciadoEn: string | null;
  terminadoEn: string | null;
  proveedores: string[];
  proveedorActual: string | null;
  resultados: ResultadoProveedor[];
};

const SIN_TRABAJO: EstadoTrabajo = {
  enCurso: false,
  iniciadoEn: null,
  terminadoEn: null,
  proveedores: [],
  proveedorActual: null,
  resultados: [],
};

/**
 * Cachea las imágenes de los proveedores que todavía no la tienen (nunca refresca las que ya están).
 * Un solo trabajo a la vez, un proveedor por vez y `CONCURRENCIA_IMAGENES` descargas en simultáneo.
 */
@Injectable()
export class AgentImagenesService {
  private readonly logger = new Logger(AgentImagenesService.name);
  /** En memoria: se pierde al reiniciar el backend. */
  private trabajo: EstadoTrabajo = { ...SIN_TRABAJO };

  constructor(
    private readonly imageCache: ImageCacheService,
    private readonly proveedorService: ProveedorService,
  ) {}

  async iniciar(proveedor?: string) {
    const nombre = proveedor?.trim().toLowerCase() || undefined;

    const disponibles = await this.proveedorService.findNombresCacheImagenes();
    if (nombre && !disponibles.includes(nombre)) {
      throw new BadRequestException(
        `Proveedor desconocido, inactivo o sin cache de imágenes: "${nombre}". Disponibles: ${disponibles.join(", ") || "ninguno"}.`,
      );
    }
    if (!nombre && disponibles.length === 0) {
      throw new BadRequestException("No hay proveedores activos con cache de imágenes.");
    }
    // Se revisa recién acá, después de las esperas, para que dos pedidos simultáneos no pasen los dos.
    if (this.trabajo.enCurso) {
      throw new ConflictException(
        `Ya hay un cacheo de imágenes en curso (proveedor actual: ${this.trabajo.proveedorActual ?? "-"}). Consultá el estado.`,
      );
    }

    const proveedores = nombre ? [nombre] : disponibles;
    this.trabajo = {
      enCurso: true,
      iniciadoEn: new Date().toISOString(),
      terminadoEn: null,
      proveedores,
      proveedorActual: null,
      resultados: [],
    };
    // En segundo plano: el pedido HTTP responde enseguida y el trabajo sigue.
    void this.ejecutar(proveedores);

    return {
      ok: true,
      proveedores,
      concurrencia: CONCURRENCIA_IMAGENES,
      mensaje: "Cacheo iniciado en segundo plano: solo imágenes que todavía no tienen cache, un proveedor por vez.",
      siguiente: "Consultá /agent/imagenes/estado para ver el avance.",
    };
  }

  estado() {
    const t = this.trabajo;
    let aviso: string | null = null;
    if (!t.iniciadoEn) {
      aviso = "Sin datos: todavía no se pidió ningún cacheo desde que arrancó el backend.";
    }
    return {
      enCurso: t.enCurso,
      iniciadoEn: t.iniciadoEn,
      terminadoEn: t.terminadoEn,
      proveedorActual: t.proveedorActual,
      pendientes: t.enCurso
        ? t.proveedores.filter((p) => p !== t.proveedorActual && !t.resultados.some((r) => r.proveedor === p))
        : [],
      resultados: t.resultados,
      resumen: this.armarResumen(t),
      aviso,
    };
  }

  private async ejecutar(proveedores: string[]) {
    for (const proveedor of proveedores) {
      this.trabajo.proveedorActual = proveedor;
      const inicio = Date.now();
      try {
        const r = await this.imageCache.cacheProveedorImages({
          proveedor: proveedor as ImageCacheProveedor,
          processAll: true,
          onlyMissing: true,
          concurrency: CONCURRENCIA_IMAGENES,
        });
        this.trabajo.resultados.push({
          proveedor,
          procesadas: r.processed,
          cacheadas: r.cached,
          salteadas: r.skipped,
          errores: r.errors,
          duracionSeg: Math.round(r.durationMs / 1000),
          error: null,
        });
      } catch (e: any) {
        this.logger.error(`Falló el cacheo de imágenes de ${proveedor}: ${String(e?.message ?? e)}`);
        this.trabajo.resultados.push({
          proveedor,
          procesadas: 0,
          cacheadas: 0,
          salteadas: 0,
          errores: 0,
          duracionSeg: Math.round((Date.now() - inicio) / 1000),
          error: "Falló el cacheo (ver logs del backend).",
        });
      }
    }
    this.trabajo.proveedorActual = null;
    this.trabajo.enCurso = false;
    this.trabajo.terminadoEn = new Date().toISOString();
  }

  private armarResumen(t: EstadoTrabajo): string {
    if (!t.iniciadoEn) return "Sin cacheos todavía.";
    const partes = t.resultados.map((r) =>
      r.error
        ? `${r.proveedor}: ERROR (${r.error})`
        : `${r.proveedor}: ${r.cacheadas} cacheadas, ${r.salteadas} ya tenían, ${r.errores} con error (${r.duracionSeg}s)`,
    );
    if (t.enCurso) {
      partes.push(`en curso: ${t.proveedorActual ?? "preparando"}`);
      return partes.join("; ");
    }
    return partes.length > 0 ? partes.join("; ") : "Terminó sin resultados.";
  }
}
