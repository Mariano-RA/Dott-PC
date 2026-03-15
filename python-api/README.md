# Python API (Dott-PC)

Servicios Python del proyecto: consumidor de listados de precios (dottDB), consumer de descarga (fetch_price_list_consumer) y mensajería con el backend vía RabbitMQ.

Estructura organizada por responsabilidades (SOLID) y por capas.

## Estructura de carpetas

```
python-api/
├── config/                  # Configuración (env, RabbitMQ, rutas, logging)
│   └── settings.py
├── domain/                  # Lógica de negocio
│   └── price.py             # Cálculo de precio con IVA (categorías se resuelven en el backend)
├── parsers/                 # Parsers por proveedor (un archivo por proveedor)
│   ├── base.py              # Utilidades Excel/CSV (lectura, conversión, desencriptado)
│   ├── air.py, eikon.py, elit.py, hdc.py, invid.py, nb.py, mega.py
│   └── __init__.py          # Registro PROVEEDORES_PARSERS, get_parser, extraer_payload
├── messaging/               # Publicación a RabbitMQ (carga_tabla)
│   └── rabbit.py
├── consumers/               # Consumers de colas
│   ├── price_list_consumer.py   # Procesa listados (base64 → parse → carga_tabla)
│   └── fetch_prices_consumer.py # Descarga listados (fetch_prices → fetcher → cola o carga_tabla)
├── fetchers/                # Descarga de listados por proveedor
│   ├── registry.py, base.py
│   ├── fetch_air.py, fetch_elit.py, fetch_generic.py, fetch_invid.py, fetch_mega.py, fetch_nb.py
│   └── __init__.py
├── data/
│   └── categories/          # Diccionario unificado (diccionarios.json) para carga inicial en MySQL. Configurable con DOTT_CATEGORIES_DIR.
├── logs/                    # Creado al arrancar; app.log (configurable con DOTT_LOG_DIR)
├── scripts/                 # Utilidades CLI (fuera del flujo principal)
│   ├── convert_xls_to_csv.py
│   ├── inspect_mega_xls.py
│   ├── convert_listado_mega.ps1
│   └── diccionarios/        # Scripts de categorías (build, import MySQL)
│       ├── build_master_categories.py
│       └── import_categories_to_mysql.py
├── tests/
├── dottDB.py                # Entrypoint: consumer de listados (python dottDB.py)
├── fetch_price_list_consumer.py  # Entrypoint: consumer de descarga
├── requirements.txt
└── Dockerfile
```

## Descarga automática

En la descarga automática (mensaje sin `proveedor`) se usan: **air, elit, invid, nb**.  
MEGA y HDC están soportados pero excluidos de la lista automática (se pueden invocar por nombre).

## Categorías (flujo actual)

La API de Python **solo procesa archivos y envía las categorías en formato raw** (`categoriaRaw`). El **backend** (NestJS) es el encargado de:

- Buscar en la base de datos el mapeo proveedor + categoría raw → categoría maestra.
- Si no hay mapeo, guardar el producto con categoría "Varios" y **registrar** esa categoría raw como "nueva" en la tabla de mapeos (sin categoría maestra), para que el usuario pueda asignarla desde el admin.
- Listar "categorías nuevas" y agregar/descartar mapeos desde la DB; no se usan archivos JSON en este flujo.

El archivo `data/categories/diccionarios.json` se usa solo para la **carga inicial** de la base (POST /categories/sql/import en el backend). Después de eso todo el flujo es backend + MySQL.

## Scripts

Desde la raíz de `python-api`:

**Excel / listados:**
```bash
python scripts/convert_xls_to_csv.py entrada.xls [salida.csv]
python scripts/inspect_mega_xls.py [ruta/archivo.xls]
```

**Diccionarios y categorías** (requieren `data/categories/diccionarios.json`):
```bash
python scripts/diccionarios/build_master_categories.py
python scripts/diccionarios/import_categories_to_mysql.py   # Opcional: escribe en MySQL; también podés usar POST /categories/sql/import del backend
```

En Docker, montar la carpeta con los archivos y usar la ruta dentro del volumen.

## Tests

Ejecutar desde el directorio `python-api` (para que se resuelvan los imports):

```bash
cd python-api
python -m unittest tests.test_dottdb_parsers -v
```

O desde la raíz del repo con `PYTHONPATH`:

```bash
PYTHONPATH=python-api python -m unittest python-api.tests.test_dottdb_parsers -v
```

## Logs

Todos los módulos usan `logging` con el nombre del módulo (`%(name)s`). Al iniciar los consumers se llama `setup_logging()` desde `config.settings`, que:

- Crea el directorio `logs/` (o el definido en `DOTT_LOG_DIR`).
- Escribe en `logs/app.log` y en consola.
- Formato: `%(asctime)s - %(name)s - %(levelname)s - %(message)s`.

Los fetchers y parsers registran inicio/fin de descarga, tamaño y errores para facilitar el seguimiento.

## Variables de entorno

Ver `.env.example` en la raíz del repo. Relevantes: `RABBITMQ_*`, `SUPPLIER_<PROVEEDOR>_URL/USER/PASSWORD`, `MEGA_EXCEL_PASSWORD` (opcional), `DOTT_CATEGORIES_DIR` (opcional, por defecto `data/categories`), `DOTT_LOG_DIR` (opcional, por defecto `logs`).
