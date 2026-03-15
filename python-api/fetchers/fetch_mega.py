"""
MEGA: listado público en https://www.mega-com.com.ar/xls/listado.xls. GET directo, sin login.
El .xls se convierte a CSV (con skip de 3 filas) y se procesa con el parser Mega.
"""
import logging
from typing import Optional

import requests

from .base import get_supplier_credentials

logger = logging.getLogger(__name__)

# URL por defecto del listado; se puede sobreescribir con SUPPLIER_MEGA_URL (base o completa).
DEFAULT_MEGA_LISTADO_URL = "https://www.mega-com.com.ar/xls/listado.xls"


def fetch_mega() -> Optional[bytes]:
    creds = get_supplier_credentials("mega") or {}
    url = (creds.get("url") or "").strip()
    if not url or "://" not in url:
        url = DEFAULT_MEGA_LISTADO_URL
    elif not url.lower().endswith((".xls", ".xl", ".xlsx")):
        # Solo si es URL base (dominio sin path al archivo), añadir path del listado
        from urllib.parse import urljoin
        base = url.rstrip("/") + "/"
        url = urljoin(base, "xls/listado.xls")
    try:
        logger.info("MEGA: descargando desde %s", url)
        r = requests.get(url, timeout=120)
        r.raise_for_status()
        if not r.content:
            logger.warning("MEGA: respuesta vacía.")
            return None
        size_kb = round(len(r.content) / 1024, 1)
        logger.info("MEGA: descarga ok, %s KB", size_kb)
        return r.content
    except requests.RequestException as e:
        logger.exception("MEGA: error descargando listado: %s", e)
        return None
