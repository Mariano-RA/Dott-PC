"""Parser para proveedor INVID (Excel con filas de categoría)."""
import logging
from typing import List

import pandas as pd

from domain import calcular_precio

logger = logging.getLogger(__name__)


def parse(archivo_bytesio) -> List[dict]:
    """Envía categoriaRaw para que el backend resuelva con el maestro."""
    try:
        try:
            df = pd.read_excel(archivo_bytesio, header=None)
        except ValueError:
            try:
                archivo_bytesio.seek(0)
            except Exception:
                pass
            df = pd.read_excel(archivo_bytesio, header=None, engine="xlrd")
        df = df.drop([0, 1, 2, 3, 4, 5, 6]).reset_index(drop=True)
        categoria_actual = ""
        data = []
        for _, row in df.iterrows():
            if pd.isna(row[0]) or (
                row[0] == "" and len(str(row[1])) > 1
            ):
                categoria_actual = str(row[1]).strip()
                continue
            if pd.notna(row[0]) and isinstance(row[8], (int, float)):
                registro = {
                    "proveedor": "invid",
                    "producto": row[1],
                    "categoriaRaw": categoria_actual,
                    "categoria": categoria_actual,
                    "precio": calcular_precio(row[8]),
                }
                data.append(registro)
        return data
    except Exception as ex:
        logger.exception("Error procesando datos del proveedor INVID: %s", ex)
        return []
