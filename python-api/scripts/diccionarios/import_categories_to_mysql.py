import json
import os
from pathlib import Path
from typing import Dict, Any, Iterable, Tuple

import mysql.connector
from mysql.connector import MySQLConnection


# Ejecutar desde python-api: python scripts/diccionarios/import_categories_to_mysql.py
BASE_DIR = Path(__file__).resolve().parents[2]  # python-api
DATA_DIR = BASE_DIR / "data" / "categories"

DICCIONARIOS_PATH = DATA_DIR / "diccionarios.json"
MASTER_CATEGORIES_PATH = DATA_DIR / "master_categories.json"


def get_db_connection() -> MySQLConnection:
    """Crea una conexión MySQL usando variables de entorno.

    Variables esperadas (con defaults razonables):
      - CATEGORIES_DB_HOST (default: localhost)
      - CATEGORIES_DB_PORT (default: 3306)
      - CATEGORIES_DB_USER
      - CATEGORIES_DB_PASSWORD
      - CATEGORIES_DB_NAME
    """
    host = os.environ.get("CATEGORIES_DB_HOST", "localhost")
    port = int(os.environ.get("CATEGORIES_DB_PORT", "3306"))
    user = os.environ.get("CATEGORIES_DB_USER", "")
    password = os.environ.get("CATEGORIES_DB_PASSWORD", "")
    database = os.environ.get("CATEGORIES_DB_NAME", "")

    if not user or not database:
        raise RuntimeError("Config DB incompleta: define CATEGORIES_DB_USER y CATEGORIES_DB_NAME")

    return mysql.connector.connect(
        host=host,
        port=port,
        user=user,
        password=password,
        database=database,
    )


def load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def ensure_providers(conn: MySQLConnection, diccionarios: Dict[str, Any]) -> Dict[str, int]:
    """Inserta proveedores si no existen y devuelve un map code -> id."""
    cursor = conn.cursor()

    provider_codes = sorted(diccionarios.keys())
    code_to_id: Dict[str, int] = {}

    for code in provider_codes:
        # nombre descriptivo simple: mayúscula del código
        name = code.upper()
        cursor.execute(
            """
            INSERT INTO providers (code, name)
            VALUES (%s, %s)
            ON DUPLICATE KEY UPDATE name = VALUES(name)
            """,
            (code, name),
        )

    conn.commit()

    cursor.execute("SELECT id, code FROM providers WHERE code IN ({})".format(
        ", ".join(["%s"] * len(provider_codes))
    ), provider_codes)

    for provider_id, code in cursor.fetchall():
        code_to_id[code] = provider_id

    cursor.close()
    return code_to_id


def ensure_master_categories(conn: MySQLConnection, categorias: Iterable[str]) -> Dict[str, int]:
    """Inserta categorías maestras si no existen y devuelve map name -> id."""
    cursor = conn.cursor()

    categoria_list = sorted(set(categorias))

    for name in categoria_list:
        slug = name.lower().replace(" ", "_")
        cursor.execute(
            """
            INSERT INTO master_categories (slug, name)
            VALUES (%s, %s)
            ON DUPLICATE KEY UPDATE name = VALUES(name)
            """,
            (slug, name),
        )

    conn.commit()

    # Recuperar ids
    cursor.execute(
        "SELECT id, name FROM master_categories WHERE name IN ({})".format(
            ", ".join(["%s"] * len(categoria_list))
        ),
        categoria_list,
    )
    name_to_id: Dict[str, int] = {}
    for cat_id, name in cursor.fetchall():
        name_to_id[name] = cat_id

    cursor.close()
    return name_to_id


def iter_provider_mappings(diccionarios: Dict[str, Any]) -> Iterable[Tuple[str, str, str]]:
    """Itera (provider_code, provider_category_key, master_category_name)."""
    for provider_code, mapping in diccionarios.items():
        # Por ahora, salteamos 'air' según decisión actual.
        if provider_code == "air":
            continue
        if not isinstance(mapping, dict):
            continue
        for provider_key, master_name in mapping.items():
            if not isinstance(master_name, str):
                continue
            yield provider_code, provider_key, master_name.strip()


def import_mappings(conn: MySQLConnection, diccionarios: Dict[str, Any]):
    """Importa mapeos a provider_category_mappings."""
    all_mappings = list(iter_provider_mappings(diccionarios))
    all_master_names = {m[2] for m in all_mappings}

    # 1) Asegurar proveedores
    provider_code_to_id = ensure_providers(conn, diccionarios)

    # 2) Asegurar categorías maestras
    master_name_to_id = ensure_master_categories(conn, all_master_names)

    # 3) Insertar mapeos
    cursor = conn.cursor()
    for provider_code, provider_key, master_name in all_mappings:
        provider_id = provider_code_to_id.get(provider_code)
        master_id = master_name_to_id.get(master_name)
        if provider_id is None or master_id is None:
            continue
        cursor.execute(
            """
            INSERT INTO provider_category_mappings (provider_id, provider_category_key, master_category_id)
            VALUES (%s, %s, %s)
            ON DUPLICATE KEY UPDATE master_category_id = VALUES(master_category_id)
            """,
            (provider_id, provider_key, master_id),
        )

    conn.commit()
    cursor.close()


def main():
    diccionarios = load_json(DICCIONARIOS_PATH)

    conn = get_db_connection()
    try:
        import_mappings(conn, diccionarios)
        print("Importación de categorías completada correctamente.")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
