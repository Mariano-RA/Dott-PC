import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ProductosModule } from "./productos/producto.module";
import { Dolar } from "./dolar/entities/dolar.entity";
import { Producto } from "./productos/entities/producto.entity";
import { CuotaPlan } from "./cuota/entities/cuota-plan.entity";
import { CuotasModule } from "./cuota/cuota.module";
import { ConfigModule } from "@nestjs/config";
import { LoggerModule } from "nestjs-pino";
import { DolarHistory } from "./dolar/entities/dolar-history.entity";
import { CalculatorSettingsModule } from "./calculator-settings/calculator-settings.module";
import { CalculatorSetting } from "./calculator-settings/entities/calculator-setting.entity";
import { Proveedor } from "./proveedor/entities/proveedor.entity";
import { ProveedorModule } from "./proveedor/proveedor.module";
import { CategoriesModule } from "./categories/categories.module";
import { MasterCategory } from "./categories/entities/master-category.entity";
import { CategoryProvider } from "./categories/entities/category-provider.entity";
import { ProviderCategoryMapping } from "./categories/entities/provider-category-mapping.entity";

const dbPort = Number(process.env.DB_PORT || 3306);
const dbSync = (process.env.DB_SYNC || "false").toLowerCase() === "true";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport: {
          target: "pino-pretty",
          options: {
            messageKey: "message",
          },
        },
        messageKey: "message",
        autoLogging: false,
      },
    }),
    TypeOrmModule.forRoot({
      type: "mysql",
      host: process.env.DB_HOST || "mysql",
      port: Number.isNaN(dbPort) ? 3306 : dbPort,
      username: process.env.DB_USER || "do0tt",
      password: process.env.DB_PASSWORD || "do0tt_dev_password",
      database: process.env.DB_NAME || "dottdb",
      entities: [
        Dolar,
        DolarHistory,
        Proveedor,
        CuotaPlan,
        Producto,
        CalculatorSetting,
        MasterCategory,
        CategoryProvider,
        ProviderCategoryMapping,
      ],
      // Keep schema sync opt-in for local development only.
      synchronize: dbSync,
    }),
    CuotasModule,
    CalculatorSettingsModule,
    ProductosModule,
    ProveedorModule,
    CategoriesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
