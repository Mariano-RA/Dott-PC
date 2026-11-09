import { BadRequestException, Injectable, UnprocessableEntityException } from "@nestjs/common";
import { DolaresService } from "../dolar/dolar.service";
import { ProveedorService } from "../proveedor/proveedor.service";
import { cleanText } from "./agent-text";
import { ActualizarDolarDto } from "./dto/actualizar-dolar.dto";

/** Cambio máximo (en proporción) que se acepta sin confirmación expresa. */
export const MAX_CAMBIO_SIN_CONFIRMAR = 0.3;
export const USUARIO_AGENTE = "agente-hermes";
const MOTIVO_POR_DEFECTO = "Actualización pedida por Nano vía Hermes";

@Injectable()
export class AgentDolarService {
  constructor(
    private readonly dolares: DolaresService,
    private readonly proveedores: ProveedorService,
  ) {}

  /** Valor del dólar de cada proveedor activo que tiene uno cargado. */
  async listar() {
    const filas = await this.dolares.findAll();
    const proveedores = filas
      .filter((f) => f.proveedor?.nombre)
      .map((f) => ({ proveedor: f.proveedor.nombre, precioDolar: f.precioDolar }))
      .sort((a, b) => a.proveedor.localeCompare(b.proveedor));
    return {
      proveedores,
      resumen: proveedores.length
        ? proveedores.map((p) => `${p.proveedor}: $${p.precioDolar}`).join("; ")
        : "No hay valores de dólar cargados para proveedores activos.",
    };
  }

  async actualizar(dto: ActualizarDolarDto) {
    const { precioDolar, proveedor, todos, confirmado } = dto;

    // "Todos" tiene que ser explícito: nunca se asume por omisión.
    if ((proveedor && todos) || (!proveedor && !todos)) {
      throw new BadRequestException("Indicá un proveedor o todos=true, pero no los dos ni ninguno.");
    }
    const motivo = cleanText(dto.motivo ?? "", 120) || MOTIVO_POR_DEFECTO;

    // Activos con dólar ya cargado. Sirve para comparar con el valor anterior.
    const filas = await this.dolares.findAll();
    const actualPorId = new Map<number, number>(filas.map((f) => [f.proveedorId, f.precioDolar]));

    let objetivos: Array<{ id: number; nombre: string }>;
    if (proveedor) {
      // Se valida contra los existentes: upsertOne por nombre CREARÍA un proveedor nuevo.
      const encontrado = await this.proveedores.findByNombre(proveedor);
      if (!encontrado || encontrado.activo === false) {
        const disponibles = (await this.proveedores.findActivos()).map((p) => p.nombre);
        throw new BadRequestException(
          `Proveedor desconocido o inactivo: "${proveedor}". Disponibles: ${disponibles.join(", ") || "ninguno"}.`,
        );
      }
      objetivos = [{ id: encontrado.id, nombre: encontrado.nombre }];
    } else {
      objetivos = filas
        .filter((f) => f.proveedor?.nombre)
        .map((f) => ({ id: f.proveedorId, nombre: f.proveedor.nombre }));
      if (objetivos.length === 0) {
        throw new BadRequestException("No hay proveedores activos con dólar cargado.");
      }
    }

    // Control de disparates (ej. 1450 en vez de 14500): pide confirmación expresa.
    const grandes = objetivos.filter((o) => {
      const actual = actualPorId.get(o.id);
      return actual != null && actual > 0 && Math.abs(precioDolar - actual) / actual > MAX_CAMBIO_SIN_CONFIRMAR;
    });
    if (grandes.length > 0 && !confirmado) {
      const detalle = grandes.map((o) => `${o.nombre} (${actualPorId.get(o.id)} → ${precioDolar})`).join(", ");
      throw new UnprocessableEntityException(
        `El cambio supera el ${MAX_CAMBIO_SIN_CONFIRMAR * 100}% en: ${detalle}. ` +
          "Si es correcto, pedile confirmación a Nano y repetí con confirmado=true.",
      );
    }

    const actualizados: Array<{ proveedor: string; antes: number | null; despues: number }> = [];
    const fallidos: string[] = [];
    for (const objetivo of objetivos) {
      try {
        await this.dolares.upsertOne({
          precioDolar,
          proveedorId: objetivo.id,
          usuario: USUARIO_AGENTE,
          motivo,
        });
        actualizados.push({
          proveedor: objetivo.nombre,
          antes: actualPorId.get(objetivo.id) ?? null,
          despues: precioDolar,
        });
      } catch {
        fallidos.push(objetivo.nombre);
      }
    }

    let resumen = actualizados.length
      ? `Dólar en $${precioDolar} para: ${actualizados
          .map((a) => (a.antes != null ? `${a.proveedor} (antes $${a.antes})` : `${a.proveedor} (nuevo)`))
          .join(", ")}.`
      : "No se actualizó ningún proveedor.";
    if (fallidos.length) resumen += ` Fallaron: ${fallidos.join(", ")}.`;

    return { ok: fallidos.length === 0, precioDolar, actualizados, fallidos, resumen };
  }
}
