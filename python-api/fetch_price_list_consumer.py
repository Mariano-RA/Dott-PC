"""
Consumer que escucha RABBITMQ_FETCH_PRICES_QUEUE.
Al recibir { "proveedor": "nb" } (o null para todos), ejecuta el fetcher,
descarga el listado y publica en RABBITMQ_PYTHON_QUEUE (base64) para que dottDB lo procese.
Si el fetcher devuelve una lista de productos (ej. API JSON), publica en la cola del backend (carga_tabla).
"""
import base64
import json
import logging
import os
import time

import pika

from fetchers import get_fetcher, list_proveedores

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler()],
)
logger = logging.getLogger(__name__)

_raw = os.environ.get("RABBITMQ_URL", "amqp://guest:guest@localhost:5672")
if "://" in _raw:
    RABBIT_URL = _raw
else:
    RABBIT_URL = f"amqp://guest:guest@{_raw}:5672/"

FETCH_PRICES_QUEUE = os.environ.get("RABBITMQ_FETCH_PRICES_QUEUE", "fetch_prices")
PYTHON_QUEUE = os.environ.get("RABBITMQ_PYTHON_QUEUE", "PYTHON_QUEUE")
BACKEND_QUEUE = os.environ.get("RABBITMQ_QUEUE", "RABBIT_MR_DOTT_QUEUE")
RETRY_DELAY = int(os.environ.get("RABBITMQ_RETRY_DELAY", "5"))


def _conn():
    return pika.BlockingConnection(pika.URLParameters(RABBIT_URL))


def publish_to_backend_queue(proveedor: str, product_list: list) -> None:
    payload = {
        "pattern": "carga_tabla",
        "data": {
            "proveedor_actualizado": proveedor,
            "resultado": product_list,
        },
    }
    body = json.dumps(payload)
    with _conn() as conn:
        ch = conn.channel()
        ch.queue_declare(queue=BACKEND_QUEUE, durable=True)
        ch.basic_publish(exchange="", routing_key=BACKEND_QUEUE, body=body)
    logger.info("Enviados %d productos de %s al backend (carga_tabla).", len(product_list), proveedor)


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
        ch.queue_declare(queue=PYTHON_QUEUE, durable=True)
        ch.basic_publish(exchange="", routing_key=PYTHON_QUEUE, body=body)
    logger.info("Enviado listado de %s a la cola de procesamiento.", proveedor)


def run_fetch(proveedor: str) -> bool:
    fetcher = get_fetcher(proveedor)
    if not fetcher:
        logger.warning("No hay fetcher para proveedor: %s", proveedor)
        return False
    data = fetcher()
    if not data:
        logger.warning("Fetcher de %s no devolvió datos.", proveedor)
        return False
    if isinstance(data, list) and len(data) > 0 and isinstance(data[0], dict):
        publish_to_backend_queue(proveedor, data)
    elif isinstance(data, bytes):
        publish_to_python_queue(proveedor, data)
    else:
        logger.warning("Fetcher de %s devolvió tipo no soportado.", proveedor)
        return False
    return True


def on_message(ch, method, properties, body):
    try:
        msg = json.loads(body.decode("utf-8"))
        data = msg.get("data", msg)
        proveedor = data.get("proveedor") if isinstance(data, dict) else msg.get("proveedor")
        if proveedor is None or proveedor == "":
            for p in list_proveedores():
                run_fetch(p)
        else:
            run_fetch(str(proveedor).strip().lower())
    except (json.JSONDecodeError, TypeError) as e:
        logger.exception("Mensaje inválido: %s", e)
    except Exception as e:
        logger.exception("Error procesando mensaje: %s", e)
    ch.basic_ack(delivery_tag=method.delivery_tag)


def run_consumer():
    while True:
        try:
            with _conn() as conn:
                ch = conn.channel()
                ch.queue_declare(queue=FETCH_PRICES_QUEUE, durable=True)
                ch.basic_consume(queue=FETCH_PRICES_QUEUE, on_message_callback=on_message, auto_ack=False)
                logger.info("Consumidor de descarga de listados activo (cola: %s).", FETCH_PRICES_QUEUE)
                ch.start_consuming()
        except KeyboardInterrupt:
            logger.info("Detenido por el usuario.")
            break
        except Exception as e:
            logger.exception("Error de conexión: %s. Reintentando en %ss.", e, RETRY_DELAY)
            time.sleep(RETRY_DELAY)


if __name__ == "__main__":
    run_consumer()
