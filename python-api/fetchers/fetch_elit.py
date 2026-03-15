"""
Fetcher Elit:
- Preferido (si hay USER_ID + TOKEN): descarga CSV completo
  GET https://clientes.elit.com.ar/v1/api/productos/csv?user_id=...&token=...
- Alternativo (si sólo hay TOKEN): descarga XLSX vía API Web
  GET https://new.api.elit.com.ar/v1/web/account/priceList  (Bearer token)
Devuelve siempre bytes del archivo (CSV o XLSX).
"""

import logging
from typing import Optional

import requests

from .base import get_supplier_credentials

logger = logging.getLogger(__name__)

DEFAULT_ELIT_CSV_URL = "https://clientes.elit.com.ar/v1/api/productos/csv"
DEFAULT_ELIT_XLSX_URL = "https://new.api.elit.com.ar/v1/web/account/priceList"


def fetch_elit() -> Optional[bytes]:
    creds = get_supplier_credentials("elit")
    url = (creds.get("url") or "").strip()

    uid_raw = creds.get("user_id") or creds.get("user")  # fallback legacy
    token = creds.get("token") or creds.get("api_key") or creds.get("password")

    try:
        # 1) Preferir CSV si hay user_id + token (mismo token sirve para este endpoint)
        if uid_raw is not None and str(uid_raw).strip() != "" and token is not None and str(token).strip() != "":
            try:
                user_id = int(str(uid_raw).strip())
            except ValueError:
                logger.warning("SUPPLIER_ELIT_USER_ID inválido: %r", uid_raw)
                user_id = None

            if user_id is not None:
                csv_url = url or DEFAULT_ELIT_CSV_URL
                logger.info("Elit: descargando desde %s (CSV)", csv_url)
                r = requests.get(
                    csv_url,
                    params={"user_id": user_id, "token": str(token).strip()},
                    timeout=180,
                )
                r.raise_for_status()
                content = r.content
                if content:
                    size_kb = round(len(content) / 1024, 1)
                    logger.info("Elit: descarga ok (CSV), %s KB", size_kb)
                    return content

        # 2) Fallback a XLSX por Bearer si hay token
        if token is None or str(token).strip() == "":
            logger.warning("SUPPLIER_ELIT_TOKEN no configurado.")
            return None

        xlsx_url = url or DEFAULT_ELIT_XLSX_URL
        headers = {
            "Authorization": f"Bearer {str(token).strip()}",
            "Accept": "application/json, text/plain, */*",
        }
        logger.info("Elit: descargando desde %s (XLSX)", xlsx_url)
        r = requests.get(xlsx_url, headers=headers, timeout=180)
        r.raise_for_status()
        content = r.content
        if content:
            size_kb = round(len(content) / 1024, 1)
            logger.info("Elit: descarga ok (XLSX), %s KB", size_kb)
    except requests.RequestException as e:
        logger.exception("Error descargando listado de Elit: %s", e)
        return None

    if not content:
        logger.warning("Elit devolvió respuesta vacía.")
        return None

    return content

