"""
Fetcher AIR: descarga CSV de precios desde descargas.php.

La web usa una llamada a:
https://www.air-intra.com/2025/consultas/descargas.php?type=csv&q={...}

Aquí la modelamos como un GET con los mismos parámetros (`type`, `q`)
en la querystring.

Config vía env (opcional):
- SUPPLIER_AIR_URL: URL base de descargas (por defecto descargas.php indicada arriba).
"""
import json
import logging
import os
from typing import Optional

import requests

from .base import get_supplier_credentials

logger = logging.getLogger(__name__)

DEFAULT_AIR_URL = "https://www.air-intra.com/2025/consultas/descargas.php"
DEFAULT_AIR_REFERER = "https://www.air-intra.com/2025/ar/"
DEFAULT_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/145.0.0.0 Safari/537.36"
)


def _default_query_payload() -> dict:
    """
    Estructura de `q` observada en la llamada de la web.
    Si en el futuro se quiere parametrizar (grupo, rubro, etc.), se puede extender
    usando variables de entorno o argumentos adicionales.
    """
    return {
        "grupo": 0,
        "rubro": "",
        "estado": "T",
        "texto": "",
        "orden": "DA",
        "stock": "D",
        "codiart": "",
        "canasto": 0,
        "favoritos": "",
        "limit": 500,
    }


def fetch_air() -> Optional[bytes]:
    """
    Descarga el CSV de AIR usando una petición similar a la del navegador.
    Devuelve el cuerpo en bytes o None si falla.
    """
    creds = get_supplier_credentials("air")
    url = (creds.get("url") or "").strip() or DEFAULT_AIR_URL

    q_payload = _default_query_payload()
    body = {
        "type": "csv",
        "q": json.dumps(q_payload, separators=(",", ":")),
    }

    headers = {
        "Referer": DEFAULT_AIR_REFERER,
        "User-Agent": DEFAULT_USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Sec-CH-UA": '"Not:A-Brand";v="99", "Google Chrome";v="145", "Chromium";v="145"',
        "Sec-CH-UA-Platform": '"Windows"',
        "Sec-CH-UA-Mobile": "?0",
        "Upgrade-Insecure-Requests": "1",
    }

    # TLS / certificados: si se define HTTPS_CERT_PATH lo usamos como CA,
    # si no dejamos la verificación por defecto.
    https_cert_path = os.environ.get("HTTPS_CERT_PATH")
    verify: object
    if https_cert_path:
        verify = https_cert_path
    else:
        verify = True

    logger.info("AIR: descargando desde %s", url)
    try:
        # La llamada observada es un GET con los parámetros en la querystring.
        # Imitamos ese patrón (GET + params) y headers de navegador.
        resp = requests.get(url, params=body, headers=headers, timeout=120, verify=verify)
        resp.raise_for_status()
        content_type = (resp.headers.get("content-type") or "").lower()
        if "text/csv" not in content_type and "application/octet-stream" not in content_type:
            # Aun así devolvemos el contenido para que el parser pueda inspeccionarlo,
            # pero dejamos el warning para debugging.
            logger.warning(
                "AIR: content-type inesperado (%s) al descargar listado.", content_type or "?"
            )
        size_kb = round(len(resp.content) / 1024, 1)
        logger.info("AIR: descarga ok, %s KB", size_kb)
        return resp.content
    except requests.RequestException as exc:
        logger.exception("Error descargando listado AIR: %s", exc)
        return None

