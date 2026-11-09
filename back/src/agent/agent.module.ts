import { Module } from "@nestjs/common";
import { CategoriesModule } from "../categories/categories.module";
import { DolaresModule } from "../dolar/dolar.module";
import { ProductosModule } from "../productos/producto.module";
import { ProveedorModule } from "../proveedor/proveedor.module";
import { AgentAuthGuard } from "./agent-auth.guard";
import { AgentCategoriasService } from "./agent-categorias.service";
import { AgentDolarService } from "./agent-dolar.service";
import { AgentController } from "./agent.controller";
import { AgentService } from "./agent.service";

@Module({
  imports: [ProductosModule, ProveedorModule, DolaresModule, CategoriesModule],
  controllers: [AgentController],
  providers: [AgentService, AgentDolarService, AgentCategoriasService, AgentAuthGuard],
})
export class AgentModule {}
