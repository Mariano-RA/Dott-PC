import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHash, timingSafeEqual } from "crypto";
import { Request } from "express";
import { EnvKeys } from "../shared/config";

/** Largo mínimo de la clave: una clave corta se adivina o se fuerza. */
export const AGENT_KEY_MIN_LENGTH = 32;

/** Saca el prefijo IPv4-mapeado ("::ffff:192.168.0.5" -> "192.168.0.5"). */
export function normalizeIp(ip: string | undefined | null): string {
  const value = String(ip ?? "").trim();
  return value.startsWith("::ffff:") ? value.slice("::ffff:".length) : value;
}

function parseAllowedIps(raw: string | undefined | null): string[] {
  return String(raw ?? "")
    .split(",")
    .map((s) => normalizeIp(s))
    .filter(Boolean);
}

function sha256(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}

/**
 * Protege las rutas /agent/...: solo las puede usar el agente (Hermes).
 *
 * Exige dos cosas a la vez:
 *  1. Que la conexión venga de una IP de AGENT_ALLOWED_IPS. Se usa la IP del
 *     socket, nunca cabeceras como X-Forwarded-For, que cualquiera puede falsear.
 *  2. Que el header x-agent-key coincida con AGENT_API_KEY.
 *
 * Si falta alguna de las dos variables (o la clave es corta), todas las rutas
 * quedan cerradas: nunca se abre por defecto.
 */
@Injectable()
export class AgentAuthGuard implements CanActivate {
  private readonly logger = new Logger(AgentAuthGuard.name);

  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    const expectedKey = this.configService.get<string>(EnvKeys.AGENT_API_KEY);
    const allowedIps = parseAllowedIps(
      this.configService.get<string>(EnvKeys.AGENT_ALLOWED_IPS),
    );

    if (
      !expectedKey ||
      expectedKey.length < AGENT_KEY_MIN_LENGTH ||
      allowedIps.length === 0
    ) {
      this.logger.error(
        "Rutas /agent cerradas: falta AGENT_API_KEY (mínimo 32 caracteres) o AGENT_ALLOWED_IPS.",
      );
      throw new ServiceUnavailableException("Rutas del agente no configuradas");
    }

    const remoteIp = normalizeIp(request.socket?.remoteAddress);
    if (!allowedIps.includes(remoteIp)) {
      this.logger.warn(`Pedido /agent rechazado: origen no permitido (${remoteIp || "desconocido"}).`);
      throw new ForbiddenException("Origen no permitido");
    }

    const header = request.headers["x-agent-key"];
    const providedKey = typeof header === "string" ? header : "";
    // Se comparan los hashes (mismo largo siempre) en tiempo constante.
    const keyOk =
      providedKey.length > 0 &&
      timingSafeEqual(sha256(providedKey), sha256(expectedKey));
    if (!keyOk) {
      this.logger.warn(`Pedido /agent rechazado: clave inválida (desde ${remoteIp}).`);
      throw new UnauthorizedException("Clave inválida");
    }

    return true;
  }
}
