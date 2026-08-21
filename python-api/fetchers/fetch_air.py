"""
Fetcher AIR: descarga CSV de precios desde descargas.php y enriquece
descripciones vía mas_info.php?codiart=.

Requiere sesión: POST de login a /2025/ar/ (urbid/urbpass) y luego
GET https://www.air-intra.com/2025/consultas/descargas.php?type=csv&q={...}

Config vía env:
- SUPPLIER_AIR_URL: URL base de descargas (por defecto descargas.php).
- SUPPLIER_AIR_USER / SUPPLIER_AIR_PASSWORD: credenciales de la intranet.

Devuelve list[dict] listos para carga_tabla (con descripcion cuando mas_info responde).
"""
import json
import logging
import os
from typing import List, Optional
from urllib.parse import urljoin

import requests

from parsers.air import enrich_descripciones, parse_csv_bytes

from .base import get_supplier_credentials

logger = logging.getLogger(__name__)

DEFAULT_AIR_BASE = "https://www.air-intra.com/2025/"
DEFAULT_AIR_URL = urljoin(DEFAULT_AIR_BASE, "consultas/descargas.php")
DEFAULT_AIR_LOGIN_URL = urljoin(DEFAULT_AIR_BASE, "ar/")
DEFAULT_AIR_REFERER = DEFAULT_AIR_LOGIN_URL
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


def _looks_like_html(content: bytes) -> bool:
    head = (content or b"")[:256].lstrip()
    return (
        head.startswith(b"<!")
        or head.startswith(b"<html")
        or head.startswith(b"<HTML")
        or head.startswith(b"<!--")
        or head.startswith(b"<")
    )


def _is_session_error(resp: requests.Response) -> bool:
    url = (resp.url or "").upper()
    if "SESION" in url or "SESI%C3%93N" in url:
        return True
    head = (resp.content or b"")[:800].upper()
    return b"SESION FINALIZADA" in head or b"SESI\xc3\x93N FINALIZADA" in head


def fetch_air() -> Optional[List[dict]]:
    """
    Login a la intranet AIR, descarga el CSV, parsea y enriquece descripciones.
    Devuelve list[dict] o None si falla.
    """
    creds = get_supplier_credentials("air")
    url = (creds.get("url") or "").strip() or DEFAULT_AIR_URL
    user = (creds.get("user") or "").strip()
    password = (creds.get("password") or "").strip()

    if not user or not password:
        logger.warning("SUPPLIER_AIR_USER/PASSWORD no configurado.")
        return None

    q_payload = _default_query_payload()
    params = {
        "type": "csv",
        "q": json.dumps(q_payload, separators=(",", ":")),
    }

    headers = {
        "User-Agent": DEFAULT_USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Sec-CH-UA": '"Not:A-Brand";v="99", "Google Chrome";v="145", "Chromium";v="145"',
        "Sec-CH-UA-Platform": '"Windows"',
        "Sec-CH-UA-Mobile": "?0",
        "Upgrade-Insecure-Requests": "1",
    }

    https_cert_path = os.environ.get("HTTPS_CERT_PATH")
    verify: object = https_cert_path if https_cert_path else True

    session = requests.Session()
    logger.info("AIR: login + descarga desde %s", url)
    try:
        # Cookie PHPSESSID inicial (sesion_id de la meta coincide con session_id()).
        session.get(DEFAULT_AIR_LOGIN_URL, headers=headers, timeout=60, verify=verify)

        login_payload = {
            "p": "",
            "from": "",
            "urbid": user,
            "urbpass": password,
            "submit": "",
        }
        r_login = session.post(
            DEFAULT_AIR_LOGIN_URL,
            headers={**headers, "Referer": DEFAULT_AIR_REFERER},
            data=login_payload,
            timeout=60,
            verify=verify,
        )
        r_login.raise_for_status()
        if _is_session_error(r_login):
            logger.error("AIR: login rechazado (sesión finalizada).")
            return None

        resp = session.get(
            url,
            params=params,
            headers={**headers, "Referer": DEFAULT_AIR_REFERER},
            timeout=120,
            verify=verify,
        )
        resp.raise_for_status()

        if _is_session_error(resp):
            logger.error("AIR: sesión inválida al descargar listado (%s).", resp.url)
            return None

        content_type = (resp.headers.get("content-type") or "").lower()
        if "text/csv" not in content_type and "application/octet-stream" not in content_type:
            if _looks_like_html(resp.content):
                snippet = resp.content[:250].decode("utf-8", errors="replace").replace("\n", " ")
                logger.error(
                    "AIR: devolvió HTML en vez de CSV. content-type=%s snippet=%s",
                    content_type or "?",
                    snippet,
                )
                return None
            logger.warning(
                "AIR: content-type inesperado (%s) al descargar listado.", content_type or "?"
            )

        size_kb = round(len(resp.content) / 1024, 1)
        logger.info("AIR: descarga ok, %s KB", size_kb)
        try:
            registros = parse_csv_bytes(resp.content)
        except Exception as ex:
            logger.exception("AIR: error parseando CSV: %s", ex)
            return None
        if not registros:
            logger.warning("AIR: CSV sin productos mapeables.")
            return None
        return enrich_descripciones(registros, session=session)
    except requests.RequestException as exc:
        logger.exception("Error descargando listado AIR: %s", exc)
        return None
    finally:
        session.close()
