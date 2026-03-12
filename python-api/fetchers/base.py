"""
Utilidades para fetchers: credenciales desde env.
"""
import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)


def _env(key: str, default: Optional[str] = None) -> Optional[str]:
    v = os.environ.get(key)
    return v.strip() if v else default


def get_supplier_env(proveedor: str, key: str) -> Optional[str]:
    """Obtiene variable de entorno: SUPPLIER_<PROVEEDOR>_<KEY>."""
    name = proveedor.upper().replace("-", "_")
    return _env(f"SUPPLIER_{name}_{key}")


def get_supplier_credentials(proveedor: str) -> dict:
    """Devuelve url, user, password, api_key, token, user_id desde env."""
    creds = {
        "url": get_supplier_env(proveedor, "URL"),
        "user": get_supplier_env(proveedor, "USER"),
        "password": get_supplier_env(proveedor, "PASSWORD"),
        "api_key": get_supplier_env(proveedor, "API_KEY"),
    }
    uid = get_supplier_env(proveedor, "USER_ID")
    if uid is not None:
        creds["user_id"] = uid
    token = get_supplier_env(proveedor, "TOKEN") or creds.get("api_key")
    if token is not None:
        creds["token"] = token
    return creds
