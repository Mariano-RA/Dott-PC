"""
Utilidades compartidas para parsers: detección Excel, lectura a filas, conversión XLS→CSV, desencriptado.
Responsabilidad única: manejo de formatos de archivo (bytes/stream → filas o CSV texto).
"""
import contextlib
import csv
import io
import logging
import os
import subprocess
import tempfile
from typing import List, Optional

import pandas as pd

logger = logging.getLogger(__name__)


def is_excel_binary(file_data: bytes) -> bool:
    """XLSX: ZIP (PK). XLS (BIFF/OLE): D0 CF 11 E0."""
    return file_data.startswith(b"PK") or (
        len(file_data) >= 8 and file_data[:8] == b"\xD0\xCF\x11\xE0\xA1\xB1\x1A\xE1"
    )


def try_decrypt_excel(file_data: bytes) -> bytes:
    """
    Si el archivo es Excel y está configurada MEGA_EXCEL_PASSWORD, intenta desencriptar.
    """
    password = os.environ.get("MEGA_EXCEL_PASSWORD", "").strip()
    if not password or not is_excel_binary(file_data):
        return file_data
    try:
        import msoffcrypto

        decrypted = io.BytesIO()
        with io.BytesIO(file_data) as encrypted:
            office_file = msoffcrypto.OfficeFile(encrypted)
            office_file.load_key(password=password)
            office_file.decrypt(decrypted)
        decrypted.seek(0)
        out = decrypted.read()
        if out:
            logger.info("MEGA: archivo Excel desencriptado correctamente.")
            return out
    except ImportError:
        logger.warning(
            "MEGA: MEGA_EXCEL_PASSWORD está configurada pero no está instalado msoffcrypto-tool. "
            "Ejecute: pip install msoffcrypto-tool"
        )
    except Exception as ex:
        logger.warning(
            "MEGA: no se pudo desencriptar el Excel (%s). Se intentará leer como está.", ex
        )
    return file_data


def read_excel_to_rows(
    file_data: bytes, ignore_workbook_corruption: bool = False
) -> List[List[str]]:
    """Lee Excel (.xls o .xlsx) y devuelve lista de filas (celdas como string)."""
    is_xls = (
        len(file_data) >= 8 and file_data[:8] == b"\xD0\xCF\x11\xE0\xA1\xB1\x1A\xE1"
    )
    engine = "xlrd" if is_xls else "openpyxl"
    kwargs = {"header": None, "engine": engine}
    if is_xls and ignore_workbook_corruption:
        kwargs["engine_kwargs"] = {"ignore_workbook_corruption": True}
    with open(os.devnull, "w", encoding="utf-8") as devnull:
        with contextlib.redirect_stdout(devnull):
            try:
                df = pd.read_excel(io.BytesIO(file_data), **kwargs)
            except Exception:
                if not is_xls:
                    engine = "xlrd" if engine == "openpyxl" else "openpyxl"
                    kwargs["engine"] = engine
                    kwargs.pop("engine_kwargs", None)
                    df = pd.read_excel(io.BytesIO(file_data), **kwargs)
                else:
                    raise
    df = df.fillna("")
    return [[str(cell).strip() for cell in row] for row in df.values.tolist()]


def rows_from_csv_or_excel(
    file_data: bytes,
    csv_delimiter: str = ",",
    csv_encoding: str = "utf-8",
) -> List[List[str]]:
    """Devuelve filas desde CSV (decodificado) o desde Excel."""
    if is_excel_binary(file_data):
        return read_excel_to_rows(file_data)
    decoded = file_data.decode(csv_encoding, errors="replace").splitlines()
    return [row for row in csv.reader(decoded, delimiter=csv_delimiter)]


def xls_to_csv_semicolon(file_data: bytes) -> str:
    """Convierte XLS/XLSX a texto CSV con separador ; (formato MEGA)."""
    rows = read_excel_to_rows(file_data)
    return _rows_to_csv_semicolon(rows)


def _rows_to_csv_semicolon(rows: List[List[str]]) -> str:
    """Convierte lista de filas a texto CSV con separador ; (formato MEGA)."""
    lines = []
    for row in rows:
        cells = []
        for c in row:
            s = str(c).strip() if c is not None else ""
            if ";" in s or "\n" in s or '"' in s:
                s = '"' + s.replace('"', '""') + '"'
            cells.append(s)
        lines.append(";".join(cells))
    return "\n".join(lines)


def _xls_to_csv_via_html(file_data: bytes) -> Optional[str]:
    """Convierte .xls (a veces HTML) a CSV usando pandas read_html."""
    try:
        tables = pd.read_html(io.BytesIO(file_data), encoding="utf-8", flavor="html5lib")
    except ImportError:
        logger.debug("html5lib no instalado; no se intenta lectura como HTML.")
        return None
    except Exception as ex:
        logger.debug("read_html falló: %s", ex)
        return None
    if not tables:
        return None
    df = max(tables, key=lambda t: t.shape[0] * t.shape[1])
    df = df.fillna("")
    rows = [[str(c).strip() for c in row] for row in df.values.tolist()]
    return _rows_to_csv_semicolon(rows)


def convert_xls_to_csv_via_libreoffice(file_data: bytes) -> Optional[str]:
    """
    Convierte .xls/.xlsx a CSV usando LibreOffice headless.
    Útil cuando xlrd falla por archivos corruptos o no estándar.
    """
    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            xls_path = os.path.join(tmpdir, "input.xls")
            with open(xls_path, "wb") as f:
                f.write(file_data)
            csv_filter = 'csv:"Text - txt - csv (StarCalc)":59,34'
            result = subprocess.run(
                [
                    "soffice",
                    "--headless",
                    "--convert-to",
                    csv_filter,
                    "--outdir",
                    tmpdir,
                    xls_path,
                ],
                capture_output=True,
                timeout=60,
                cwd=tmpdir,
            )
            if result.returncode != 0:
                logger.warning(
                    "LibreOffice convert falló: returncode=%s stderr=%s",
                    result.returncode,
                    (result.stderr or b"").decode("utf-8", errors="replace")[:200],
                )
                return None
            csv_path = os.path.join(tmpdir, "input.csv")
            if not os.path.isfile(csv_path):
                return None
            with open(csv_path, "r", encoding="utf-8", errors="replace") as f:
                content = f.read()
            if not content.strip():
                return None
            logger.info(
                "MEGA: archivo Excel convertido a CSV correctamente con LibreOffice."
            )
            return content
    except FileNotFoundError:
        logger.debug(
            "LibreOffice (soffice) no encontrado en PATH; se omite conversión."
        )
        return None
    except subprocess.TimeoutExpired:
        logger.warning("LibreOffice convert expiró por tiempo.")
        return None
    except Exception as ex:
        logger.warning("Error convirtiendo con LibreOffice: %s", ex)
        return None


def excel_to_csv_text(file_data: bytes, skip_rows: int = 0) -> str:
    """
    Convierte Excel a CSV con separador ;.
    Orden: pandas/xlrd → xlrd ignore_workbook_corruption → read_html (si es HTML) → LibreOffice.
    Usado por el parser MEGA cuando el listado viene en .xls.
    skip_rows: número de filas a omitir al inicio (ej. 3 para listados Mega con cabecera vacía).
    """
    file_data = try_decrypt_excel(file_data)
    result = None
    try:
        result = xls_to_csv_semicolon(file_data)
    except Exception:
        pass
    if result is None:
        try:
            rows = read_excel_to_rows(file_data, ignore_workbook_corruption=True)
            result = _rows_to_csv_semicolon(rows)
        except Exception:
            pass
    if result is None:
        result = _xls_to_csv_via_html(file_data)
    if result is None:
        result = convert_xls_to_csv_via_libreoffice(file_data)
    if not result:
        raise ValueError("No se pudo convertir el Excel a CSV")
    if skip_rows > 0:
        lines = result.splitlines()
        result = "\n".join(lines[skip_rows:])
    return result
