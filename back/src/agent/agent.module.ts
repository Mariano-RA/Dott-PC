import { Module } from "@nestjs/common";
import { CategoriesModule } from "../categories/categories.module";
import { DolaresModule } from "../dolar/dolar.module";
import { ImagenesModule } from "../imagenes/imagenes.module";
import { ProductosModule } from "../productos/producto.module";
import { ProveedorModule } from "../proveedor/proveedor.module";
import { AgentArmadoService } from "./agent-armado.service";
import { AgentAuthGuard } from "./agent-auth.guard";
import { AgentCategoriasService } from "./agent-categorias.service";
import { AgentDolarService } from "./agent-dolar.service";
import { AgentImagenesService } from "./agent-imagenes.service";
import { AgentController } from "./agent.controller";
import { AgentService } from "./agent.service";

@Module({
  imports: [ProductosModule, ProveedorModule, DolaresModule, CategoriesModule, ImagenesModule],
  controllers: [AgentController],
  providers: [
    AgentService,
    AgentDolarService,
    AgentCategoriasService,
    AgentImagenesService,
    AgentArmadoService,
    AgentAuthGuard,
  ],
})
export class AgentModule {}
