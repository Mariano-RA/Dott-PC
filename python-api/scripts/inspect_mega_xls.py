"""
Inspecciona la estructura de un .xls de MEGA (columnas, filas de categoría).

Uso:
  python scripts/inspect_mega_xls.py [ruta/al/archivo.xls]

En Docker (desde raíz del repo):
  docker compose run --rm -v "C:\\Users\\<user>\\Documents\\Proveedores:/data:ro" python-api python scripts/inspect_mega_xls.py /data/listadoMegaViejo.xls
"""
import sys
import os


def main():
    if len(sys.argv) > 1:
        path = sys.argv[1]
    else:
        path = "listadoMegaViejo.xls"
        if not os.path.isfile(path):
            base = os.path.dirname(os.path.abspath(__file__))
            path = os.path.join(base, "..", "..", "Proveedores", "listadoMegaViejo.xls")
        if not os.path.isfile(path):
            path = os.path.expanduser(r"~\Documents\Proveedores\listadoMegaViejo.xls")
    if not os.path.isfile(path):
        print("No se encontró el archivo. Uso: python scripts/inspect_mega_xls.py <ruta.xls>")
        sys.exit(1)

    import pandas as pd
    print("Leyendo:", path)
    print("Tamaño:", os.path.getsize(path), "bytes")
    try:
        df = pd.read_excel(path, header=None, engine="xlrd")
    except Exception as e:
        print("Error leyendo con xlrd:", e)
        sys.exit(1)

    print("Shape:", df.shape)
    print("\n--- Primeras 25 filas (todas las columnas) ---")
    pd.set_option("display.max_columns", None)
    pd.set_option("display.width", 200)
    pd.set_option("display.max_colwidth", 30)
    print(df.head(25).to_string())
    print("\n--- Cómo se convierte a CSV con ; (primeras 15 líneas) ---")
    for i, row in df.head(15).iterrows():
        cells = [str(c).strip() if pd.notna(c) else "" for c in row]
        line = ";".join(cells)
        ends_with_semicolons = "  <- categoría" if line.rstrip().endswith(";;;") or line.rstrip().endswith(";;;;") else ""
        print(line[:120] + ("..." if len(line) > 120 else "") + ends_with_semicolons)


if __name__ == "__main__":
    main()
