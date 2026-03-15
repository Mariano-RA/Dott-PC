"""
Convierte un archivo Excel (.xls o .xlsx) a CSV sin abrirlo en una aplicación.

Métodos (en orden):
1. Pandas read_excel + to_csv
2. Pandas con ignore_workbook_corruption (para .xls dañados o no estándar)
3. Lectura como HTML (si el .xls es en realidad una tabla HTML)
4. LibreOffice (soffice) headless, si está instalado

Uso (desde raíz del repo o desde python-api):
  python scripts/convert_xls_to_csv.py entrada.xls [salida.csv]
  python scripts/convert_xls_to_csv.py entrada.xls salida.csv --skip 3   # omite las primeras 3 filas
  # En Docker:
  docker compose run --rm -v "C:\\...\\Proveedores:/data" python-api python scripts/convert_xls_to_csv.py /data/archivo.xls /data/archivo.csv
"""
import os
import sys
import tempfile
import subprocess


def _to_csv(df, path_out: str, skip_rows: int = 0) -> None:
    import pandas as pd
    if skip_rows > 0:
        df = df.iloc[skip_rows:].reset_index(drop=True)
    df.to_csv(path_out, index=False, header=False, sep=";", encoding="utf-8")


def convert_with_pandas(path_in: str, path_out: str, skip_rows: int = 0) -> bool:
    """Método 1: pandas read_excel + to_csv."""
    try:
        import pandas as pd
        read_file = pd.read_excel(path_in, header=None)
        _to_csv(read_file, path_out, skip_rows)
        return True
    except Exception as e:
        print(f"Pandas/xlrd falló: {e}", file=sys.stderr)
        return False


def convert_with_pandas_ignore_corruption(path_in: str, path_out: str, skip_rows: int = 0) -> bool:
    """Como pandas pero con ignore_workbook_corruption para .xls dañados."""
    try:
        import pandas as pd
        read_file = pd.read_excel(
            path_in,
            header=None,
            engine="xlrd",
            engine_kwargs={"ignore_workbook_corruption": True},
        )
        _to_csv(read_file, path_out, skip_rows)
        return True
    except Exception as e:
        print(f"Pandas (ignore_workbook_corruption) falló: {e}", file=sys.stderr)
        return False


def convert_with_html(path_in: str, path_out: str, skip_rows: int = 0) -> bool:
    """Si el .xls es en realidad HTML (común en exportaciones antiguas)."""
    try:
        import pandas as pd
        tables = pd.read_html(path_in, encoding="utf-8", flavor="html5lib")
        if not tables:
            return False
        # Tomar la primera tabla (o la más grande)
        df = max(tables, key=lambda t: t.shape[0] * t.shape[1])
        _to_csv(df, path_out, skip_rows)
        return True
    except ImportError:
        print("Para leer .xls como HTML hace falta: pip install html5lib lxml", file=sys.stderr)
        return False
    except Exception as e:
        print(f"Lectura como HTML falló: {e}", file=sys.stderr)
        return False


def convert_with_libreoffice(path_in: str, path_out: str, skip_rows: int = 0) -> bool:
    """Método 2: LibreOffice headless."""
    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            csv_filter = 'csv:"Text - txt - csv (StarCalc)":59,34'
            result = subprocess.run(
                ["soffice", "--headless", "--convert-to", csv_filter, "--outdir", tmpdir, path_in],
                capture_output=True,
                timeout=60,
            )
            if result.returncode != 0:
                print(f"LibreOffice falló: {result.stderr.decode('utf-8', errors='replace')[:300]}", file=sys.stderr)
                return False
            base = os.path.splitext(os.path.basename(path_in))[0]
            generated = os.path.join(tmpdir, base + ".csv")
            if not os.path.isfile(generated):
                return False
            with open(generated, "r", encoding="utf-8", errors="replace") as f:
                lines = f.readlines()
            if skip_rows > 0:
                lines = lines[skip_rows:]
            with open(path_out, "w", encoding="utf-8", newline="") as f:
                f.writelines(lines)
            return True
    except FileNotFoundError:
        print("LibreOffice (soffice) no está instalado o no está en el PATH.", file=sys.stderr)
        return False
    except Exception as e:
        print(f"Error con LibreOffice: {e}", file=sys.stderr)
        return False


def main():
    args = list(sys.argv[1:])
    skip_rows = 0
    if "--skip" in args:
        idx = args.index("--skip")
        if idx + 1 < len(args):
            try:
                skip_rows = max(0, int(args[idx + 1]))
            except ValueError:
                pass
        args = args[:idx] + args[idx + 2 :]
    if not args:
        print("Uso: python scripts/convert_xls_to_csv.py <entrada.xls> [salida.csv] [--skip N]")
        sys.exit(1)
    path_in = os.path.abspath(args[0])
    if not os.path.isfile(path_in):
        print(f"No se encontró el archivo: {path_in}", file=sys.stderr)
        sys.exit(1)
    if len(args) >= 2 and not args[1].startswith("-"):
        path_out = os.path.abspath(args[1])
    else:
        path_out = os.path.splitext(path_in)[0] + ".csv"

    if convert_with_pandas(path_in, path_out, skip_rows):
        print(f"Convertido con pandas → {path_out}")
        sys.exit(0)
    print("Intentando con ignore_workbook_corruption...", file=sys.stderr)
    if convert_with_pandas_ignore_corruption(path_in, path_out, skip_rows):
        print(f"Convertido (xlrd ignore_workbook_corruption) → {path_out}")
        sys.exit(0)
    print("Intentando lectura como HTML...", file=sys.stderr)
    if convert_with_html(path_in, path_out, skip_rows):
        print(f"Convertido (como HTML) → {path_out}")
        sys.exit(0)
    print("Intentando con LibreOffice (soffice)...", file=sys.stderr)
    if convert_with_libreoffice(path_in, path_out, skip_rows):
        print(f"Convertido con LibreOffice → {path_out}")
        sys.exit(0)
    print("No se pudo convertir el archivo.", file=sys.stderr)
    sys.exit(1)


if __name__ == "__main__":
    main()
