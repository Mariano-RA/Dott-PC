import { Module } from "@nestjs/common";
import { ProductosModule } from "../productos/producto.module";
import { ProveedorModule } from "../proveedor/proveedor.module";
import { AgentAuthGuard } from "./agent-auth.guard";
import { AgentController } from "./agent.controller";
import { AgentService } from "./agent.service";

@Module({
  imports: [ProductosModule, ProveedorModule],
  controllers: [AgentController],
  providers: [AgentService, AgentAuthGuard],
})
export class AgentModule {}
