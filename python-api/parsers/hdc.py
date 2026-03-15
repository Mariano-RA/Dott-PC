"""Parser para proveedor HDC (Excel)."""
import logging
from typing import List

import pandas as pd

from domain import calcular_precio

logger = logging.getLogger(__name__)


def parse(archivo_bytesio) -> List[dict]:
    """Envía categoriaRaw para que el backend resuelva con el maestro."""
    try:
        df = pd.read_excel(archivo_bytesio)
        df = df.drop([0, 1]).reset_index(drop=True)
        data = []
        for _, row in df.iterrows():
            cat_raw = str(row[0]).strip() if len(row) > 0 else ""
            registro = {
                "proveedor": "hdc",
                "producto": row[3],
                "categoriaRaw": cat_raw,
                "categoria": cat_raw,
                "precio": calcular_precio(row[4], row[5]),
            }
            data.append(registro)
        return data
    except Exception as ex:
        logger.exception("Error procesando datos del proveedor HDC: %s", ex)
        return []
