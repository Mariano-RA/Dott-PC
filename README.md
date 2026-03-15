# Dott-PC

## 1. Propósito y Resolución del Problema

**Dott-PC** es un sistema integral para la **gestión de listados de precios de proveedores** (distribuidores mayoristas) y su exposición al frontend. El problema que resuelve es:

- **Centralizar** listados de precios en distintos formatos (Excel, CSV, APIs) de múltiples proveedores (AIR, Elit, Invid, NB, MEGA, HDC, Eikon, etc.).
- **Parsear y normalizar** esos listados (por proveedor) y **persistirlos** en una base de datos única (MySQL).
- **Servir** al frontend una API REST para consultar productos, categorías, dólar, planes de cuotas y configuración de calculadora.
- **Automatizar** la descarga de listados (fetch-prices) y el flujo **carga → cola → procesamiento → base de datos** mediante mensajería (RabbitMQ).

Responsabilidades por componente:

| Componente | Responsabilidad principal |
|------------|----------------------------|
| **Backend (NestJS)** | API REST para el frontend (productos, categorías, proveedores, dólar, cuotas, calculadora). Autenticación (Auth0/JWT). Consumir mensajes `carga_tabla` desde RabbitMQ y persistir en MySQL. Disparar descargas de listados (POST `fetch-prices`) enviando mensajes a la cola `fetch_prices`. Gestión de categorías maestras y mapeos proveedor → categoría. |
| **Python API** | **Consumidor de listados**: recibe archivos en base64 por la cola `PYTHON_QUEUE`, parsea con el parser del proveedor y publica el resultado (`carga_tabla`) al backend. **Consumidor de descarga**: escucha la cola `fetch_prices`, ejecuta fetchers por proveedor (AIR, Elit, Invid, NB, MEGA), descarga el listado y lo reenvía a la cola de procesamiento o hace `carga_tabla` directa. Parsers y fetchers por proveedor; publicación a RabbitMQ. |
| **MySQL** | Persistencia de productos, categorías, proveedores, dólar, planes de cuotas y configuración de calculadora. |
| **RabbitMQ** | Desacoplar backend y Python: colas para mensajes de listados (`PYTHON_QUEUE`), carga de tabla (`RABBIT_MR_DOTT_QUEUE`), y descarga de precios (`fetch_prices`). |

Este repositorio contiene el **backend**, la **API en Python** y la **orquestación Docker**; el frontend (p. ej. `dott-front`) se documenta en su propia carpeta.

---

## 2. Stack Tecnológico

### Backend (`back/`)

| Categoría | Tecnología |
|-----------|------------|
| Lenguaje | TypeScript |
| Framework | NestJS 9.x |
| ORM | TypeORM 0.3.x |
| Base de datos | MySQL 8 (driver `mysql2`) |
| Mensajería | RabbitMQ (`@nestjs/microservices`, `amqplib`, `amqp-connection-manager`) |
| Auth | Auth0 (JWT) con `express-oauth2-jwt-bearer`, `jwks-rsa`, `passport`, `passport-jwt` |
| Validación | `class-validator`, `class-transformer` |
| Logging | `nestjs-pino`, `pino-http`, `pino-pretty` |
| Config | `@nestjs/config` |

### Python API (`python-api/`)

| Categoría | Tecnología |
|-----------|------------|
| Lenguaje | Python 3.11 |
| Runtime | Alpine (contenedor); opcional LibreOffice en imagen para conversión XLS→CSV |
| Mensajería | RabbitMQ (`pika`) |
| Datos | `pandas`, `openpyxl`, `xlrd`, `msoffcrypto-tool`, `html5lib` |
| HTTP | `requests` |

### Infraestructura

- **Docker** y **Docker Compose** para MySQL, RabbitMQ, backend y python-api (incl. servicio `python-api-fetch`).
- Producción: override con `docker-compose.prod.yml` (imágenes preconstruidas, sin build local).

---

## 3. Estructura del Directorio

Árbol simplificado de las carpetas relevantes del módulo:

```
Dott-PC/
├── back/                          # API NestJS (servidor principal)
│   ├── src/
│   │   ├── app.module.ts          # Módulo raíz, TypeORM, Config, Logger, módulos de dominio
│   │   ├── main.ts                # Bootstrap: HTTP + microservicio RabbitMQ (cola RABBITMQ_QUEUE)
│   │   ├── productos/             # Productos: CRUD, listado, keywords, integración con RabbitMQ (carga_tabla), fetch-prices
│   │   ├── categories/            # Categorías maestras, mapeos proveedor→categoría, diccionarios, “nuevas” y descarte
│   │   ├── proveedor/             # Proveedores (entidad y endpoints)
│   │   ├── dolar/                 # Cotización dólar e histórico
│   │   ├── cuota/                 # Planes de cuotas
│   │   ├── calculator-settings/   # Configuración de la calculadora
│   │   ├── authTest/              # Guards de autorización y permisos (Auth0)
│   │   └── shared/                # Constantes, DTOs, configuración env
│   └── Dockerfile                 # Multi-stage: Node 20 Alpine, build + runner
│
├── python-api/                    # Consumidores y lógica de listados (Python)
│   ├── config/                    # Configuración: env, RabbitMQ, rutas (categorías, logs)
│   ├── domain/                    # Lógica de negocio (ej. cálculo de precio con IVA)
│   ├── parsers/                   # Un parser por proveedor (AIR, Elit, Invid, NB, MEGA, HDC, Eikon, etc.)
│   ├── messaging/                 # Publicación a RabbitMQ (carga_tabla)
│   ├── consumers/                 # price_list_consumer (listados base64), fetch_prices_consumer (descarga)
│   ├── fetchers/                  # Descarga de listados por proveedor (registry, base, fetch_*)
│   ├── data/categories/           # Diccionarios (diccionarios.json) para carga inicial en backend
│   ├── scripts/                  # CLI: conversión XLS/CSV, inspección MEGA, diccionarios/categorías
│   ├── dottDB.py                  # Entrypoint: consumer de listados (PYTHON_QUEUE)
│   ├── fetch_price_list_consumer.py  # Entrypoint: consumer de descarga (fetch_prices)
│   ├── requirements.txt
│   └── Dockerfile                 # Python 3.11 Alpine + LibreOffice, CMD dottDB.py
│
├── docker-compose.yml             # Servicios: mysql, dottpc-rabbit, backend, python-api, python-api-fetch
├── docker-compose.prod.yml        # Override producción: sin build, imágenes preconstruidas
└── .env.example                   # Plantilla de variables de entorno
```

---

## 4. Configuración (Crucial)

### Requisitos previos

- **Docker** y **Docker Compose** (v2.18+ si se usa `docker-compose.prod.yml` con `!reset`).
- Para desarrollo local sin Docker: **Node.js 20**, **Python 3.11**, **MySQL 8** y **RabbitMQ** accesibles, y archivo `.env` en la raíz.

### Variables de entorno

Todas las variables necesarias están documentadas en **`.env.example`**. Copiá este archivo a **`.env`** en la **raíz del proyecto** y reemplazá los valores. Nunca subas `.env` con secretos reales.

- **Entorno**: `NODE_ENV`
- **MySQL**: `MYSQL_ROOT_PASSWORD`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD` (compose); backend usa `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SYNC`
- **Auth (Auth0)**: `ISSUER_BASE_URL`, `AUDIENCE`, `CLIENT_ORIGIN_URL`
- **JWT**: `JWT_AT_SECRET`, `JWT_RT_SECRET`
- **RabbitMQ**: `RABBIT_MQ_URI` / `RABBITMQ_URL`, `RABBITMQ_QUEUE`, `RABBITMQ_PYTHON_QUEUE`, `RABBITMQ_FETCH_PRICES_QUEUE`, `RABBITMQ_RETRY_DELAY`
- **Backend**: `CATEGORIES_DATA_PATH` (en Docker suele ser volumen `/app/categories_data`), `LOCAL_DEV_AUTH_BYPASS` (solo desarrollo), HTTPS opcional: `ENABLE_HTTPS`, `HTTPS_KEY_PATH`, `HTTPS_CERT_PATH`
- **Python API**: credenciales por proveedor: `SUPPLIER_AIR_*`, `SUPPLIER_ELIT_*`, `SUPPLIER_INVID_*`, `SUPPLIER_NB_*`, `SUPPLIER_MEGA_*`; opcional `DOTT_CATEGORIES_DIR`, `DOTT_LOG_DIR`, `MEGA_EXCEL_PASSWORD`

### Ejemplo de archivo `.env`

Este bloque muestra cómo debería verse la configuración mínima (ajustar valores y añadir el resto según `.env.example`):

```env
# ---------- Entorno ----------
NODE_ENV=development

# ---------- MySQL ----------
MYSQL_ROOT_PASSWORD=change_this_root_password
MYSQL_DATABASE=dottdb
MYSQL_USER=do0tt
MYSQL_PASSWORD=change_this_db_password

# ---------- Backend - Auth (Auth0) ----------
ISSUER_BASE_URL=https://your-tenant.auth0.com/
AUDIENCE=https://api.dott.example
CLIENT_ORIGIN_URL=http://localhost:8090

# ---------- Backend - JWT ----------
JWT_AT_SECRET=change_this_at_secret
JWT_RT_SECRET=change_this_rt_secret

# ---------- Backend - Base de datos (host = servicio en compose) ----------
DB_HOST=mysql
DB_PORT=3306
DB_USER=do0tt
DB_PASSWORD=change_this_db_password
DB_NAME=dottdb
DB_SYNC=false

# ---------- RabbitMQ ----------
RABBIT_MQ_URI=amqp://guest:guest@dottpc-rabbit:5672/
RABBITMQ_URL=amqp://guest:guest@dottpc-rabbit:5672/
RABBITMQ_QUEUE=RABBIT_MR_DOTT_QUEUE
RABBITMQ_PYTHON_QUEUE=PYTHON_QUEUE
RABBITMQ_FETCH_PRICES_QUEUE=fetch_prices
RABBITMQ_RETRY_DELAY=5

# ---------- Python API - Proveedores (ejemplo; dejar vacío si no aplica) ----------
SUPPLIER_ELIT_URL=
SUPPLIER_ELIT_USER_ID=
SUPPLIER_ELIT_TOKEN=
# ... resto según .env.example
```

En **Docker**, `DB_HOST` y las URLs de RabbitMQ deben apuntar a los nombres de servicio (`mysql`, `dottpc-rabbit`). Para **desarrollo local** con procesos en la máquina, usá `localhost` en esas URLs y en `DB_HOST`.

### Archivos YAML de Compose

- **`docker-compose.yml`**: define todos los servicios (mysql, dottpc-rabbit, backend, python-api, python-api-fetch). Usa `build` para backend y python-api. Las variables se inyectan desde `.env`.
- **`docker-compose.prod.yml`**: override para producción; quita el `build` y usa solo imágenes (`dottpc-back:latest`, `dottpc-python:latest`) con `pull_policy: never` (o cambiar a registry y `pull_policy: always`).

No se requieren archivos YAML adicionales de configuración de aplicación; toda la configuración es vía variables de entorno y `.env`.

---

## 5. Ejecución

### Levantar todo el módulo con Docker Compose (recomendado)

Desde la **raíz del repositorio** (donde están `docker-compose.yml` y `.env`):

```bash
# Crear y levantar servicios (build de back y python-api si hace falta)
docker compose up -d

# Ver logs
docker compose logs -f backend
docker compose logs -f python-api
docker compose logs -f python-api-fetch
```

Servicios y puertos por defecto (si no se sobrescriben en `.env`):

- **MySQL**: `3306`
- **RabbitMQ**: AMQP `5672`, gestión `15672`
- **Backend**: `3000`
- **Python API** (dottDB): `5000`  
- **python-api-fetch**: sin puerto expuesto (solo consumer)

### Producción (imágenes preconstruidas)

Asegurate de tener las imágenes `dottpc-back:latest` y `dottpc-python:latest` (construidas en CI o en registry). Luego:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Ejecución aislada (desarrollo local sin Docker)

Requiere MySQL y RabbitMQ en ejecución (locales o en Docker solo para infra).

**Backend**

```bash
cd back
cp ../.env .env   # o enlazar .env desde la raíz
npm ci
npm run build
npm run prod
# O en modo desarrollo: npm run start:dev
```

**Python API (consumer de listados)**

```bash
cd python-api
# Crear venv y instalar dependencias
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
# Asegurar que .env esté en la raíz del repo y las variables RABBITMQ_* y SUPPLIER_* estén definidas
python dottDB.py
```

**Python API – consumer de descarga (fetch prices)**

```bash
cd python-api
.venv\Scripts\activate
python fetch_price_list_consumer.py
```

En ambos casos, el backend debe poder resolver `DB_HOST` (ej. `localhost`) y `RABBIT_MQ_URI` hacia tu instancia de RabbitMQ.

---

## Resumen de flujos

1. **Carga manual de listado**: el frontend/admin envía el archivo al backend (POST protegido); el backend envía el mensaje a la cola `PYTHON_QUEUE`; el consumer `dottDB.py` parsea y publica `carga_tabla`; el backend recibe por `RABBIT_MR_DOTT_QUEUE` y persiste en MySQL.
2. **Descarga automática**: el frontend/admin llama a POST `productos/fetch-prices` (opcionalmente con `proveedor`); el backend emite a la cola `fetch_prices`; el consumer `fetch_price_list_consumer.py` ejecuta el fetcher, descarga el listado y lo reenvía a `PYTHON_QUEUE` o hace `carga_tabla` directa.
3. **Categorías**: el backend resuelve categoría raw → categoría maestra (mapeos en MySQL); las “nuevas” se gestionan desde el admin (endpoints en `categories/`). El diccionario inicial puede cargarse con POST `/categories/sql/import` desde `data/categories/diccionarios.json`.

Para más detalle sobre la API en Python (parsers, fetchers, scripts, tests), ver **`python-api/README.md`**.
