"""
Registro de fetchers por proveedor.
"""
import logging
from typing import Callable, Optional

from . import fetch_air
from . import fetch_elit
from . import fetch_generic
from . import fetch_invid
from . import fetch_mega
from . import fetch_nb

logger = logging.getLogger(__name__)

# Proveedores incluidos en "descargar todos" (fallback si Nest no envía lista).
# Nest filtra por Proveedores.activo ∩ PROVEEDORES_CON_FETCHER al disparar "Todos".
# HDC y EIKON se cargan solo manualmente.
PROVEEDORES_DESCARGA_AUTOMATICA = ("air", "elit", "invid", "mega", "nb")

_FETCHERS = {
    "air": fetch_air.fetch_air,
    "elit": fetch_elit.fetch_elit,
    "hdc": lambda: fetch_generic.fetch_by_name("hdc"),
    "invid": fetch_invid.fetch_invid,
    "mega": fetch_mega.fetch_mega,
    "nb": fetch_nb.fetch_nb,
}


def get_fetcher(proveedor: str) -> Optional[Callable[[], Optional[bytes]]]:
    nombre = (proveedor or "").strip().lower()
    return _FETCHERS.get(nombre)


def list_proveedores():
    """Lista de proveedores para descarga múltiple / automática."""
    return list(PROVEEDORES_DESCARGA_AUTOMATICA)
