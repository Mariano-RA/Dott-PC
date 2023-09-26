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
    // TypeOrmModule.forRoot({
    //   type: "sqlite",
    //   database: "./database/productosDB.sqlite",
    //   entities: [Dolar, Producto, Cuota, User],
    //   synchronize: true,
    // }),
    // ServeStaticModule.forRoot({
    //   rootPath: join(__dirname, "..", "client"),
    // }),
    TypeOrmModule.forRoot({
      type: "mysql",
      host: "149.50.130.168",
      port: 3306,
      username: "do0tt",
      password: "M@riano1820",
      database: "dott_dottdb",
      entities: [Dolar, User, Cuota, Producto],
      synchronize: false, // ¡Cuidado! No usar esto en producción
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
