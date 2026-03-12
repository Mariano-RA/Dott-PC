"""
MEGA: el listado es público en xls/listado.xls. GET directo, sin login.
Luego dottDB convierte el .xls a CSV con ";" y procesa con tablaMega.
"""
from typing import Optional
from urllib.parse import urljoin

import requests

from .base import get_supplier_credentials


def fetch_mega() -> Optional[bytes]:
    url = (get_supplier_credentials("mega") or {}).get("url") or ""
    if not url or "://" not in url:
        return None
    base = url.split("/", 3)[0] + "//" + url.split("/", 3)[2] + "/"
    xls_url = urljoin(base, "xls/listado.xls")
    try:
        r = requests.get(xls_url, timeout=120)
        r.raise_for_status()
        ct = (r.headers.get("content-type") or "").lower()
        if "excel" in ct or "spreadsheet" in ct or r.content[:8] == b"\xD0\xCF\x11\xE0\xA1\xB1\x1A\xE1":
            return r.content
        return None
    except requests.RequestException:
        return None
