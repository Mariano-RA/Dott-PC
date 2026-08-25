"""Parser / enricher para proveedor AIR (CSV + detalle mas_info)."""
from __future__ import annotations

import csv
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List, Optional

import requests

from domain import calcular_precio

from .description import clean_plain_text

logger = logging.getLogger(__name__)

DEFAULT_MAS_INFO_URL = "https://air-intra.com.ar/2025/ar/mas_info.php"
MAS_INFO_TIMEOUT_S = 20
MAS_INFO_MAX_WORKERS = 8


def parse_csv_bytes(raw: bytes) -> List[dict]:
    """Parsea el CSV AIR sin enriquecer descripciones."""
    csv_reader = raw.decode("iso-8859-1").splitlines()
    data = []
    reader = csv.reader(csv_reader, delimiter=",")
    next(reader)
    for row in reader:
        if all(x != "0" for x in row[5:9]):
            codigo = str(row[0]).strip() if len(row) > 0 else ""
            cat_raw = str(row[10]).strip() if len(row) > 10 else ""
            registro = {
                "proveedor": "air",
                "codigo": codigo,
                "producto": row[1],
                "categoriaRaw": cat_raw,
                "categoria": cat_raw,
                "precio": calcular_precio(row[2], row[4]),
                "imagenUrl": None,
                "descripcion": None,
            }
            data.append(registro)
    return data


def parse(archivo_bytesio) -> List[dict]:
    """
    Equivalente a la implementación original de tablaAir:
      - Lee CSV iso-8859-1
      - Delimitador coma
      - Salta header
      - Filtra filas donde columnas 5–8 sean todas distintas de "0"
    Envía categoriaRaw para que el backend resuelva con el maestro.
    No llama a mas_info (usar enrich_descripciones / fetch_air).
    """
    try:
        return parse_csv_bytes(archivo_bytesio.read())
    except Exception as ex:
        logger.exception("Error procesando datos del proveedor AIR: %s", ex)
        return []


def _fetch_mas_info_texto(
    session: requests.Session,
    codigo: str,
    *,
    base_url: str = DEFAULT_MAS_INFO_URL,
) -> Optional[str]:
    if not codigo:
        return None
    try:
        r = session.get(
            base_url,
            params={"codiart": codigo},
            timeout=MAS_INFO_TIMEOUT_S,
        )
        r.raise_for_status()
        payload = r.json()
        texto = payload.get("texto") if isinstance(payload, dict) else None
        if texto is None:
            return None
        return clean_plain_text(texto)
    except Exception as ex:
        logger.debug("AIR mas_info falló para %s: %s", codigo, ex)
        return None


def enrich_descripciones(
    registros: List[dict],
    *,
    session: Optional[requests.Session] = None,
    max_workers: int = MAS_INFO_MAX_WORKERS,
    base_url: str = DEFAULT_MAS_INFO_URL,
) -> List[dict]:
    """Completa `descripcion` vía GET mas_info.php?codiart=… (fallos suaves)."""
    if not registros:
        return registros

    own_session = session is None
    sess = session or requests.Session()
    codes = [str(r.get("codigo") or "").strip() for r in registros]
    unique_codes = [c for c in dict.fromkeys(codes) if c]
    textos: dict = {}

    def _one(code: str) -> tuple:
        return code, _fetch_mas_info_texto(sess, code, base_url=base_url)

    workers = max(1, min(max_workers, len(unique_codes)))
    try:
        with ThreadPoolExecutor(max_workers=workers) as pool:
            futures = [pool.submit(_one, c) for c in unique_codes]
            for fut in as_completed(futures):
                code, texto = fut.result()
                if texto:
                    textos[code] = texto
    finally:
        if own_session:
            sess.close()

    filled = 0
    for reg in registros:
        code = str(reg.get("codigo") or "").strip()
        if code and code in textos:
            reg["descripcion"] = textos[code]
            filled += 1
        elif "descripcion" not in reg:
            reg["descripcion"] = None

    logger.info(
        "AIR mas_info: %s/%s productos con descripción.",
        filled,
        len(registros),
    )
    return registros
