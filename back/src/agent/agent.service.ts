import { BadRequestException, HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { FetchPricesTriggerService } from "../productos/fetch-prices-trigger.service";
import { ImportStatus, ImportStatusService } from "../productos/import-status.service";
import { ProveedorService } from "../proveedor/proveedor.service";

/** Tiempo mínimo entre dos actualizaciones: evita golpear a los proveedores en bucle. */
export const COOLDOWN_MS = 60_000;
/** Pasado este tiempo sin ninguna respuesta del procesamiento, se avisa. */
export const SIN_RESPUESTA_MS = 10 * 60_000;

type UltimoDisparo = { at: number; proveedor: string | null };

type EstadoProveedor = {
  proveedor: string;
  estado: string;
  actualizadoEn: string | null;
  productos: number | null;
  error: string | null;
  posteriorAlDisparo: boolean;
};

@Injectable()
export class AgentService {
  /** En memoria: se pierde al reiniciar el backend. */
  private ultimoDisparo: UltimoDisparo | null = null;

  constructor(
    private readonly fetchPricesTrigger: FetchPricesTriggerService,
    private readonly importStatus: ImportStatusService,
    private readonly proveedorService: ProveedorService,
  ) {}

  async actualizarProveedores(proveedor?: string) {
    const nombre = proveedor?.trim().toLowerCase() || undefined;

    // Proveedores activos con descarga automática: la misma regla que usa el botón del panel.
    const disponibles = await this.proveedorService.findNombresDescargaAutomatica();
    if (nombre && !disponibles.includes(nombre)) {
      throw new BadRequestException(
        `Proveedor desconocido, inactivo o sin descarga automática: "${nombre}". Disponibles: ${disponibles.join(", ") || "ninguno"}.`,
      );
    }
    if (!nombre && disponibles.length === 0) {
      throw new BadRequestException("No hay proveedores activos con descarga automática.");
    }

    const ahora = Date.now();
    if (this.ultimoDisparo && ahora - this.ultimoDisparo.at < COOLDOWN_MS) {
      const faltan = Math.ceil((COOLDOWN_MS - (ahora - this.ultimoDisparo.at)) / 1000);
      throw new HttpException(
        `Ya se pidió una actualización hace poco. Esperá ${faltan} segundos.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const mensaje = await this.fetchPricesTrigger.triggerFetchPrices(nombre);
    this.ultimoDisparo = { at: ahora, proveedor: nombre ?? null };

    return {
      ok: true,
      proveedor: nombre ?? "todos",
      proveedores: nombre ? [nombre] : disponibles,
      mensaje,
      siguiente: "Consultá /agent/proveedores/estado en unos minutos para ver el resultado.",
    };
  }

  async estado() {
    const ahora = Date.now();
    const disparo = this.ultimoDisparo;

    const disponibles = await this.proveedorService.findNombresDescargaAutomatica();
    const porNombre = new Map<string, ImportStatus>(
      this.importStatus.list().map((s) => [s.proveedor, s]),
    );
    const nombres = Array.from(new Set([...disponibles, ...porNombre.keys()])).sort();

    const proveedores: EstadoProveedor[] = nombres.map((nombre) => {
      const s = porNombre.get(nombre);
      if (!s) {
        return {
          proveedor: nombre,
          estado: "sin_datos",
          actualizadoEn: null,
          productos: null,
          error: null,
          posteriorAlDisparo: false,
        };
      }
      return {
        proveedor: nombre,
        estado: s.state,
        actualizadoEn: s.updatedAt,
        productos: s.count ?? null,
        error: s.error ?? null,
        posteriorAlDisparo: disparo ? Date.parse(s.updatedAt) >= disparo.at : false,
      };
    });

    let aviso: string | null = null;
    if (disparo && ahora - disparo.at > SIN_RESPUESTA_MS) {
      if (!proveedores.some((p) => p.posteriorAlDisparo)) {
        aviso =
          "Se pidió la descarga pero ningún proveedor reportó resultado. Puede haber fallado la descarga: revisá los logs de python-api-fetch.";
      }
    }
    if (!disparo && proveedores.every((p) => p.estado === "sin_datos")) {
      aviso = "Sin datos: todavía no hubo actualizaciones desde que arrancó el backend.";
    }

    return {
      ultimoDisparo: disparo
        ? { en: new Date(disparo.at).toISOString(), proveedor: disparo.proveedor ?? "todos" }
        : null,
      proveedores,
      resumen: this.armarResumen(proveedores),
      aviso,
    };
  }

  private armarResumen(proveedores: EstadoProveedor[]): string {
    if (proveedores.length === 0) return "Sin información de proveedores.";
    return proveedores
      .map((p) => {
        if (p.estado === "error") return `${p.proveedor}: ERROR (${p.error ?? "sin detalle"})`;
        if (p.estado === "success") return `${p.proveedor}: ok (${p.productos ?? 0} productos)`;
        if (p.estado === "empty") return `${p.proveedor}: vacío (0 productos)`;
        if (p.estado === "sin_datos") return `${p.proveedor}: sin datos`;
        return `${p.proveedor}: ${p.estado}`;
      })
      .join("; ");
  }
}
