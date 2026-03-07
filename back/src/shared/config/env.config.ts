/**
 * Centralized environment variable keys and defaults.
 * Use ConfigService.get(EnvKeys.X) instead of process.env in application code.
 * Never put real secrets in defaults for production.
 */

export const EnvKeys = {
  // Auth (Auth0)
  ISSUER_BASE_URL: 'ISSUER_BASE_URL',
  AUDIENCE: 'AUDIENCE',
  CLIENT_ORIGIN_URL: 'CLIENT_ORIGIN_URL',

  // JWT (local / dev only)
  JWT_AT_SECRET: 'JWT_AT_SECRET',
  JWT_RT_SECRET: 'JWT_RT_SECRET',

  // App
  NODE_ENV: 'NODE_ENV',
  LOCAL_DEV_AUTH_BYPASS: 'LOCAL_DEV_AUTH_BYPASS',

  // Database
  DB_HOST: 'DB_HOST',
  DB_PORT: 'DB_PORT',
  DB_USER: 'DB_USER',
  DB_PASSWORD: 'DB_PASSWORD',
  DB_NAME: 'DB_NAME',
  DB_SYNC: 'DB_SYNC',

  // RabbitMQ
  RABBIT_MQ_URI: 'RABBIT_MQ_URI',
  RABBITMQ_QUEUE: 'RABBITMQ_QUEUE',
  RABBITMQ_PYTHON_QUEUE: 'RABBITMQ_PYTHON_QUEUE',

  // HTTPS
  ENABLE_HTTPS: 'ENABLE_HTTPS',
  HTTPS_KEY_PATH: 'HTTPS_KEY_PATH',
  HTTPS_CERT_PATH: 'HTTPS_CERT_PATH',
} as const;

export type EnvKey = (typeof EnvKeys)[keyof typeof EnvKeys];

/** Defaults only for local development; never use for production secrets */
export const EnvDefaults = {
  [EnvKeys.DB_PORT]: 3306,
  [EnvKeys.DB_HOST]: 'mysql',
  [EnvKeys.DB_USER]: 'do0tt',
  [EnvKeys.DB_NAME]: 'dottdb',
  [EnvKeys.DB_SYNC]: 'false',
  [EnvKeys.ENABLE_HTTPS]: 'false',
  [EnvKeys.HTTPS_KEY_PATH]: './secrets/privkey.pem',
  [EnvKeys.HTTPS_CERT_PATH]: './secrets/fullchain.pem',
  [EnvKeys.JWT_AT_SECRET]: 'dev-at-secret-change-me',
  [EnvKeys.JWT_RT_SECRET]: 'dev-rt-secret-change-me',
} as Partial<Record<EnvKey, string | number>>;
