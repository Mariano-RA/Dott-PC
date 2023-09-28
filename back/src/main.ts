import { APP_FILTER, NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import * as bodyParser from "body-parser";
import { ConfigService } from "@nestjs/config";
import { urlencoded } from "express";
import { Logger } from "nestjs-pino";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";

function checkEnvironment(configService: ConfigService) {
  const requiredEnvVars = ["ISSUER_BASE_URL", "AUDIENCE", "CLIENT_ORIGIN_URL"];

  requiredEnvVars.forEach((envVar) => {
    if (!configService.get<string>(envVar)) {
      throw Error(`Undefined environment variable: ${envVar}`);
    }
  });
}

async function bootstrap() {
  // const fs = require("fs");
  // const keyFile = fs.readFileSync("./secrets/privkey.pem");
  // const certFile = fs.readFileSync("./secrets/fullchain.pem");
  // const app = await NestFactory.create(AppModule, {
  //   logger: console,
  //   httpsOptions: {
  //     key: keyFile,
  //     cert: certFile,
  //   },
  // });

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: ["amqp://localhost:15672"],
        queue: "dott_queue",
        queueOptions: {
          durable: false,
        },
      },
    }
  );
  const configService = app.get<ConfigService>(ConfigService);
  checkEnvironment(configService);

  app.useLogger(app.get(Logger));
  // app.enableCors();
  // app.use(bodyParser.json({ limit: "50mb" }));
  // app.use(urlencoded({ extended: true, limit: "50mb" }));
  // app.setGlobalPrefix("api");
  // await app.listen(process.env.PORT || 3000);
}
bootstrap();
