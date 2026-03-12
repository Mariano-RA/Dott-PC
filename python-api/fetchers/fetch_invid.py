import logging
from typing import Optional
from urllib.parse import urljoin

import requests

from .base import get_supplier_credentials

logger = logging.getLogger(__name__)


def _looks_like_html(content: bytes) -> bool:
    head = (content or b"")[:256].lstrip()
    return head.startswith(b"<!") or head.startswith(b"<html") or head.startswith(b"<HTML") or head.startswith(b"<!--") or head.startswith(b"<")


def fetch_invid() -> Optional[bytes]:
    """
    INVID descarga el XLSX con sesión (cookies PHPSESSID + whoami).
    La web loguea vía POST a login.php y luego GET a genera_excel.php.
    """
    creds = get_supplier_credentials("invid")
    url = creds.get("url") or ""
    user = creds.get("user") or ""
    password = creds.get("password") or ""

    if not url:
        logger.warning("SUPPLIER_INVID_URL no configurado.")
        return None
    if not user or not password:
        logger.warning("SUPPLIER_INVID_USER/PASSWORD no configurado.")
        return None

    base_url = "https://www.invidcomputers.com/"
    login_url = urljoin(base_url, "login.php")
    referer_url = urljoin(base_url, "home_usuario.php")

    session = requests.Session()
    headers = {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    }

    try:
        # Primer GET para obtener cookies iniciales (PHPSESSID).
        session.get(login_url, headers=headers, timeout=60)

        # Login como hace el JS del sitio.
        payload = {
            "login": "S",
            "usuari": user,
            "passwd": password,
            "volver": "",
        }
        r_login = session.post(login_url, headers=headers, data=payload, timeout=60)
        r_login.raise_for_status()

        # Descargar el XLSX autenticado.
        r = session.get(url, headers={**headers, "Referer": referer_url}, timeout=120)
        r.raise_for_status()

        ct = (r.headers.get("content-type") or "").lower()
        if "spreadsheet" not in ct and _looks_like_html(r.content):
            snippet = r.content[:250].decode("utf-8", errors="replace").replace("\n", " ")
            logger.error("INVID devolvió HTML en vez de XLSX. content-type=%s snippet=%s", ct, snippet)
            return None

        return r.content
    except requests.RequestException as e:
        logger.exception("Error descargando listado INVID: %s", e)
        return None
