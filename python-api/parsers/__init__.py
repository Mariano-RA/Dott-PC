"""
Registro de parsers por proveedor (Open/Closed: agregar proveedor = nuevo módulo + registro).
Cada parser expone parse(archivo_bytesio) -> list[dict].
"""
import logging
from typing import Any, Callable, Dict, List, Optional, Tuple

from . import air

logger = logging.getLogger(__name__)
from . import eikon
from . import elit
from . import hdc
from . import invid
from . import mega
from . import nb

# Tipo: recibe stream, devuelve lista de registros estándar
ParserFunc = Callable[[Any], List[dict]]

PROVEEDORES_PARSERS: Dict[str, ParserFunc] = {
    "air": air.parse,
    "eikon": eikon.parse,
    "elit": elit.parse,
    "hdc": hdc.parse,
    "invid": invid.parse,
    "nb": nb.parse,
    "mega": mega.parse,
}


def get_parser(nombre_proveedor: str) -> Optional[ParserFunc]:
    """Devuelve el parser para el proveedor o None si no está soportado."""
    nombre = (nombre_proveedor or "").strip().lower()
    parser = PROVEEDORES_PARSERS.get(nombre)
    if parser is None:
        logger.warning("Proveedor sin parser registrado: %r", nombre_proveedor)
    return parser


def extraer_payload(mensaje: Dict[str, Any]) -> Tuple[str, str]:
    """Extrae (nombre_proveedor, contenido_base64) del mensaje RabbitMQ. Lanza ValueError si es inválido."""
    data = mensaje.get("data")
    if not isinstance(data, dict):
        raise ValueError("Payload invalido: falta objeto 'data'")
    proveedor = data.get("nombreProveedor")
    contenido_base64 = data.get("base64")
    if not proveedor or not isinstance(proveedor, str):
        raise ValueError("Payload invalido: 'nombreProveedor' es requerido")
    if not contenido_base64 or not isinstance(contenido_base64, str):
        raise ValueError("Payload invalido: 'base64' es requerido")
    return proveedor.strip().lower(), contenido_base64


__all__ = [
    "get_parser",
    "extraer_payload",
    "PROVEEDORES_PARSERS",
]
