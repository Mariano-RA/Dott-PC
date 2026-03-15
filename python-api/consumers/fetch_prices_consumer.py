"""
Consumer que escucha RABBITMQ_FETCH_PRICES_QUEUE: al recibir { "proveedor": "nb" } (o null para todos),
ejecuta el fetcher, descarga el listado y publica en RABBITMQ_PYTHON_QUEUE (base64) para que el
consumer de listas lo procese, o directamente carga_tabla si el fetcher devuelve lista de productos.
"""
import base64
import json
import logging
import time

import pika

from config.settings import (
    RABBIT_URL,
    RABBIT_PYTHON_QUEUE,
    RABBIT_FETCH_PRICES_QUEUE,
    RABBIT_RETRY_DELAY,
    setup_logging,
)
from fetchers import get_fetcher, list_proveedores
from messaging import publish_carga_tabla

logger = logging.getLogger(__name__)


def _conn():
    return pika.BlockingConnection(pika.URLParameters(RABBIT_URL))


def publish_to_python_queue(proveedor: str, file_bytes: bytes) -> None:
    payload = {
        "data": {
            "nombreProveedor": proveedor,
            "base64": base64.b64encode(file_bytes).decode("ascii"),
        }
    }
    body = json.dumps(payload)
    with _conn() as conn:
        ch = conn.channel()
        ch.queue_declare(queue=RABBIT_PYTHON_QUEUE, durable=True)
        ch.basic_publish(exchange="", routing_key=RABBIT_PYTHON_QUEUE, body=body)
    logger.info("Enviado listado de %s a la cola de procesamiento.", proveedor)


def run_fetch(proveedor: str) -> bool:
    logger.info("Procesando proveedor: %s", proveedor)
    t0 = time.perf_counter()
    fetcher = get_fetcher(proveedor)
    if not fetcher:
        logger.warning("No hay fetcher para proveedor: %s", proveedor)
        return False
    try:
        data = fetcher()
    except Exception as e:
        logger.exception("Error en fetcher de %s: %s", proveedor, e)
        return False
    duration_s = round(time.perf_counter() - t0, 2)
    if not data:
        logger.warning(
            "Fetcher de %s no devolvió datos (duración: %ss).",
            proveedor,
            duration_s,
        )
        return False
    if isinstance(data, list) and len(data) > 0 and isinstance(data[0], dict):
        logger.info(
            "Proveedor %s: %d productos en %ss → enviando carga_tabla.",
            proveedor,
            len(data),
            duration_s,
        )
        publish_carga_tabla(proveedor, data)
    elif isinstance(data, bytes):
        size_kb = round(len(data) / 1024, 1)
        logger.info(
            "Proveedor %s: %s KB en %ss → enviando a cola de procesamiento.",
            proveedor,
            size_kb,
            duration_s,
        )
        publish_to_python_queue(proveedor, data)
    else:
        logger.warning(
            "Fetcher de %s devolvió tipo no soportado (duración: %ss).",
            proveedor,
            duration_s,
        )
        return False
    return True


def on_message(ch, method, properties, body):
    try:
        msg = json.loads(body.decode("utf-8"))
        data = msg.get("data", msg)
        proveedor = (
            data.get("proveedor") if isinstance(data, dict) else msg.get("proveedor")
        )
        logger.info(
            "Mensaje recibido en cola %s: proveedor=%s",
            RABBIT_FETCH_PRICES_QUEUE,
            proveedor if (proveedor and str(proveedor).strip()) else "todos",
        )
        if proveedor is None or proveedor == "":
            proveedores = list_proveedores()
            logger.info("Descarga para todos los proveedores: %s", proveedores)
            ok = sum(1 for p in proveedores if run_fetch(p))
            logger.info("Descarga completada: %d/%d proveedores ok.", ok, len(proveedores))
        else:
            p = str(proveedor).strip().lower()
            if run_fetch(p):
                logger.info("Descarga de %s completada correctamente.", p)
            else:
                logger.warning("Descarga de %s falló o no devolvió datos.", p)
    except (json.JSONDecodeError, TypeError) as e:
        logger.exception("Mensaje inválido: %s", e)
    except Exception as e:
        logger.exception("Error procesando mensaje: %s", e)
    ch.basic_ack(delivery_tag=method.delivery_tag)


def run_consumer():
    setup_logging()
    while True:
        try:
            with _conn() as conn:
                ch = conn.channel()
                ch.queue_declare(queue=RABBIT_FETCH_PRICES_QUEUE, durable=True)
                ch.basic_consume(
                    queue=RABBIT_FETCH_PRICES_QUEUE,
                    on_message_callback=on_message,
                    auto_ack=False,
                )
                logger.info(
                    "Consumidor de descarga de listados activo (cola: %s).",
                    RABBIT_FETCH_PRICES_QUEUE,
                )
                ch.start_consuming()
        except KeyboardInterrupt:
            logger.info("Detenido por el usuario.")
            break
        except Exception as e:
            logger.exception(
                "Error de conexión: %s. Reintentando en %ss.", e, RABBIT_RETRY_DELAY
            )
            time.sleep(RABBIT_RETRY_DELAY)
