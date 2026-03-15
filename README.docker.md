# Docker - Desarrollo local y producción

El front se publica en otro lado; el compose solo incluye backend, python-api y python-api-fetch.

## Desarrollo local (build activo)

El `docker-compose.yml` tiene **build** activo para `backend` y `python-api`.  
`python-api-fetch` **no tiene Dockerfile propio**: usa la **misma imagen** que `python-api` (mismo código en `./python-api`, otro comando: `fetch_price_list_consumer.py`). La imagen se construye una vez con el servicio `python-api` y ambos servicios la reutilizan.

Desde la raíz del repo:

```powershell
docker compose up -d --build
```

Variables: copiá `.env.example` a `.env` y completá.

## Producción (solo imágenes)

Para usar imágenes ya construidas (por CI u otro), usá el override **docker-compose.prod.yml** (quita el `build` y usa solo imágenes):

```powershell
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

Requisitos:

1. Tener las imágenes `dottpc-back:latest` y `dottpc-python:latest` en el servidor (construidas en CI y pusheadas a un registry, o cargadas a mano).
2. En el servidor, el `.env` con variables de producción (no hace falta el código fuente de `back/` ni `python-api/`).

Si usás un registry privado, editá `docker-compose.prod.yml` y reemplazá `image:` por tu repo (ej. `tu-registry/dottpc-back:latest`) y `pull_policy: always`.

## Comandos útiles

| Acción           | Comando                     |
|------------------|-----------------------------|
| Ver logs         | `docker compose logs -f`    |
| Bajar todo       | `docker compose down`       |
| Bajar + volúmenes| `docker compose down -v`    |

## Servicios

| Servicio         | Origen de la imagen      | Puerto (por defecto) |
|------------------|--------------------------|------------------------|
| dottpc-rabbit    | rabbitmq:3-management    | 5672, 15672           |
| mysql            | mysql:8.0                | 3306                   |
| backend          | build ./back             | 3000                   |
| python-api       | build ./python-api       | 5000                   |
| python-api-fetch | misma imagen que python-api (solo otro comando) | — |
