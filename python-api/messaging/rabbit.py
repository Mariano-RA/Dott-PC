"""
Publicación de resultados al backend vía RabbitMQ.
Usado por el consumer de listas (parsers) y por el consumer de fetch (fetchers).

Cada ítem de product_list debe incluir: proveedor, producto, precio, categoriaRaw.
- categoriaRaw: categoría tal como viene del proveedor. El backend resuelve con el maestro
  (DB) y decide si es nueva o mapeada; no se usan archivos JSON en este flujo.
- categoria: mismo valor que categoriaRaw (compatibilidad con el backend).
"""
import json
import logging
from typing import Any, List

import pika

from config.settings import RABBIT_URL, RABBIT_QUEUE

logger = logging.getLogger(__name__)


def build_carga_tabla_message(proveedor: str, product_list: List[dict]) -> dict:
    """Construye el payload estándar para el patrón carga_tabla.
    Cada elemento de product_list debe tener al menos: proveedor, producto, categoriaRaw, categoria, precio.
    """
    return {
        "pattern": "carga_tabla",
        "data": {
            "proveedor_actualizado": proveedor,
            "resultado": product_list,
        },
    }


def publish_carga_tabla(proveedor: str, product_list: List[Any]) -> None:
    """
    Publica el resultado de carga_tabla a la cola del backend.
    No publica si la lista está vacía.
    """
    if not product_list:
        logger.warning(
            "No se publica carga_tabla para %s: lista de productos vacía.",
            proveedor,
        )
        return
    payload = build_carga_tabla_message(proveedor, product_list)
    body = json.dumps(payload)
    try:
        with pika.BlockingConnection(pika.URLParameters(RABBIT_URL)) as conn:
            ch = conn.channel()
            ch.queue_declare(queue=RABBIT_QUEUE, durable=True)
            ch.basic_publish(exchange="", routing_key=RABBIT_QUEUE, body=body)
        logger.info(
            "Enviados %d productos de %s al backend (carga_tabla).",
            len(product_list),
            proveedor,
        )
    except Exception as ex:
        logger.exception("Error publicando carga_tabla para %s: %s", proveedor, ex)
        raise
