"""Parser para proveedor ELIT (Excel o CSV con cabecera por nombre)."""
import csv
import io
import logging
from typing import List

import pandas as pd

from domain import calcular_precio

from .base import is_excel_binary

logger = logging.getLogger(__name__)


def parse(archivo_bytesio) -> List[dict]:
    """Envía categoriaRaw para que el backend resuelva con el maestro."""
    try:
        raw = archivo_bytesio.read()
        if is_excel_binary(raw):
            df = pd.read_excel(io.BytesIO(raw))
            data = []
            for _, row in df.iterrows():
                cat_raw = str(row[5]).strip() if len(row) > 5 else ""
                registro = {
                    "proveedor": "elit",
                    "producto": row[1],
                    "categoriaRaw": cat_raw,
                    "categoria": cat_raw,
                    "precio": calcular_precio(row[8], float(row[9]) + float(row[10])),
                }
                data.append(registro)
            return data

        # CSV: mapeo por nombres de columnas
        text = raw.decode("utf-8", errors="replace")
        sample = "\n".join([ln for ln in text.splitlines() if ln.strip()][:20])
        try:
            dialect = csv.Sniffer().sniff(sample, delimiters=";,|\t")
            delimiter = dialect.delimiter
        except Exception:
            delimiter = ";"

        reader = csv.reader(text.splitlines(), delimiter=delimiter)
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

        producto_i = _first_idx(
            "producto", "nombre", "descripcion", "descripción", "articulo", "artículo"
        )
        cat_i = _first_idx("categoria", "categoría", "rubro", "linea", "línea")
        sub_i = _first_idx("subcategoria", "subcategoría", "sub_rubro", "subrubro")
        precio_i = _first_idx(
            "pvp_ars", "pvp", "precio", "precio_ars", "importe", "valor"
        )
        iva_i = _first_idx("iva", "iva_porcentaje", "alicuota_iva", "alícuota_iva")
        imp_i = _first_idx("impuesto_interno", "imp_interno", "interno")

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

        data = []
        for r in rows[1:]:
            try:
                producto = (
                    str(r[producto_i]).strip()
                    if producto_i is not None and producto_i < len(r)
                    else ""
                )
                if not producto:
                    continue
                cat = ""
                #if cat_i is not None and cat_i < len(r):
                #    cat = str(r[cat_i]).strip()
                #if not cat and sub_i is not None and sub_i < len(r):
                #    cat = str(r[sub_i]).strip()
                cat = str(r[sub_i]).strip()

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
                iva_total = float(iva or 0) + float(imp or 0)

                registro = {
                    "proveedor": "elit",
                    "producto": producto,
                    "categoriaRaw": cat,
                    "categoria": cat,
                    "precio": calcular_precio(precio, iva_total),
                }
                data.append(registro)
            except Exception:
                continue
        return data
    except Exception as ex:
        logger.exception("Error procesando datos del proveedor ELIT: %s", ex)
        return []
