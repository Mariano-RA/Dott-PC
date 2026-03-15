"""
Fetcher NB: descarga CSV del listado usando hard token en la URL.
GET https://api.nb.com.ar/v1/priceListCsv/{token}
Env: SUPPLIER_NB_URL (base o completa), SUPPLIER_NB_API_KEY o SUPPLIER_NB_TOKEN.
"""
import logging
from typing import Optional

import requests

from .base import get_supplier_credentials

logger = logging.getLogger(__name__)

DEFAULT_NB_BASE_URL = "https://api.nb.com.ar/v1/priceListCsv"


def fetch_nb() -> Optional[bytes]:
    creds = get_supplier_credentials("nb")
    url = (creds.get("url") or "").strip() or DEFAULT_NB_BASE_URL
    token = (creds.get("token") or creds.get("api_key") or "").strip()

    if not token:
        if "/priceListCsv/" in url and url.rstrip("/").split("/")[-1]:
            final_url = url
        else:
            logger.warning("SUPPLIER_NB: falta token (API_KEY o TOKEN).")
            return None
    else:
        base = url.rstrip("/")
        final_url = f"{base}/{token}"

    logger.info("NB: descargando listado (URL configurada)")
    try:
        r = requests.get(final_url, timeout=120)
        r.raise_for_status()
        size_kb = round(len(r.content) / 1024, 1)
        logger.info("NB: descarga ok, %s KB", size_kb)
        return r.content
    except requests.RequestException as e:
        logger.exception("Error descargando listado NB: %s", e)
        return None
