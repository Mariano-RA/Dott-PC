"""
Fetcher genérico: GET a URL con Basic Auth o Bearer (API_KEY).
"""
import logging
from typing import Optional

import requests

from .base import get_supplier_credentials

logger = logging.getLogger(__name__)


def fetch_by_name(proveedor: str) -> Optional[bytes]:
    creds = get_supplier_credentials(proveedor)
    url = creds.get("url")
    if not url:
        logger.warning("SUPPLIER_%s_URL no configurado.", proveedor.upper())
        return None
    user = creds.get("user")
    password = creds.get("password")
    api_key = creds.get("api_key")
    auth = (user, password) if (user and password) else None
    headers = {}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    try:
        r = requests.get(url, auth=auth, headers=headers or None, timeout=120)
        r.raise_for_status()
        return r.content
    except requests.RequestException as e:
        logger.exception("Error descargando listado %s: %s", proveedor, e)
        return None
