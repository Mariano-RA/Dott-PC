"""Parser para proveedor EIKON (Excel)."""
import io
import logging
from typing import List

import pandas as pd

from domain import calcular_precio

logger = logging.getLogger(__name__)


def parse(archivo_bytesio) -> List[dict]:
    """Envía categoriaRaw para que el backend resuelva con el maestro."""
    try:
        df = pd.read_excel(archivo_bytesio)
        df = df.drop([0, 1, 2, 3])
        df.reset_index(drop=True, inplace=True)
        data = []
        for _, row in df.iterrows():
            cat_raw = str(row[5]).strip() if len(row) > 5 else ""
            registro = {
                "proveedor": "eikon",
                "producto": row[1],
                "categoriaRaw": cat_raw,
                "categoria": cat_raw,
                "precio": calcular_precio(row[3]),
            }
            data.append(registro)
        return data
    except Exception as ex:
        logger.exception("Error procesando datos del proveedor EIKON: %s", ex)
        return []
