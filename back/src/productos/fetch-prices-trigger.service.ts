import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  ClientProxy,
  ClientProxyFactory,
  Transport,
} from "@nestjs/microservices";
import { Logger } from "nestjs-pino";
import { EnvKeys } from "../shared/config";
import { EventLogService } from "src/shared/event-log.service";
import { ProveedorService } from "src/proveedor/proveedor.service";

/** Proveedores con fetcher en python-api (capacidad de descarga automática). */
export const PROVEEDORES_CON_FETCHER = [
  "air",
  "elit",
  "invid",
  "mega",
  "nb",
] as const;

/**
 * Servicio dedicado a disparar la descarga de listados (fetch-prices).
 * Solo construye el payload y emite a la cola fetch_prices; no procesa resultados.
 */
@Injectable()
export class FetchPricesTriggerService {
  private readonly fetchPricesClient: ClientProxy;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: Logger,
    private readonly eventLogService: EventLogService,
    private readonly proveedorService: ProveedorService,
  ) {
    const rabbitmqUrl = this.configService.get<string>(EnvKeys.RABBIT_MQ_URI);
    const fetchPricesQueue =
      this.configService.get<string>(EnvKeys.RABBITMQ_FETCH_PRICES_QUEUE) ||
      "fetch_prices";
    this.fetchPricesClient = ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: [rabbitmqUrl],
        queue: fetchPricesQueue,
      },
    });
  }

  async triggerFetchPrices(proveedor?: string): Promise<string> {
    const named = proveedor?.trim().toLowerCase();

    if (named) {
      const payload = { proveedor: named };
      await this.fetchPricesClient.emit("fetch_prices", payload);
      const msg = `Se envió la solicitud de descarga del listado para ${named}.`;
      this.logger.log(msg, { proveedor: named, queue: "fetch_prices" });
      await this.eventLogService.info(
        "productos",
        "fetch_prices_triggered",
        `Se disparó fetch-prices para "${named}".`,
        { proveedor: named, queue: "fetch_prices" },
      );
      return msg;
    }

    const activos = await this.proveedorService.findActivos();
    const fetcherSet = new Set<string>(PROVEEDORES_CON_FETCHER);
    const proveedores = activos
      .map((p) => String(p.nombre || "").trim().toLowerCase())
      .filter((n) => n && fetcherSet.has(n));

    const payload = { proveedores };
    await this.fetchPricesClient.emit("fetch_prices", payload);
    const msg =
      proveedores.length > 0
        ? `Se envió la solicitud de descarga para: ${proveedores.join(", ")}.`
        : "No hay proveedores activos con descarga automática configurada.";
    this.logger.log(msg, {
      proveedor: "todos",
      proveedores,
      queue: "fetch_prices",
    });
    await this.eventLogService.info(
      "productos",
      "fetch_prices_triggered",
      proveedores.length > 0
        ? `Se disparó fetch-prices para proveedores activos: ${proveedores.join(", ")}.`
        : "Se disparó fetch-prices sin proveedores activos con fetcher.",
      { proveedor: "todos", proveedores, queue: "fetch_prices" },
    );
    return msg;
  }
}
