/**
 * Cálculo de un armado de PC repartido entre proveedores. Es código puro (sin base de datos) para que sea
 * exacto y repetible: el modelo decide QUÉ comprar y acá se hace la cuenta.
 */

/** Pedido mínimo (en USD, lo que paga Nano al proveedor) por debajo del cual el proveedor cobra envío. */
export const MINIMO_ENVIO_USD: Record<string, number> = { nb: 600, invid: 600 };

export type Opcion = {
  id: number;
  proveedor: string;
  codigo: string | null;
  producto: string;
  /** Lo que paga Nano al proveedor, por unidad. */
  precioUsd: number;
  /** Precio final al cliente (efectivo, con dólar y margen), por unidad. */
  precioCliente: number;
};

export type Linea = { nombre: string; cantidad: number; opciones: Opcion[] };

export type Asignacion = {
  linea: string;
  cantidad: number;
  opcion: Opcion;
  subtotalUsd: number;
  subtotalCliente: number;
};

export type SubtotalProveedor = {
  proveedor: string;
  usd: number;
  cliente: number;
  /** Mínimo de pedido para no pagar envío (null si ese proveedor no tiene). */
  minimoEnvioUsd: number | null;
  /** null si no tiene mínimo. */
  alcanzaMinimo: boolean | null;
};

export type Plan = {
  proveedores: string[];
  asignaciones: Asignacion[];
  totalUsd: number;
  totalCliente: number;
  porProveedor: SubtotalProveedor[];
  /** true si ningún proveedor con mínimo de envío queda por debajo de ese mínimo. */
  sinCostoDeEnvio: boolean;
  avisos: string[];
};

export type Cotizacion = {
  /** Líneas para las que no hay ninguna opción (si hay alguna, no se arman planes). */
  lineasSinOpciones: string[];
  /** La más barata que no tiene riesgo de envío (null si no existe ninguna). */
  mejorSinEnvio: Plan | null;
  /** La más barata de todas, aunque algún proveedor cobre envío. */
  mejorAbsoluta: Plan | null;
  /** Todo en un solo proveedor, de más barato a más caro (solo los que tienen todas las líneas). */
  unSoloProveedor: Plan[];
};

const MAX_PROVEEDORES = 8;

/** Combinaciones no vacías de un arreglo. */
function subconjuntos<T>(items: T[]): T[][] {
  const resultado: T[][] = [];
  for (let mascara = 1; mascara < 1 << items.length; mascara++) {
    resultado.push(items.filter((_, i) => mascara & (1 << i)));
  }
  return resultado;
}

/** La opción más barata (para el cliente) de cada proveedor en una línea. */
function mejorPorProveedor(linea: Linea): Map<string, Opcion> {
  const mejores = new Map<string, Opcion>();
  for (const opcion of linea.opciones) {
    const actual = mejores.get(opcion.proveedor);
    if (
      !actual ||
      opcion.precioCliente < actual.precioCliente ||
      (opcion.precioCliente === actual.precioCliente && opcion.id < actual.id)
    ) {
      mejores.set(opcion.proveedor, opcion);
    }
  }
  return mejores;
}

function armarPlan(asignaciones: Asignacion[]): Plan {
  const porProveedor = new Map<string, SubtotalProveedor>();
  for (const a of asignaciones) {
    const nombre = a.opcion.proveedor;
    const minimo = MINIMO_ENVIO_USD[nombre] ?? null;
    const actual = porProveedor.get(nombre) ?? {
      proveedor: nombre,
      usd: 0,
      cliente: 0,
      minimoEnvioUsd: minimo,
      alcanzaMinimo: null,
    };
    actual.usd += a.subtotalUsd;
    actual.cliente += a.subtotalCliente;
    porProveedor.set(nombre, actual);
  }
  const subtotales = Array.from(porProveedor.values()).sort((x, y) => x.proveedor.localeCompare(y.proveedor));
  const avisos: string[] = [];
  for (const s of subtotales) {
    if (s.minimoEnvioUsd !== null) {
      s.alcanzaMinimo = s.usd >= s.minimoEnvioUsd;
      if (!s.alcanzaMinimo) {
        avisos.push(
          `${s.proveedor}: el pedido es de US$${s.usd}, menos del mínimo de US$${s.minimoEnvioUsd}: puede cobrar envío (a confirmar con el proveedor).`,
        );
      }
    }
  }
  return {
    proveedores: subtotales.map((s) => s.proveedor),
    asignaciones,
    totalUsd: subtotales.reduce((suma, s) => suma + s.usd, 0),
    totalCliente: subtotales.reduce((suma, s) => suma + s.cliente, 0),
    porProveedor: subtotales,
    sinCostoDeEnvio: subtotales.every((s) => s.alcanzaMinimo !== false),
    avisos,
  };
}

/** Cada línea va a su opción más barata dentro de los proveedores indicados. null si alguna línea no se puede cubrir. */
function asignarEn(lineas: Linea[], mejores: Array<Map<string, Opcion>>, proveedores: string[]): Plan | null {
  const asignaciones: Asignacion[] = [];
  for (let i = 0; i < lineas.length; i++) {
    let elegida: Opcion | null = null;
    for (const proveedor of proveedores) {
      const candidata = mejores[i].get(proveedor);
      if (!candidata) continue;
      if (!elegida || candidata.precioCliente < elegida.precioCliente) elegida = candidata;
    }
    if (!elegida) return null;
    asignaciones.push({
      linea: lineas[i].nombre,
      cantidad: lineas[i].cantidad,
      opcion: elegida,
      subtotalUsd: elegida.precioUsd * lineas[i].cantidad,
      subtotalCliente: elegida.precioCliente * lineas[i].cantidad,
    });
  }
  const plan = armarPlan(asignaciones);
  // Un conjunto de proveedores solo cuenta si usa a todos: si no, es el mismo plan de un conjunto más chico.
  return plan.proveedores.length === proveedores.length ? plan : null;
}

function esMejor(candidato: Plan, actual: Plan | null): boolean {
  if (!actual) return true;
  if (candidato.totalCliente !== actual.totalCliente) return candidato.totalCliente < actual.totalCliente;
  if (candidato.proveedores.length !== actual.proveedores.length) {
    return candidato.proveedores.length < actual.proveedores.length;
  }
  return candidato.proveedores.join(",") < actual.proveedores.join(",");
}

export function cotizar(lineas: Linea[]): Cotizacion {
  const lineasSinOpciones = lineas.filter((l) => l.opciones.length === 0).map((l) => l.nombre);
  const vacio: Cotizacion = { lineasSinOpciones, mejorSinEnvio: null, mejorAbsoluta: null, unSoloProveedor: [] };
  if (lineas.length === 0 || lineasSinOpciones.length > 0) return vacio;

  const mejores = lineas.map(mejorPorProveedor);
  const proveedores = Array.from(new Set(lineas.flatMap((l) => l.opciones.map((o) => o.proveedor)))).sort();
  if (proveedores.length > MAX_PROVEEDORES) {
    throw new Error(`Demasiados proveedores distintos (${proveedores.length}).`);
  }

  let mejorAbsoluta: Plan | null = null;
  let mejorSinEnvio: Plan | null = null;
  const unSolo: Plan[] = [];
  for (const conjunto of subconjuntos(proveedores)) {
    const plan = asignarEn(lineas, mejores, conjunto);
    if (!plan) continue;
    if (esMejor(plan, mejorAbsoluta)) mejorAbsoluta = plan;
    if (plan.sinCostoDeEnvio && esMejor(plan, mejorSinEnvio)) mejorSinEnvio = plan;
    if (conjunto.length === 1) unSolo.push(plan);
  }
  unSolo.sort((a, b) => a.totalCliente - b.totalCliente || a.proveedores[0].localeCompare(b.proveedores[0]));
  return { lineasSinOpciones, mejorSinEnvio, mejorAbsoluta, unSoloProveedor: unSolo };
}
