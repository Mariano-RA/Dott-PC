"""
Fetcher INVID: catálogo vía APIv1 (JWT).

POST /api/v1/auth.php + GET /api/v1/articulo.php (paginado).
Devuelve list[dict] listos para carga_tabla (con codigo e imagenUrl).

Config vía env:
- SUPPLIER_INVID_USER / SUPPLIER_INVID_PASSWORD: credenciales API
- SUPPLIER_INVID_API_URL: base opcional (default https://www.invidcomputers.com)
- SUPPLIER_INVID_URL: legacy Excel (solo upload manual; no usado aquí)
"""
import logging
from typing import List, Optional

from parsers.invid import registros_from_articulos

from . import invid_api

logger = logging.getLogger(__name__)


def fetch_invid() -> Optional[List[dict]]:
    logger.info("INVID: descargando catálogo vía API")
    articulos = invid_api.fetch_all_articulos()
    if not articulos:
        logger.warning("INVID API no devolvió artículos.")
        return None

    data = registros_from_articulos(articulos)
    if not data:
        logger.warning("INVID: ningún artículo mapeable tras filtrar precio/código.")
        return None

    con_imagen = sum(1 for r in data if r.get("imagenUrl"))
    logger.info(
        "INVID: %s productos listos (%s con imagenUrl).",
        len(data),
        con_imagen,
    )
    return data
