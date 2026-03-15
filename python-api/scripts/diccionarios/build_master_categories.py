import json
import os
from pathlib import Path


# Ejecutar desde python-api: python scripts/diccionarios/build_master_categories.py
BASE_DIR = Path(__file__).resolve().parents[2]  # python-api
DATA_DIR = BASE_DIR / "data" / "categories"

DICCIONARIOS_PATH = DATA_DIR / "diccionarios.json"
OUTPUT_PATH = DATA_DIR / "master_categories.json"


def load_json(path: Path):
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def build_master_categories():
    diccionarios = load_json(DICCIONARIOS_PATH)
    categorias = set()

    # Valores de diccionarios.json (salteando 'air', que usa códigos)
    for proveedor, mapping in diccionarios.items():
        if proveedor == "air":
            continue
        if not isinstance(mapping, dict):
            continue
        for valor in mapping.values():
            if isinstance(valor, str):
                categorias.add(valor.strip())

    categorias_ordenadas = sorted(c for c in categorias if c)

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_PATH.open("w", encoding="utf-8") as f:
        json.dump(categorias_ordenadas, f, ensure_ascii=False, indent=2)

    print(f"Generadas {len(categorias_ordenadas)} categorías maestras en {OUTPUT_PATH}")


if __name__ == "__main__":
    build_master_categories()
