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
            codigo = str(row[0]).strip() if len(row) > 0 else ""
            cat_raw = str(row[5]).strip() if len(row) > 5 else ""
            # URL de imagen por código (ajustar si Eikon usa otro patrón)
            imagen_url = f"https://www.eikonweb.com.ar/img/{codigo}.jpg" if codigo else ""
            registro = {
                "proveedor": "eikon",
                "codigo": codigo,
                "producto": row[1],
                "categoriaRaw": cat_raw,
                "categoria": cat_raw,
                "precio": calcular_precio(row[3]),
                "imagenUrl": imagen_url or None,
            }
            data.append(registro)
        return data
    except Exception as ex:
        logger.exception("Error procesando datos del proveedor EIKON: %s", ex)
        return []
