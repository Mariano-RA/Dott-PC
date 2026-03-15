"""Parser para proveedor NB (CSV o Excel con delimitador ;)."""
import logging
from typing import List

from domain import calcular_precio

from .base import rows_from_csv_or_excel

logger = logging.getLogger(__name__)


def parse(archivo_bytesio) -> List[dict]:
    """Envía categoriaRaw para que el backend resuelva con el maestro."""
    try:
        file_data = archivo_bytesio.read()
        csv_data = rows_from_csv_or_excel(
            file_data, csv_delimiter=";", csv_encoding="utf-8"
        )
        data = []
        rows = csv_data[1:] if len(csv_data) > 1 else []
        for row in rows:
            if len(row) < 11:
                continue
            cat_raw = str(row[2]).strip() if len(row) > 2 else ""
            registro = {
                "proveedor": "nb",
                "producto": row[3],
                "categoriaRaw": cat_raw,
                "categoria": cat_raw,
                "precio": calcular_precio(row[10]),
            }
            data.append(registro)
        return data
    except Exception as ex:
        logger.exception("Error procesando datos del proveedor NB: %s", ex)
        return []
