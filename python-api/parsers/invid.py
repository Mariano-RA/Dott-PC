"""Parser / mapper para proveedor INVID.

Camino principal: artículos de la APIv1 → registros carga_tabla.
Legacy: Excel con filas de categoría (upload manual, sin imágenes).
"""
import logging
from typing import Any, Dict, List, Optional

import pandas as pd

from domain import calcular_precio

logger = logging.getLogger(__name__)

# El Excel de Invid arma la ruta con " /" (espacio + slash, sin espacio después).
_CATEGORY_SEP = " /"


def _category_path(node: Dict[str, Any], all_cats: List[Dict[str, Any]]) -> str:
    """Reconstruye Padre /Hija /Nieta a partir de CATEGORIES + PARENT."""
    by_id = {str(c.get("ID")): c for c in all_cats if c.get("ID") is not None}
    by_name: Dict[str, Dict[str, Any]] = {}
    for cat in all_cats:
        name = str(cat.get("NAME") or "").strip()
        if name and name not in by_name:
            by_name[name] = cat

    names: List[str] = []
    seen = set()
    current: Optional[Dict[str, Any]] = node
    while current is not None:
        ident = current.get("ID") if current.get("ID") is not None else current.get("NAME")
        if ident in seen:
            break
        seen.add(ident)
        name = str(current.get("NAME") or "").strip()
        if name:
            names.append(name)

        parent = current.get("PARENT")
        if not isinstance(parent, dict):
            break
        parent_id = parent.get("ID")
        parent_name = str(parent.get("NAME") or "").strip()
        nxt: Optional[Dict[str, Any]] = None
        if parent_id is not None and str(parent_id) in by_id:
            nxt = by_id[str(parent_id)]
        elif parent_name and parent_name in by_name:
            nxt = by_name[parent_name]
        else:
            if parent_name:
                names.append(parent_name)
            break
        current = nxt

    names.reverse()
    return _CATEGORY_SEP.join(names)


def categoria_from_articulo(item: Dict[str, Any]) -> str:
    """Ruta de categoría estilo Excel; fallback a CATEGORY."""
    categories = item.get("CATEGORIES")
    if isinstance(categories, list):
        dicts = [c for c in categories if isinstance(c, dict)]
        if dicts:
            primary = next((c for c in dicts if c.get("IS_PRIMARY") is True), None)
            if primary is None:
                leaf = str(item.get("CATEGORY") or "").strip()
                if leaf:
                    primary = next(
                        (c for c in dicts if str(c.get("NAME") or "").strip() == leaf),
                        dicts[0],
                    )
                else:
                    primary = dicts[0]
            path = _category_path(primary, dicts)
            if path:
                return path
    return str(item.get("CATEGORY") or "").strip()


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

    categoria = categoria_from_articulo(item)
    imagen = item.get("IMAGE_URL")
    imagen_url = str(imagen).strip() if imagen else None
    if imagen_url == "":
        imagen_url = None

    long_desc = item.get("LONG_DESCRIPTION")
    descripcion = str(long_desc).strip() if long_desc is not None else ""
    if not descripcion:
        descripcion = None

    return {
        "proveedor": "invid",
        "codigo": codigo,
        "producto": str(titulo).strip(),
        "categoriaRaw": categoria,
        "categoria": categoria,
        "precio": precio,
        "imagenUrl": imagen_url,
        "descripcion": descripcion,
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
