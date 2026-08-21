"""Parser / mapper para proveedor INVID.

Camino principal: artículos de la APIv1 → registros carga_tabla.
Legacy: Excel con filas de categoría (upload manual, sin imágenes).
"""
import logging
from typing import Any, Dict, List, Optional

import pandas as pd

from domain import calcular_precio

logger = logging.getLogger(__name__)


def articulo_to_registro(item: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Mapea un artículo de la API Invid al formato carga_tabla."""
    if not isinstance(item, dict):
        return None

    codigo = str(item.get("ID") or "").strip()
    titulo = item.get("TITLE")
    if not codigo or titulo is None or str(titulo).strip() == "":
        return None

    precio_raw = item.get("FINAL_PRICE")
    if precio_raw is None or str(precio_raw).strip() in ("", "0", "0.00"):
        precio_raw = item.get("PRICE")
    if precio_raw is None or str(precio_raw).strip() in ("", "0", "0.00"):
        return None

    try:
        precio = calcular_precio(precio_raw)
    except (TypeError, ValueError):
        logger.warning("INVID: precio inválido para %s: %r", codigo, precio_raw)
        return None

    categoria = str(item.get("CATEGORY") or "").strip()
    imagen = item.get("IMAGE_URL")
    imagen_url = str(imagen).strip() if imagen else None
    if imagen_url == "":
        imagen_url = None

    return {
        "proveedor": "invid",
        "codigo": codigo,
        "producto": str(titulo).strip(),
        "categoriaRaw": categoria,
        "categoria": categoria,
        "precio": precio,
        "imagenUrl": imagen_url,
    }


def registros_from_articulos(articulos: List[Dict[str, Any]]) -> List[dict]:
    """Convierte una lista de artículos API en registros carga_tabla."""
    data: List[dict] = []
    for item in articulos:
        reg = articulo_to_registro(item)
        if reg:
            data.append(reg)
    return data


def parse(archivo_bytesio) -> List[dict]:
    """Legacy Excel: envía categoriaRaw para que el backend resuelva con el maestro."""
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
            # Col 9 = Precio Final (incluye IVA e Imp. Int.).
            if pd.notna(row[0]) and pd.notna(row[9]) and isinstance(row[9], (int, float)):
                codigo = str(row[0]).strip()
                registro = {
                    "proveedor": "invid",
                    "codigo": codigo or None,
                    "producto": row[1],
                    "categoriaRaw": categoria_actual,
                    "categoria": categoria_actual,
                    "precio": calcular_precio(row[9]),
                    "imagenUrl": None,
                }
                data.append(registro)
        return data
    except Exception as ex:
        logger.exception("Error procesando datos del proveedor INVID: %s", ex)
        return []
