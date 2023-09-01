import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ProductosModule } from "./productos/producto.module";
import { Dolar } from "./dolar/entities/dolar.entity";
import { Producto } from "./productos/entities/producto.entity";
import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from "path";
import { Cuota } from "./cuota/entities/cuota.entity";
import { CuotasModule } from "./cuota/cuota.module";
import { User } from "./users/entities/user.entity";
import { ConfigModule } from "@nestjs/config";
import { LoggerModule } from "nestjs-pino";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // envFilePath: [".env.development", ".env.production"],
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
    CuotasModule,
    ProductosModule,
    TypeOrmModule.forRoot({
      type: "sqlite",
      database: "./database/productosDB.sqlite",
      entities: [Dolar, Producto, Cuota, User],
      synchronize: true,
    }),
    // ServeStaticModule.forRoot({
    //   rootPath: join(__dirname, "..", "client"),
    // }),
    // TypeOrmModule.forRoot({
    //   type: "mysql",
    //   host: process.env.DATABASE_HOST, // Nombre del servicio definido en docker-compose.yml
    //   port: 3306,
    //   username: "do0tt",
    //   password: "Depor420",
    //   database: "dottdb",
    //   entities: [Dolar, User, Cuota, Producto],
    //   synchronize: true, // ¡Cuidado! No usar esto en producción
    // }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // {
    //   provide: APP_GUARD,
    //   useClass: AtGuard,
    // },
  ],
})
export class AppModule {}
