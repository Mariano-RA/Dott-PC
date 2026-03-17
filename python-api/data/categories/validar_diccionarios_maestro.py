#!/usr/bin/env python3
"""
Valida que en diccionarios.json ningún valor sea una categoría principal (padre).
Solo deben usarse subcategorías. Ejecutar desde esta carpeta:
  python validar_diccionarios_maestro.py
"""
import json
from pathlib import Path

CARPETA = Path(__file__).resolve().parent
MAESTRO = CARPETA / "maestro_categorias.json"
DICC = CARPETA / "diccionarios.json"


def main():
    with open(MAESTRO, "r", encoding="utf-8") as f:
        maestro = json.load(f)

    padres = {c["nombre"] for c in maestro["categorias_maestras"]}
    subcategorias = set()
    for c in maestro["categorias_maestras"]:
        for s in c.get("subcategorias", []):
            subcategorias.add(s)

    with open(DICC, "r", encoding="utf-8") as f:
        dicc = json.load(f)

    # Valores que son categorías principales (no permitidos)
    usan_padres = []
    # Claves (proveedor, clave) que tienen ese valor
    por_valor = {}

    for proveedor, items in dicc.items():
        if not isinstance(items, dict):
            continue
        for clave, valor in items.items():
            if valor in padres:
                usan_padres.append((proveedor, clave, valor))
            por_valor.setdefault(valor, []).append((proveedor, clave))

    if usan_padres:
        print("ERROR: Valores que son categorías principales (solo deben usarse subcategorías):\n")
        for prov, clave, valor in sorted(usan_padres, key=lambda x: (x[2], x[0], x[1])):
            print(f"  {valor!r}")
            print(f"    -> {prov!r} / {clave!r}")
        print(f"\nTotal: {len(usan_padres)} entradas a corregir.")
        return 1

    # Opcional: valores que no están en el maestro (ni padre ni sub)
    valores_unicos = set(por_valor.keys())
    desconocidos = valores_unicos - padres - subcategorias
    if desconocidos:
        print("AVISO: Valores que no están en maestro_categorias (revisar si son legacy/typo):\n")
        for v in sorted(desconocidos):
            ej = por_valor[v][0]
            print(f"  {v!r}  (ej: {ej[0]!r} / {ej[1]!r})")
        print()

    print("OK: Ningún par clave-valor usa categorías principales; todos usan subcategorías.")
    return 0


if __name__ == "__main__":
    exit(main())
