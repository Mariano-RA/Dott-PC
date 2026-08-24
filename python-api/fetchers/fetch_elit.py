"""
Fetcher Elit:
- Preferido (si hay USER_ID + TOKEN): API JSON paginada
  POST https://clientes.elit.com.ar/v1/api/productos
  → list[dict] listos para carga_tabla (incluye atributos).
- Fallback CSV: GET …/productos/csv
- Fallback XLSX: GET Bearer priceList
Devuelve list[dict] o bytes (CSV/XLSX) o None.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, Union

import requests

from parsers.elit import registros_from_productos

from .base import get_supplier_credentials

logger = logging.getLogger(__name__)

DEFAULT_ELIT_API_URL = "https://clientes.elit.com.ar/v1/api/productos"
DEFAULT_ELIT_CSV_URL = "https://clientes.elit.com.ar/v1/api/productos/csv"
DEFAULT_ELIT_XLSX_URL = "https://new.api.elit.com.ar/v1/web/account/priceList"
PAGE_LIMIT = 100
REQUEST_TIMEOUT_S = 180


def _extract_product_list(payload: Any) -> List[Dict[str, Any]]:
    if isinstance(payload, list):
        return [p for p in payload if isinstance(p, dict)]
    if not isinstance(payload, dict):
        return []
    for key in ("resultado", "productos", "data", "items"):
        val = payload.get(key)
        if isinstance(val, list):
            return [p for p in val if isinstance(p, dict)]
    return []


def _elit_api_params(offset: int) -> Dict[str, int]:
    """Query params. No enviar offset=0: la API lo trata como inválido (HTTP 400)."""
    params: Dict[str, int] = {"limit": PAGE_LIMIT}
    if offset > 0:
        params["offset"] = offset
    return params


def _raise_for_status_with_body(r: requests.Response) -> None:
    try:
        r.raise_for_status()
    except requests.HTTPError:
        logger.error("Elit API HTTP %s: %s", r.status_code, (r.text or "")[:500])
        raise


def _paginador_total(payload: Any) -> Optional[int]:
    if not isinstance(payload, dict):
        return None
    pag = payload.get("paginador")
    if not isinstance(pag, dict):
        return None
    raw = pag.get("total")
    try:
        return int(raw) if raw is not None else None
    except (TypeError, ValueError):
        return None


def _fetch_elit_json_api(user_id: int, token: str) -> Optional[List[dict]]:
    """Paginación POST /v1/api/productos → registros carga_tabla."""
    all_items: List[Dict[str, Any]] = []
    offset = 0
    while True:
        params = _elit_api_params(offset)
        logger.info("Elit: POST API offset=%s limit=%s", offset, PAGE_LIMIT)
        r = requests.post(
            DEFAULT_ELIT_API_URL,
            params=params,
            json={"user_id": user_id, "token": token},
            headers={"Content-Type": "application/json"},
            timeout=REQUEST_TIMEOUT_S,
        )
        _raise_for_status_with_body(r)
        try:
            payload = r.json()
        except ValueError:
            logger.error("Elit API: respuesta no JSON (offset=%s).", offset)
            return None
        page = _extract_product_list(payload)
        if not page:
            break
        all_items.extend(page)
        offset += PAGE_LIMIT
        total = _paginador_total(payload)
        if total is not None and offset >= total:
            break
        if total is None and len(page) < PAGE_LIMIT:
            break

    if not all_items:
        logger.warning("Elit API JSON: sin productos.")
        return None

    data = registros_from_productos(all_items)
    if not data:
        logger.warning("Elit API JSON: ningún producto mapeable tras filtros.")
        return None
    con_attrs = sum(1 for d in data if d.get("atributos"))
    logger.info(
        "Elit API JSON: %s productos (%s con atributos).",
        len(data),
        con_attrs,
    )
    return data


def _fetch_elit_file_fallback(
    uid_raw: Any, token: Optional[str], url_override: str
) -> Optional[bytes]:
    content: Optional[bytes] = None
    try:
        if (
            uid_raw is not None
            and str(uid_raw).strip() != ""
            and token is not None
            and str(token).strip() != ""
        ):
            try:
                user_id = int(str(uid_raw).strip())
            except ValueError:
                logger.warning("SUPPLIER_ELIT_USER_ID inválido: %r", uid_raw)
                user_id = None

            if user_id is not None:
                csv_url = url_override or DEFAULT_ELIT_CSV_URL
                # Si la URL override apunta al endpoint JSON, usar CSV default.
                if csv_url.rstrip("/").endswith("/productos"):
                    csv_url = DEFAULT_ELIT_CSV_URL
                logger.info("Elit: fallback CSV desde %s", csv_url)
                r = requests.get(
                    csv_url,
                    params={"user_id": user_id, "token": str(token).strip()},
                    timeout=REQUEST_TIMEOUT_S,
                )
                r.raise_for_status()
                content = r.content
                if content:
                    size_kb = round(len(content) / 1024, 1)
                    logger.info("Elit: descarga ok (CSV), %s KB", size_kb)
                    return content

        if token is None or str(token).strip() == "":
            logger.warning("SUPPLIER_ELIT_TOKEN no configurado.")
            return None

        xlsx_url = url_override or DEFAULT_ELIT_XLSX_URL
        if "clientes.elit.com.ar" in xlsx_url:
            xlsx_url = DEFAULT_ELIT_XLSX_URL
        headers = {
            "Authorization": f"Bearer {str(token).strip()}",
            "Accept": "application/json, text/plain, */*",
        }
        logger.info("Elit: fallback XLSX desde %s", xlsx_url)
        r = requests.get(xlsx_url, headers=headers, timeout=REQUEST_TIMEOUT_S)
        r.raise_for_status()
        content = r.content
        if content:
            size_kb = round(len(content) / 1024, 1)
            logger.info("Elit: descarga ok (XLSX), %s KB", size_kb)
            return content
    except requests.RequestException as e:
        logger.exception("Error descargando listado de Elit (fallback): %s", e)
        return None

    if not content:
        logger.warning("Elit devolvió respuesta vacía.")
        return None
    return content


def fetch_elit() -> Optional[Union[List[dict], bytes]]:
    creds = get_supplier_credentials("elit")
    url = (creds.get("url") or "").strip()
    uid_raw = creds.get("user_id") or creds.get("user")
    token = creds.get("token") or creds.get("api_key") or creds.get("password")

    if uid_raw is not None and str(uid_raw).strip() != "" and token is not None and str(token).strip() != "":
        try:
            user_id = int(str(uid_raw).strip())
        except ValueError:
            logger.warning("SUPPLIER_ELIT_USER_ID inválido: %r", uid_raw)
            user_id = None

        if user_id is not None:
            try:
                data = _fetch_elit_json_api(user_id, str(token).strip())
                if data:
                    return data
                logger.warning("Elit API JSON vacía; intentando CSV/XLSX.")
            except requests.RequestException as e:
                logger.exception("Elit API JSON falló; fallback archivo: %s", e)

    return _fetch_elit_file_fallback(uid_raw, token, url)
