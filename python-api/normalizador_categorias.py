from pathlib import Path
import json
from collections import defaultdict

# ==== CONFIGURACIÓN ====
RUTA_DICCIONARIO = Path("nuevosScripts/diccionarios/diccionarios.json")
RUTA_SALIDA = Path("nuevosScripts/diccionarios/nuevos_diccionarios.json")

# ==== CARGAR DICCIONARIO ====
with open(RUTA_DICCIONARIO, "r", encoding="utf-8") as f:
    DICCIONARIO = json.load(f)

# ==== ESTRUCTURA PARA REGISTRAR CATEGORÍAS NUEVAS ====
CATEGORIAS_NUEVAS = defaultdict(set)

def normalizar_categoria(proveedor: str, categoria: str, nombre_producto: str) -> str:
    try:
        normalizada = DICCIONARIO.get(proveedor, {}).get(categoria)
        if normalizada:
            return normalizada
        else:
            CATEGORIAS_NUEVAS[proveedor].add(f"{nombre_producto} - {categoria}")
            return "Varios"
    except Exception as e:
        print(f"Error al normalizar: {e}")
        return "Varios"

def guardar_categorias_nuevas():
    if not any(CATEGORIAS_NUEVAS.values()):
        return
    RUTA_SALIDA.parent.mkdir(parents=True, exist_ok=True)
    data = {proveedor: sorted(list(items)) for proveedor, items in CATEGORIAS_NUEVAS.items()}
    with open(RUTA_SALIDA, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
