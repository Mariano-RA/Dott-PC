import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ProductosModule } from "./productos/producto.module";
import { Dolar } from "./dolar/entities/dolar.entity";
import { Producto } from "./productos/entities/producto.entity";
import { Cuota } from "./cuota/entities/cuota.entity";
import { CuotasModule } from "./cuota/cuota.module";
import { User } from "./users/entities/user.entity";
import { ConfigModule } from "@nestjs/config";
import { LoggerModule } from "nestjs-pino";

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
    CuotasModule,
    ProductosModule,
    TypeOrmModule.forRoot({
      type: "mysql",
      host: "mysql",
      // host: "localhost",
      port: 3306,
      username: "do0tt",
      password: "M@riano1820",
      database: "dottdb",
      entities: [Dolar, User, Cuota, Producto],
      synchronize: false, // ¡Cuidado! No usar esto en producción
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
