"""Parser para proveedor ELIT (JSON, Excel o CSV con cabecera por nombre)."""
import csv
import io
import json
import logging
from typing import Any, Dict, List, Optional

import pandas as pd

from domain import calcular_precio

from .base import is_excel_binary
from .description import (
    normalize_atributos_list,
    split_text_to_descripcion_atributos,
)

logger = logging.getLogger(__name__)


def _iva_a_porcentaje_para_calcular(iva) -> float:
    """Elit envía IVA como tasa decimal (0,10 / 0,21); calcular_precio usa % (10 / 21)."""
    if iva is None:
        return 0.0
    v = float(str(iva).replace(",", ".")) if isinstance(iva, str) else float(iva)
    if 0 < v < 1:
        return v * 100.0
    return v


def _to_int(v, default: int = 0) -> int:
    if v is None:
        return default
    if isinstance(v, bool):
        return int(v)
    if isinstance(v, (int, float)):
        try:
            return int(v)
        except Exception:
            return default
    s = str(v).strip()
    if not s:
        return default
    s = s.replace(".", "").replace(",", ".")
    try:
        return int(float(s))
    except Exception:
        return default


def normalize_atributos(raw: Any) -> Optional[List[Dict[str, str]]]:
    """Normaliza atributos Elit a [{nombre, valor}] (API usa clave ``atributo``)."""
    return normalize_atributos_list(raw)


def producto_to_registro(item: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Mapea un producto de la API Elit JSON al formato carga_tabla.

    La API trae ``atributos`` como ``[{atributo, valor}]`` y ``descripcion`` como
    el mismo contenido aplanado (\"Tipo: Aire. Color: Negro\"). Preferimos
    atributos estructurados; si la lista viene vacía, parseamos ``descripcion``.
    """
    if not isinstance(item, dict):
        return None
    codigo = str(
        item.get("codigo_producto") or item.get("codigo_alfa") or item.get("codigo") or ""
    ).strip()
    nombre = str(item.get("nombre") or item.get("producto") or "").strip()
    if not nombre:
        return None

    stock_total = _to_int(item.get("stock_total"))
    stock_deposito_cliente = _to_int(item.get("stock_deposito_cliente"))
    stock_deposito_cd = _to_int(item.get("stock_deposito_cd"))
    if stock_total == 0 and stock_deposito_cliente == 0 and stock_deposito_cd == 0:
        return None

    cat = str(item.get("sub_categoria") or item.get("categoria") or "").strip()
    precio = item.get("precio")
    if precio is None:
        precio = item.get("pvp_ars") or item.get("pvp")
    if precio is None:
        return None
    iva_pct = _iva_a_porcentaje_para_calcular(item.get("iva")) + _iva_a_porcentaje_para_calcular(
        item.get("impuesto_interno")
    )
    imagenes = item.get("imagenes")
    if isinstance(imagenes, list):
        imagenes = [str(x).strip() for x in imagenes if str(x).strip()]
    else:
        imagenes = None
    imagen_url = imagenes[0] if imagenes else None

    atributos = normalize_atributos(item.get("atributos"))
    descripcion = None
    if not atributos:
        # Fallback: parsear el string aplanado o usarlo como texto libre.
        descripcion, atributos = split_text_to_descripcion_atributos(item.get("descripcion"))
    # Si hay atributos, no guardamos el flatten duplicado en descripcion.

    return {
        "proveedor": "elit",
        "codigo": codigo,
        "producto": nombre,
        "categoriaRaw": cat,
        "categoria": cat,
        "precio": calcular_precio(precio, iva_pct),
        "imagenUrl": imagen_url,
        "imagenes": imagenes,
        "descripcion": descripcion,
        "atributos": atributos,
    }


def registros_from_productos(productos: List[Dict[str, Any]]) -> List[dict]:
    """Convierte lista de productos API Elit en registros carga_tabla."""
    data: List[dict] = []
    for item in productos:
        reg = producto_to_registro(item)
        if reg:
            data.append(reg)
    return data


def parse(archivo_bytesio) -> List[dict]:
    """Envía categoriaRaw para que el backend resuelva con el maestro."""
    try:
        raw = archivo_bytesio.read()

        # Elit API devuelve JSON con lista de productos (codigo_producto, nombre, imagenes, etc.)
        try:
            raw_text = raw.decode("utf-8", errors="strict").lstrip()
        except Exception:
            raw_text = ""
        if raw_text.startswith("{") or raw_text.startswith("["):
            try:
                payload = json.loads(raw_text)
                if isinstance(payload, dict):
                    productos = payload.get("resultado")
                    if productos is None:
                        productos = payload.get("productos")
                    if productos is None:
                        productos = payload.get("data")
                    if productos is None:
                        productos = []
                else:
                    productos = payload
                if not isinstance(productos, list):
                    productos = []
                data = registros_from_productos(
                    [p for p in productos if isinstance(p, dict)]
                )
                if data:
                    return data
            except Exception:
                pass

        if is_excel_binary(raw):
            df = pd.read_excel(io.BytesIO(raw))
            data = []
            for _, row in df.iterrows():
                codigo = str(row[0]).strip() if len(row) > 0 else ""
                cat_raw = str(row[5]).strip() if len(row) > 5 else ""
                imagen_url = str(row[11]).strip() if len(row) > 11 else ""

                stock_total = _to_int(row.get("stock_total") if hasattr(row, "get") else None)
                stock_deposito_cliente = _to_int(
                    row.get("stock_deposito_cliente") if hasattr(row, "get") else None
                )
                stock_deposito_cd = _to_int(
                    row.get("stock_deposito_cd") if hasattr(row, "get") else None
                )
                if (
                    hasattr(row, "get")
                    and stock_total == 0
                    and stock_deposito_cliente == 0
                    and stock_deposito_cd == 0
                ):
                    continue
                registro = {
                    "proveedor": "elit",
                    "codigo": codigo,
                    "producto": row[1],
                    "categoriaRaw": cat_raw,
                    "categoria": cat_raw,
                    "precio": calcular_precio(
                        row[8],
                        _iva_a_porcentaje_para_calcular(row[9])
                        + _iva_a_porcentaje_para_calcular(row[10]),
                    ),
                    "imagenUrl": imagen_url or None,
                }
                data.append(registro)
            return data

        # CSV Elit: id,codigo_alfa,codigo_producto,nombre,categoria,sub_categoria,...,pvp_ars,...,imagen,miniatura,...
        text = raw.decode("utf-8-sig", errors="replace").strip()
        sample = "\n".join([ln for ln in text.splitlines() if ln.strip()][:20])
        try:
            dialect = csv.Sniffer().sniff(sample, delimiters=",;|\t")
            delimiter = dialect.delimiter
        except Exception:
            delimiter = ","

        f = io.StringIO(text, newline="")
        reader = csv.reader(f, delimiter=delimiter)
        rows = [r for r in reader if r and any(str(c).strip() for c in r)]
        if not rows:
            return []

        # Excel/CSV de Elit suele empezar con la directiva "sep=," — no es la cabecera.
        if rows and str(rows[0][0]).strip().lower().startswith("sep="):
            rows = rows[1:]
        if not rows:
            return []

        header = [str(c).strip().lower() for c in rows[0]]
        idx = {name: i for i, name in enumerate(header) if name}

        def _first_idx(*names):
            for n in names:
                if n in idx:
                    return idx[n]
            return None

        codigo_i = _first_idx(
            "codigo_producto", "codigo_alfa", "código_producto", "código_alfa",
            "codigo", "código", "sku", "id",
        )
        producto_i = _first_idx(
            "producto", "nombre", "descripcion", "descripción", "articulo", "artículo"
        )
        cat_i = _first_idx("categoria", "categoría", "rubro", "linea", "línea")
        sub_i = _first_idx(
            "sub_categoria", "subcategoria", "subcategoría", "sub_rubro", "subrubro"
        )
        precio_i = _first_idx(
            "precio", "pvp", "pvp_ars", "precio_ars", "importe", "valor"
        )
        iva_i = _first_idx("iva", "iva_porcentaje", "alicuota_iva", "alícuota_iva")
        imp_i = _first_idx("impuesto_interno", "imp_interno", "interno")
        imagen_i = _first_idx("imagen", "imagen_url", "url_imagen", "imagenes", "miniatura")
        stock_total_i = _first_idx("stock_total", "stock", "stock total")
        stock_dc_i = _first_idx("stock_deposito_cliente", "stock deposito cliente", "stock_dep_cliente")
        stock_cd_i = _first_idx("stock_deposito_cd", "stock deposito cd", "stock_dep_cd", "stock_cd")

        def _to_float(v):
            if v is None:
                return None
            s = str(v).strip()
            if not s:
                return None
            s = s.replace("U$s", "").replace("%", "").replace("+", "").strip()
            s = (
                s.replace(".", "").replace(",", ".")
                if s.count(",") == 1 and s.count(".") >= 1
                else s.replace(",", ".")
            )
            try:
                return float(s)
            except Exception:
                return None

        def _cell(r, i):
            if i is None or i >= len(r):
                return ""
            return str(r[i]).strip()

        data = []
        for r in rows[1:]:
            try:
                producto = _cell(r, producto_i)
                if not producto:
                    continue

                # Si el archivo trae stocks y los 3 son 0, no cargamos el producto.
                if stock_total_i is not None and stock_dc_i is not None and stock_cd_i is not None:
                    stock_total = _to_int(_cell(r, stock_total_i))
                    stock_deposito_cliente = _to_int(_cell(r, stock_dc_i))
                    stock_deposito_cd = _to_int(_cell(r, stock_cd_i))
                    if stock_total == 0 and stock_deposito_cliente == 0 and stock_deposito_cd == 0:
                        continue
                cat = _cell(r, sub_i) or _cell(r, cat_i)

                precio = (
                    _to_float(r[precio_i])
                    if precio_i is not None and precio_i < len(r)
                    else None
                )
                if precio is None:
                    continue
                iva = (
                    _to_float(r[iva_i])
                    if iva_i is not None and iva_i < len(r)
                    else 0.0
                )
                imp = (
                    _to_float(r[imp_i])
                    if imp_i is not None and imp_i < len(r)
                    else 0.0
                )
                iva_total = _iva_a_porcentaje_para_calcular(iva) + _iva_a_porcentaje_para_calcular(imp)

                codigo = _cell(r, codigo_i)
                imagen_raw = _cell(r, imagen_i)
                imagenes = None
                imagen_url = None
                if imagen_raw:
                    if imagen_raw.startswith("[") and imagen_raw.endswith("]"):
                        inner = imagen_raw[1:-1].strip()
                        parts = [p.strip().strip('"').strip("'") for p in inner.split(",") if p.strip()]
                        imagenes = [p for p in parts if p]
                        imagen_url = imagenes[0] if imagenes else None
                    elif "," in imagen_raw:
                        parts = [p.strip() for p in imagen_raw.split(",") if p.strip()]
                        imagenes = parts if parts else None
                        imagen_url = imagenes[0] if imagenes else None
                    else:
                        imagen_url = imagen_raw

                registro = {
                    "proveedor": "elit",
                    "codigo": codigo,
                    "producto": producto,
                    "categoriaRaw": cat,
                    "categoria": cat,
                    "precio": calcular_precio(precio, iva_total),
                    "imagenUrl": imagen_url,
                    "imagenes": imagenes,
                }
                data.append(registro)
            except Exception:
                continue
        return data
    except Exception as ex:
        logger.exception("Error procesando datos del proveedor ELIT: %s", ex)
        return []
