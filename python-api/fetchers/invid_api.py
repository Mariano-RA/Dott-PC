"""
Cliente de la APIv1 de Invid Computers (JWT + catálogo de artículos).

POST /api/v1/auth.php → access_token (24h)
GET  /api/v1/articulo.php → páginas de hasta 100 artículos (límite 50 req/h)
Filtros: exclude_zero_price=1, exclude_zero_stock=1
"""
from __future__ import annotations

import logging
import time
from typing import Any, Dict, List, Optional
from urllib.parse import parse_qs, urljoin, urlparse

import requests

from .base import get_supplier_credentials, get_supplier_env

logger = logging.getLogger(__name__)

DEFAULT_INVID_API_BASE = "https://www.invidcomputers.com"
AUTH_PATH = "/api/v1/auth.php"
ARTICULO_PATH = "/api/v1/articulo.php"
REQUEST_TIMEOUT_S = 60
MAX_429_RETRIES = 2


def _api_base_url() -> str:
    override = (get_supplier_env("invid", "API_URL") or "").strip().rstrip("/")
    return override or DEFAULT_INVID_API_BASE


def authenticate(session: Optional[requests.Session] = None) -> Optional[str]:
    """Autentica y devuelve el access_token JWT, o None si falla."""
    creds = get_supplier_credentials("invid")
    user = (creds.get("user") or "").strip()
    password = (creds.get("password") or "").strip()
    if not user or not password:
        logger.warning("SUPPLIER_INVID_USER/PASSWORD no configurado para API.")
        return None

    sess = session or requests.Session()
    url = urljoin(_api_base_url() + "/", AUTH_PATH.lstrip("/"))
    try:
        r = sess.post(
            url,
            json={"username": user, "password": password},
            headers={"Accept": "application/json", "Content-Type": "application/json"},
            timeout=REQUEST_TIMEOUT_S,
        )
        if r.status_code not in (200, 201):
            logger.error(
                "INVID API auth falló: HTTP %s body=%s",
                r.status_code,
                (r.text or "")[:300],
            )
            return None
        payload = r.json()
        token = payload.get("access_token")
        if not token or payload.get("status") != 1:
            logger.error("INVID API auth: respuesta sin token válido: %s", payload)
            return None
        logger.info(
            "INVID API: autenticado (expira en %ss).",
            payload.get("expiration_time", "?"),
        )
        return str(token)
    except (requests.RequestException, ValueError) as e:
        logger.exception("INVID API auth error: %s", e)
        return None


def _offset_from_next_page_url(next_page_url: Optional[str]) -> Optional[int]:
    if not next_page_url:
        return None
    try:
        qs = parse_qs(urlparse(next_page_url).query)
        raw = (qs.get("offset") or [None])[0]
        return int(raw) if raw is not None else None
    except (TypeError, ValueError):
        return None


def _get_articulos_page(
    sess: requests.Session,
    token: str,
    *,
    offset: int = 0,
) -> Optional[Dict[str, Any]]:
    """GET una página de artículos. Devuelve el JSON o None si falla sin retry."""
    url = urljoin(_api_base_url() + "/", ARTICULO_PATH.lstrip("/"))
    params: Dict[str, Any] = {
        "exclude_zero_price": 1,
        "exclude_zero_stock": 1,
    }
    if offset:
        params["offset"] = offset

    for attempt in range(MAX_429_RETRIES + 1):
        try:
            r = sess.get(
                url,
                params=params,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Accept": "application/json",
                },
                timeout=REQUEST_TIMEOUT_S,
            )
        except requests.RequestException as e:
            logger.exception("INVID API articulo offset=%s: %s", offset, e)
            return None

        if r.status_code == 429:
            retry_after = r.headers.get("Retry-After")
            wait_s = int(retry_after) if retry_after and str(retry_after).isdigit() else 60
            if attempt >= MAX_429_RETRIES:
                logger.error(
                    "INVID API rate limit agotado en offset=%s (Retry-After=%s).",
                    offset,
                    wait_s,
                )
                return None
            logger.warning(
                "INVID API 429 en offset=%s; esperando %ss (intento %s/%s).",
                offset,
                wait_s,
                attempt + 1,
                MAX_429_RETRIES,
            )
            time.sleep(wait_s)
            continue

        if r.status_code != 200:
            logger.error(
                "INVID API articulo HTTP %s offset=%s body=%s",
                r.status_code,
                offset,
                (r.text or "")[:300],
            )
            return None

        try:
            return r.json()
        except ValueError:
            logger.error("INVID API articulo: JSON inválido en offset=%s", offset)
            return None

    return None


def fetch_all_articulos() -> List[Dict[str, Any]]:
    """
    Pagina el catálogo completo y devuelve la lista de artículos (dicts crudos de la API).
    """
    sess = requests.Session()
    token = authenticate(sess)
    if not token:
        return []

    articles: List[Dict[str, Any]] = []
    offset = 0
    page = 0
    with_image = 0

    while True:
        page += 1
        payload = _get_articulos_page(sess, token, offset=offset)
        if not payload or payload.get("status") != 1:
            if page == 1:
                logger.error("INVID API: primera página falló o status!=1.")
            break

        data = payload.get("data")
        if isinstance(data, dict):
            batch = [data]
        elif isinstance(data, list):
            batch = data
        else:
            batch = []

        for item in batch:
            if isinstance(item, dict):
                articles.append(item)
                if item.get("IMAGE_URL"):
                    with_image += 1

        logger.info(
            "INVID API: página %s offset=%s → %s arts (acum=%s, con imagen=%s).",
            page,
            offset,
            len(batch),
            len(articles),
            with_image,
        )

        next_offset = _offset_from_next_page_url(payload.get("next_page_url"))
        if next_offset is None or next_offset <= offset or not batch:
            break
        offset = next_offset

    logger.info(
        "INVID API: catálogo completo %s artículos (%s con IMAGE_URL) en %s páginas.",
        len(articles),
        with_image,
        page,
    )
    return articles
