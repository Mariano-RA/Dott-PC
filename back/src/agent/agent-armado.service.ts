import { BadRequestException, Injectable, UnprocessableEntityException } from "@nestjs/common";
import { ProductosService } from "../productos/producto.service";
import { ProveedorService } from "../proveedor/proveedor.service";
import { cleanText } from "./agent-text";
import { Cotizacion, Linea, Opcion, Plan, cotizar } from "./armado.calculo";
import { BuscarComponentesDto, CotizarArmadoDto } from "./dto/armado.dto";

const NOTA_COTIZACION =
  "Precios por unidad. 'precioUsd' es lo que paga Nano al proveedor; 'precioCliente' es el precio final al cliente en " +
  "efectivo (pesos). El mínimo de envío se mide en USD sobre lo que paga Nano. No hay datos de stock ni de descuentos " +
  "por comprar todo en un proveedor: confirmarlos con el proveedor.";

/**
 * Búsqueda de componentes y cotización de armados, de solo lectura. El modelo elige qué comprar; la cuenta
 * (totales por proveedor, mínimos de envío, mejor combinación) la hace el código.
 */
@Injectable()
export class AgentArmadoService {
  constructor(
    private readonly productos: ProductosService,
    private readonly proveedorService: ProveedorService,
  ) {}

  async buscar(dto: BuscarComponentesDto) {
    const q = cleanText(dto.q ?? "", 80);
    const categoria = cleanText(dto.categoria ?? "", 80);
    if (!q && !categoria) {
      throw new BadRequestException("Indicá q (palabras clave) o categoria.");
    }

    const activos = (await this.proveedorService.findActivos()).map((p) => p.nombre.trim().toLowerCase());
    if (dto.proveedor && !activos.includes(dto.proveedor)) {
      throw new BadRequestException(
        `Proveedor desconocido o inactivo: "${dto.proveedor}". Disponibles: ${activos.join(", ") || "ninguno"}.`,
      );
    }

    const porProveedor = await this.productos.buscarParaAgente({
      proveedores: dto.proveedor ? [dto.proveedor] : activos,
      keywords: q || undefined,
      category: categoria || undefined,
      takePorProveedor: dto.porProveedor ?? 3,
    });

    const proveedores = Object.entries(porProveedor).map(([proveedor, lista]) => ({
      proveedor,
      productos: lista.map((p) => ({
        id: p.id,
        codigo: p.codigo,
        // Texto que viene del proveedor: se limpia y se acota antes de dárselo al modelo.
        producto: cleanText(p.producto, 120),
        categoria: cleanText(p.categoria, 60),
        precioUsd: p.precioUsd,
        precioCliente: p.precioCliente,
      })),
    }));
    const total = proveedores.reduce((suma, p) => suma + p.productos.length, 0);

    return {
      consulta: { q: q || null, categoria: categoria || null },
      proveedores,
      total,
      aviso:
        total === 0
          ? "Sin resultados: probá con menos palabras clave, otra categoría o sin categoría."
          : "Orden: del más barato al más caro. No hay datos de stock.",
    };
  }

  async cotizar(dto: CotizarArmadoDto) {
    const ids = Array.from(new Set(dto.lineas.flatMap((l) => l.opciones)));
    const productos = await this.productos.findParaAgentePorIds(ids);
    const porId = new Map(productos.map((p) => [p.id, p]));

    const faltan = ids.filter((id) => !porId.has(id));
    if (faltan.length > 0) {
      throw new UnprocessableEntityException({
        statusCode: 422,
        message: `Estos ids no existen o son de un proveedor inactivo: ${faltan.join(", ")}. Usá ids de /agent/armado/buscar.`,
        error: "Unprocessable Entity",
      });
    }

    const lineas: Linea[] = dto.lineas.map((l) => ({
      nombre: cleanText(l.nombre, 60),
      cantidad: l.cantidad ?? 1,
      opciones: Array.from(new Set(l.opciones)).map((id): Opcion => {
        const p = porId.get(id)!;
        return {
          id: p.id,
          proveedor: p.proveedor,
          codigo: p.codigo,
          producto: cleanText(p.producto, 120),
          precioUsd: p.precioUsd,
          precioCliente: p.precioCliente,
        };
      }),
    }));

    const cotizacion: Cotizacion = cotizar(lineas);
    return { ...cotizacion, resumen: this.resumir(cotizacion), nota: NOTA_COTIZACION };
  }

  private resumir(c: Cotizacion): string {
    if (c.lineasSinOpciones.length > 0) return `Faltan opciones para: ${c.lineasSinOpciones.join(", ")}.`;
    if (!c.mejorAbsoluta) return "No se pudo armar ninguna combinación.";
    const linea = (titulo: string, plan: Plan | null) =>
      plan
        ? `${titulo}: ${plan.proveedores.join("+")} · US$${plan.totalUsd} · $${plan.totalCliente} al cliente`
        : `${titulo}: ninguna`;
    return [
      linea("Mejor sin riesgo de envío", c.mejorSinEnvio),
      linea("Más barata en total", c.mejorAbsoluta),
      c.unSoloProveedor.length > 0
        ? "Un solo proveedor: " +
          c.unSoloProveedor.map((p) => `${p.proveedores[0]} US$${p.totalUsd} / $${p.totalCliente}`).join("; ")
        : "Un solo proveedor: ninguno tiene todas las piezas",
    ].join("\n");
  }
}
