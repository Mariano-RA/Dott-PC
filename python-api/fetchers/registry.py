"""
Registro de fetchers por proveedor.
"""
import logging
from typing import Callable, Optional

from . import fetch_elit
from . import fetch_generic
from . import fetch_invid
from . import fetch_mega
from . import fetch_nb

logger = logging.getLogger(__name__)

PROVEEDORES_SOPORTADOS = ("air", "elit", "hdc", "invid", "nb", "mega")

_FETCHERS = {
    "air": lambda: fetch_generic.fetch_by_name("air"),
    "elit": fetch_elit.fetch_elit,
    "hdc": lambda: fetch_generic.fetch_by_name("hdc"),
    "invid": fetch_invid.fetch_invid,
    "nb": fetch_nb.fetch_nb,
    "mega": fetch_mega.fetch_mega,
}


def get_fetcher(proveedor: str) -> Optional[Callable[[], Optional[bytes]]]:
    nombre = (proveedor or "").strip().lower()
    return _FETCHERS.get(nombre)


def list_proveedores():
    return list(_FETCHERS.keys())
