"""
Parser para proveedor MEGA.
Acepta CSV con separador ; o Excel (.xls/.xlsx); si es Excel lo convierte a CSV antes de parsear.
"""
import io
import logging
from typing import List

from domain import calcular_precio

from .base import excel_to_csv_text, is_excel_binary

logger = logging.getLogger(__name__)


def _parse_mega_csv(archivo_bytesio) -> List[dict]:
    """Parsea el contenido CSV con formato MEGA (líneas categoría que terminan en ;;;;).
    Jerarquía: la primera línea ;;;; de cada bloque es categoría principal (ej. MEMORIAS),
    las siguientes ;;;; son subcategorías (ej. Para Notebooks, SD - MicroSD). Se envía
    categoriaRaw como combinado 'principal > subcategoría' para que el backend resuelva.
    """
    csv_data = archivo_bytesio.read().decode("utf-8", errors="replace").splitlines()
    registros = []
    main_category = ""
    sub_category = ""
    prev_was_category = False
    for line in csv_data:
        if line.endswith(";;;;"):
            cat_label = line.split(";")[0].strip()
            if not prev_was_category:
                main_category = cat_label
                sub_category = ""
            else:
                sub_category = cat_label
            prev_was_category = True
        else:
            prev_was_category = False
            partes = line.strip().split(";")
            if len(partes) < 5:
                continue
            producto = partes[1].strip().replace('"', "")
            try:
                precio_ars = float(partes[2].replace("U$s", "").strip())
                iva_porcentaje = float(
                    partes[4].strip().replace("+", "").replace("%", "")
                )
            except (ValueError, TypeError):
                continue
            precio_final = calcular_precio(precio_ars, iva_porcentaje)
            cat_raw = main_category if main_category else ""
            if sub_category:
                cat_raw = f"{cat_raw} > {sub_category}" if cat_raw else sub_category
            registros.append(
                {
                    "proveedor": "mega",
                    "producto": producto,
                    "categoriaRaw": cat_raw,
                    "categoria": cat_raw,
                    "precio": precio_final,
                }
            )
    return registros


# Filas vacías/cabecera que suelen venir al inicio del listado Mega (.xls)
MEGA_EXCEL_SKIP_ROWS = 3


def parse(archivo_bytesio) -> List[dict]:
    try:
        raw = archivo_bytesio.read()
        if is_excel_binary(raw):
            csv_text = excel_to_csv_text(raw, skip_rows=MEGA_EXCEL_SKIP_ROWS)
            archivo_bytesio = io.BytesIO(csv_text.encode("utf-8"))
        else:
            archivo_bytesio = io.BytesIO(raw)
        registros = _parse_mega_csv(archivo_bytesio)
        if not registros:
            logger.warning(
                "MEGA: el parser no extrajo ningún producto (revisar formato del listado)."
            )
        else:
            logger.info("MEGA: parseados %d productos.", len(registros))
        return registros
    except Exception as ex:
        logger.exception("Error procesando datos del proveedor MEGA: %s", ex)
        return []
