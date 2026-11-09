import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from "@nestjs/common";
import { AgentAuthGuard } from "./agent-auth.guard";
import { AgentService } from "./agent.service";
import { ActualizarProveedoresDto } from "./dto/actualizar-proveedores.dto";

/**
 * Rutas para el agente (Hermes). No son para el frontend ni se publican por el
 * túnel: el guard exige la IP de la VM del agente y la clave x-agent-key.
 */
@Controller("agent")
@UseGuards(AgentAuthGuard)
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  /** Dispara la descarga de listados. Responde 202: el trabajo sigue en segundo plano. */
  @Post("proveedores/actualizar")
  @HttpCode(HttpStatus.ACCEPTED)
  actualizar(@Body() dto: ActualizarProveedoresDto) {
    return this.agentService.actualizarProveedores(dto.proveedor);
  }

  @Get("proveedores/estado")
  estado() {
    return this.agentService.estado();
  }
}
