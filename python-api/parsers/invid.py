"""Parser / mapper para proveedor INVID.

Camino principal: artículos de la APIv1 → registros carga_tabla.
Legacy: Excel con filas de categoría (upload manual, sin imágenes).
"""
import html
import logging
import re
from html.parser import HTMLParser
from typing import Any, Dict, List, Optional, Tuple

import pandas as pd

from domain import calcular_precio

logger = logging.getLogger(__name__)

# El Excel de Invid arma la ruta con " /" (espacio + slash, sin espacio después).
_CATEGORY_SEP = " /"

# Bloques / saltos que deben quedar como newline en texto plano.
_BLOCK_TAGS = frozenset(
    {
        "br",
        "p",
        "div",
        "li",
        "tr",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "ul",
        "ol",
        "table",
        "thead",
        "tbody",
        "hr",
    }
)

_DESC_ROW_NAMES = frozenset({"descripcion", "descripción", "description"})


def _clean_cell_text(raw: str) -> str:
    text = html.unescape(raw or "")
    text = text.replace("\xa0", " ")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\s*\n\s*", "\n", text)
    return text.strip()


class _HTMLToText(HTMLParser):
    """Extrae texto plano de HTML; convierte bloques a saltos de línea."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self._parts: List[str] = []

    def handle_starttag(self, tag: str, attrs) -> None:
        # <br> y <hr> no tienen cierre útil; el resto inserta salto al cerrar.
        if tag.lower() in ("br", "hr"):
            self._parts.append("\n")

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() in _BLOCK_TAGS and tag.lower() not in ("br", "hr"):
            self._parts.append("\n")

    def handle_data(self, data: str) -> None:
        self._parts.append(data)

    def get_text(self) -> str:
        text = "".join(self._parts)
        text = _clean_cell_text(text)
        text = re.sub(r"\n{3,}", "\n\n", text)
        return text.strip()


class _HTMLAttrTable(HTMLParser):
    """Extrae filas nombre/valor de tablas HTML (LONG_DESCRIPTION Invid)."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.rows: List[Tuple[str, str]] = []
        self._in_tr = False
        self._in_cell = False
        self._cell_parts: List[str] = []
        self._row_cells: List[str] = []
        self._saw_table = False

    def handle_starttag(self, tag: str, attrs) -> None:
        t = tag.lower()
        if t == "table":
            self._saw_table = True
        elif t == "tr":
            self._in_tr = True
            self._row_cells = []
        elif t in ("td", "th") and self._in_tr:
            self._in_cell = True
            self._cell_parts = []
        elif t in ("br", "hr") and self._in_cell:
            self._cell_parts.append(" ")

    def handle_endtag(self, tag: str) -> None:
        t = tag.lower()
        if t in ("td", "th") and self._in_cell:
            self._row_cells.append(_clean_cell_text("".join(self._cell_parts)))
            self._in_cell = False
            self._cell_parts = []
        elif t == "tr" and self._in_tr:
            if len(self._row_cells) >= 2:
                nombre = self._row_cells[0]
                valor = self._row_cells[1]
                if nombre or valor:
                    self.rows.append((nombre, valor))
            self._in_tr = False
            self._row_cells = []

    def handle_data(self, data: str) -> None:
        if self._in_cell:
            self._cell_parts.append(data)


def html_to_plain_text(raw: Any) -> Optional[str]:
    """Convierte HTML genérico a texto plano."""
    if raw is None:
        return None
    s = str(raw).strip()
    if not s:
        return None
    if "<" not in s:
        return s
    parser = _HTMLToText()
    try:
        parser.feed(s)
        parser.close()
    except Exception:
        plain = re.sub(r"<[^>]+>", " ", s)
        plain = _clean_cell_text(plain)
        plain = re.sub(r"\s+", " ", plain).strip()
        return plain or None
    plain = parser.get_text()
    return plain or None


def parse_long_description(
    raw: Any,
) -> Tuple[Optional[str], Optional[List[Dict[str, str]]]]:
    """Separa LONG_DESCRIPTION en descripcion + atributos.

    Si es una tabla HTML de 2 columnas (típico Invid), las filas van a
    atributos. La fila «Descripción» (si existe) pasa a descripcion y no
    se duplica en atributos. Si no hay tabla usable, queda texto plano.
    """
    if raw is None:
        return None, None
    s = str(raw).strip()
    if not s:
        return None, None

    if "<table" in s.lower():
        table_parser = _HTMLAttrTable()
        try:
            table_parser.feed(s)
            table_parser.close()
        except Exception:
            table_parser.rows = []
        if table_parser.rows:
            descripcion: Optional[str] = None
            atributos: List[Dict[str, str]] = []
            for nombre, valor in table_parser.rows:
                if nombre.lower() in _DESC_ROW_NAMES and valor:
                    if descripcion is None:
                        descripcion = valor
                    continue
                if not nombre and not valor:
                    continue
                atributos.append({"nombre": nombre, "valor": valor})
            return descripcion, (atributos or None)

    return html_to_plain_text(s), None

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

    descripcion, atributos = parse_long_description(item.get("LONG_DESCRIPTION"))

    return {
        "proveedor": "invid",
        "codigo": codigo,
        "producto": str(titulo).strip(),
        "categoriaRaw": categoria,
        "categoria": categoria,
        "precio": precio,
        "imagenUrl": imagen_url,
        "descripcion": descripcion,
        "atributos": atributos,
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
