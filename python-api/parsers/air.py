"""Parser para proveedor AIR (CSV con encoding iso-8859-1)."""
import csv
import logging
from typing import List

from domain import calcular_precio

logger = logging.getLogger(__name__)


def parse(archivo_bytesio) -> List[dict]:
    """
    Equivalente a la implementación original de tablaAir:
      - Lee CSV iso-8859-1
      - Delimitador coma
      - Salta header
      - Filtra filas donde columnas 5–8 sean todas distintas de "0"
    Envía categoriaRaw para que el backend resuelva con el maestro.
    """
    try:
        csv_reader = archivo_bytesio.read().decode("iso-8859-1").splitlines()
        data = []
        csv_reader = csv.reader(csv_reader, delimiter=",")
        next(csv_reader)
        for row in csv_reader:
            if all(x != "0" for x in row[5:9]):
                cat_raw = str(row[10]).strip() if len(row) > 10 else ""
                registro = {
                    "proveedor": "air",
                    "producto": row[1],
                    "categoriaRaw": cat_raw,
                    "categoria": cat_raw,
                    "precio": calcular_precio(row[2], row[4]),
                }
                data.append(registro)
        return data
    except Exception as ex:
        logger.exception("Error procesando datos del proveedor AIR: %s", ex)
        return []
