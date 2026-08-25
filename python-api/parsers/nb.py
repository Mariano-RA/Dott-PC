"""Parser para proveedor NB (CSV o Excel con delimitador ;)."""
import csv
import io
import logging
from typing import List, Optional

from domain import calcular_precio

from .base import is_excel_binary, read_excel_to_rows
from .description import split_text_to_descripcion_atributos

logger = logging.getLogger(__name__)


def _header_index(header: List[str], *names: str) -> Optional[int]:
    lowered = [str(c).strip().lower() for c in header]
    wanted = {n.lower() for n in names}
    for i, name in enumerate(lowered):
        if name in wanted:
            return i
    return None


def _rows_from_nb_file(file_data: bytes) -> List[List[str]]:
    """Lee CSV/Excel de NB. En CSV preserva \\n dentro de campos entrecomillados (ATRIBUTOS)."""
    if is_excel_binary(file_data):
        return read_excel_to_rows(file_data)
    decoded = file_data.decode("utf-8", errors="replace")
    return list(csv.reader(io.StringIO(decoded, newline=""), delimiter=";"))


def parse(archivo_bytesio) -> List[dict]:
    """Envía categoriaRaw para que el backend resuelva con el maestro."""
    try:
        file_data = archivo_bytesio.read()
        csv_data = _rows_from_nb_file(file_data)
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
            atributos = None
            if atributos_i is not None and atributos_i < len(row):
                descripcion, atributos = split_text_to_descripcion_atributos(row[atributos_i])
            registro = {
                "proveedor": "nb",
                "codigo": codigo,
                "producto": row[3],
                "categoriaRaw": cat_raw,
                "categoria": cat_raw,
                "precio": calcular_precio(row[10]),
                "imagenUrl": imagen_url or None,
                "descripcion": descripcion,
                "atributos": atributos,
            }
            data.append(registro)
        return data
    except Exception as ex:
        logger.exception("Error procesando datos del proveedor NB: %s", ex)
        return []
