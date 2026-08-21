"""Parser para proveedor NB (CSV o Excel con delimitador ;)."""
import logging
from typing import List, Optional

from domain import calcular_precio

from .base import rows_from_csv_or_excel

logger = logging.getLogger(__name__)


def _header_index(header: List[str], *names: str) -> Optional[int]:
    lowered = [str(c).strip().lower() for c in header]
    wanted = {n.lower() for n in names}
    for i, name in enumerate(lowered):
        if name in wanted:
            return i
    return None


def parse(archivo_bytesio) -> List[dict]:
    """Envía categoriaRaw para que el backend resuelva con el maestro."""
    try:
        file_data = archivo_bytesio.read()
        csv_data = rows_from_csv_or_excel(
            file_data, csv_delimiter=";", csv_encoding="utf-8"
        )
        data = []
        if not csv_data:
            return []
        header = csv_data[0] if csv_data else []
        atributos_i = _header_index(header, "atributos", "atributo", "descripcion", "descripción")
        rows = csv_data[1:] if len(csv_data) > 1 else []
        for row in rows:
            if len(row) < 11:
                continue
            codigo = str(row[0]).strip() if len(row) > 0 else ""
            cat_raw = str(row[2]).strip() if len(row) > 2 else ""
            imagen_url = str(row[4]).strip() if len(row) > 4 else ""
            descripcion = None
            if atributos_i is not None and atributos_i < len(row):
                raw_desc = str(row[atributos_i]).strip()
                descripcion = raw_desc or None
            registro = {
                "proveedor": "nb",
                "codigo": codigo,
                "producto": row[3],
                "categoriaRaw": cat_raw,
                "categoria": cat_raw,
                "precio": calcular_precio(row[10]),
                "imagenUrl": imagen_url or None,
                "descripcion": descripcion,
            }
            data.append(registro)
        return data
    except Exception as ex:
        logger.exception("Error procesando datos del proveedor NB: %s", ex)
        return []
