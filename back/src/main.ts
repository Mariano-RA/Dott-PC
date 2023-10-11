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
  const fs = require("fs");
  const keyFile = fs.readFileSync("./secrets/privkey.pem");
  const certFile = fs.readFileSync("./secrets/fullchain.pem");
  const app = await NestFactory.create(AppModule, {
    logger: console,
    httpsOptions: {
      key: keyFile,
      cert: certFile,
    },
  });

  const rabbitmq_url = process.env.RABBIT_MQ_URI;
  const rabbitmq_dott_queue = process.env.RABBITMQ_QUEUE;

  app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: [rabbitmq_url],
      queue: rabbitmq_dott_queue,
      queueOptions: {
        durable: true,
      },
    },
  });

  await app.startAllMicroservices();
  const configService = app.get<ConfigService>(ConfigService);
  checkEnvironment(configService);
  app.useLogger(app.get(Logger));
  app.enableCors();
  app.use(bodyParser.json({ limit: "50mb" }));
  app.use(urlencoded({ extended: true, limit: "50mb" }));
  await app.listen(3000);
}
bootstrap();
