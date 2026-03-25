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
    const payload = proveedor
      ? { proveedor: proveedor.trim().toLowerCase() }
      : { proveedor: null };
    await this.fetchPricesClient.emit("fetch_prices", payload);
    const msg = proveedor
      ? `Se envió la solicitud de descarga del listado para ${proveedor}.`
      : "Se envió la solicitud de descarga para todos los proveedores configurados.";
    this.logger.log(msg, { proveedor: proveedor ?? "todos", queue: "fetch_prices" });
    await this.eventLogService.info(
      "productos",
      "fetch_prices_triggered",
      proveedor
        ? `Se disparó fetch-prices para "${proveedor.trim().toLowerCase()}".`
        : "Se disparó fetch-prices para todos los proveedores.",
      { proveedor: proveedor ? proveedor.trim().toLowerCase() : "todos", queue: "fetch_prices" }
    );
    return msg;
  }
}
