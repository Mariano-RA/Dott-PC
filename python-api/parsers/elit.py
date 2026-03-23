"""Parser para proveedor ELIT (JSON, Excel o CSV con cabecera por nombre)."""
import csv
import io
import json
import logging
from typing import List

import pandas as pd

from domain import calcular_precio

from .base import is_excel_binary

logger = logging.getLogger(__name__)


def _iva_a_porcentaje_para_calcular(iva) -> float:
    """Elit envía IVA como tasa decimal (0,10 / 0,21); calcular_precio usa % (10 / 21)."""
    if iva is None:
        return 0.0
    v = float(str(iva).replace(",", ".")) if isinstance(iva, str) else float(iva)
    if 0 < v < 1:
        return v * 100.0
    return v


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
                productos = payload.get("productos") if isinstance(payload, dict) else payload
                if not isinstance(productos, list):
                    productos = []
                data = []
                for item in productos:
                    if not isinstance(item, dict):
                        continue
                    codigo = str(
                        item.get("codigo_producto") or item.get("codigo_alfa") or item.get("codigo") or ""
                    ).strip()
                    nombre = str(item.get("nombre") or item.get("producto") or "").strip()
                    if not nombre:
                        continue
                    cat = str(item.get("sub_categoria") or item.get("categoria") or "").strip()
                    precio = item.get("precio") or item.get("pvp")
                    if precio is None:
                        continue
                    iva_raw = item.get("iva") or item.get("alicuota_iva") or item.get("iva_porcentaje")
                    iva_pct = _iva_a_porcentaje_para_calcular(iva_raw)
                    imagenes = item.get("imagenes")
                    if isinstance(imagenes, list):
                        imagenes = [str(x).strip() for x in imagenes if str(x).strip()]
                    else:
                        imagenes = None
                    imagen_url = imagenes[0] if imagenes else None
                    registro = {
                        "proveedor": "elit",
                        "codigo": codigo,
                        "producto": nombre,
                        "categoriaRaw": cat,
                        "categoria": cat,
                        "precio": calcular_precio(precio, iva_pct),
                        "imagenUrl": imagen_url,
                        "imagenes": imagenes,
                    }
                    data.append(registro)
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
        sub_i = _first_idx("subcategoria", "subcategoría", "sub_rubro", "subrubro")
        precio_i = _first_idx(
            "precio", "pvp", "pvp_ars", "precio_ars", "importe", "valor"
        )
        iva_i = _first_idx("iva", "iva_porcentaje", "alicuota_iva", "alícuota_iva")
        imp_i = _first_idx("impuesto_interno", "imp_interno", "interno")
        imagen_i = _first_idx("imagen", "imagen_url", "url_imagen", "imagenes", "miniatura")

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
