import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, UseGuards } from "@nestjs/common";
import { AgentArmadoService } from "./agent-armado.service";
import { AgentAuthGuard } from "./agent-auth.guard";
import { AgentCategoriasService } from "./agent-categorias.service";
import { AgentDolarService } from "./agent-dolar.service";
import { AgentImagenesService } from "./agent-imagenes.service";
import { AgentService } from "./agent.service";
import { ActualizarDolarDto } from "./dto/actualizar-dolar.dto";
import { ActualizarProveedoresDto } from "./dto/actualizar-proveedores.dto";
import { BuscarComponentesDto, CotizarArmadoDto } from "./dto/armado.dto";
import { CachearImagenesDto } from "./dto/cachear-imagenes.dto";
import { DescartarCategoriasDto, MapearCategoriasDto } from "./dto/categorias.dto";

/**
 * Rutas para el agente (Hermes). No son para el frontend ni se publican por el
 * túnel: el guard exige la IP de la VM del agente y la clave x-agent-key.
 */
@Controller("agent")
@UseGuards(AgentAuthGuard)
export class AgentController {
  constructor(
    private readonly agentService: AgentService,
    private readonly dolarService: AgentDolarService,
    private readonly categoriasService: AgentCategoriasService,
    private readonly imagenesService: AgentImagenesService,
    private readonly armadoService: AgentArmadoService,
  ) {}

  // ---------------------------------------------------------------- proveedores

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

  // --------------------------------------------------------------------- armado

  /** Los componentes más baratos de cada proveedor para una búsqueda (solo lectura). */
  @Get("armado/buscar")
  buscarComponentes(@Query() dto: BuscarComponentesDto) {
    return this.armadoService.buscar(dto);
  }

  /** Cuenta de un armado: totales por proveedor, mínimos de envío y mejor combinación (solo lectura). */
  @Post("armado/cotizar")
  @HttpCode(HttpStatus.OK)
  cotizarArmado(@Body() dto: CotizarArmadoDto) {
    return this.armadoService.cotizar(dto);
  }

  // ------------------------------------------------------------------- imágenes

  /** Cachea las imágenes que todavía no tienen cache. Responde 202: sigue en segundo plano. */
  @Post("imagenes/cachear")
  @HttpCode(HttpStatus.ACCEPTED)
  cachearImagenes(@Body() dto: CachearImagenesDto) {
    return this.imagenesService.iniciar(dto.proveedor);
  }

  @Get("imagenes/estado")
  estadoImagenes() {
    return this.imagenesService.estado();
  }

  // --------------------------------------------------------------------- dólar

  @Get("dolar")
  dolar() {
    return this.dolarService.listar();
  }

  @Post("dolar/actualizar")
  @HttpCode(HttpStatus.OK)
  actualizarDolar(@Body() dto: ActualizarDolarDto) {
    return this.dolarService.actualizar(dto);
  }

  // ----------------------------------------------------------------- categorías

  @Get("categorias/nuevas")
  categoriasNuevas() {
    return this.categoriasService.nuevas();
  }

  @Get("categorias/maestras")
  categoriasMaestras() {
    return this.categoriasService.maestras();
  }

  @Post("categorias/mapear")
  @HttpCode(HttpStatus.OK)
  mapearCategorias(@Body() dto: MapearCategoriasDto) {
    return this.categoriasService.mapear(dto.items);
  }

  @Post("categorias/descartar")
  @HttpCode(HttpStatus.OK)
  descartarCategorias(@Body() dto: DescartarCategoriasDto) {
    return this.categoriasService.descartar(dto.items);
  }
}
