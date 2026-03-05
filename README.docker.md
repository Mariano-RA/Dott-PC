# Docker setup: local y produccion

Este repositorio usa una estrategia de `compose` por capas:

- `docker-compose.yml`: base comun de servicios.
- `docker-compose.dev.yml`: override para desarrollo local (build local, volumenes, watch).
- `docker-compose.prod.yml`: override para produccion (sin volumenes de codigo, orientado a imagenes publicadas).

## 1) Variables de entorno

Crear archivos reales a partir de plantillas:

```powershell
Copy-Item .env.dev.example .env.dev
Copy-Item .env.prod.example .env.prod
```

Notas:
- `.env.dev` y `.env.prod` estan ignorados por git.
- Completar secretos reales antes de levantar contenedores.
- `DB_SYNC=true` solo para desarrollo local; en produccion debe ser `false`.

## 2) Levantar entorno local

```powershell
docker compose --env-file .env.dev -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

Ver logs:

```powershell
docker compose --env-file .env.dev -f docker-compose.yml -f docker-compose.dev.yml logs -f
```

Bajar entorno local:

```powershell
docker compose --env-file .env.dev -f docker-compose.yml -f docker-compose.dev.yml down
```

Si cambiaron credenciales de MySQL y el volumen ya existia, resetear datos locales:

```powershell
docker compose --env-file .env.dev -f docker-compose.yml -f docker-compose.dev.yml down -v
```

## 3) Levantar entorno de produccion

```powershell
docker compose --env-file .env.prod -f docker-compose.yml -f docker-compose.prod.yml up -d
```

Ver logs:

```powershell
docker compose --env-file .env.prod -f docker-compose.yml -f docker-compose.prod.yml logs -f
```

Bajar entorno de produccion:

```powershell
docker compose --env-file .env.prod -f docker-compose.yml -f docker-compose.prod.yml down
```

## 4) Mapeo de variables por entorno

- `docker-compose.dev.yml` toma variables desde `.env.dev` usando `--env-file`.
- `docker-compose.prod.yml` toma variables desde `.env.prod` usando `--env-file`.
- `dottpc-rabbit` no requiere variables de entorno para esta configuracion.
