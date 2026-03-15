import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import * as bodyParser from "body-parser";
import { ConfigService } from "@nestjs/config";
import { urlencoded } from "express";
import { Logger } from "nestjs-pino";
import { Transport } from "@nestjs/microservices";
import { ValidationPipe } from "@nestjs/common";
import { APP } from "./shared/constants";

function checkEnvironment(configService: ConfigService) {
  const requiredEnvVars = [
    "ISSUER_BASE_URL",
    "AUDIENCE",
    "CLIENT_ORIGIN_URL",
    "RABBIT_MQ_URI",
    "RABBITMQ_QUEUE",
  ];

  const requiresHttps =
    (configService.get<string>("ENABLE_HTTPS") || "false").toLowerCase() ===
    "true";

  if (requiresHttps) {
    requiredEnvVars.push("HTTPS_KEY_PATH", "HTTPS_CERT_PATH");
  }

  requiredEnvVars.forEach((envVar) => {
    if (!configService.get<string>(envVar)) {
      throw Error(`Undefined environment variable: ${envVar}`);
    }
  });
}

async function bootstrap() {
  const fs = require("fs");
  const enableHttps = (process.env.ENABLE_HTTPS || "false").toLowerCase() === "true";
  const keyPath = process.env.HTTPS_KEY_PATH || "./secrets/privkey.pem";
  const certPath = process.env.HTTPS_CERT_PATH || "./secrets/fullchain.pem";

  const app = await NestFactory.create(AppModule, {
    logger: console,
    ...(enableHttps
      ? {
          httpsOptions: {
            key: fs.readFileSync(keyPath),
            cert: fs.readFileSync(certPath),
          },
        }
      : {}),
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
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  );
  app.enableCors();
  app.use(bodyParser.json({ limit: APP.BODY_PARSER_LIMIT }));
  app.use(urlencoded({ extended: true, limit: APP.BODY_PARSER_LIMIT }));
  await app.listen(APP.DEFAULT_PORT);
}
bootstrap();
