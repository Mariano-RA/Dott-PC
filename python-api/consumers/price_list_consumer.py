"""
Consumer que escucha RABBITMQ_PYTHON_QUEUE: recibe listados en base64, parsea con el parser
del proveedor y publica resultado (carga_tabla) al backend.
"""
import base64
import io
import json
import logging
import time

import pika

from config.settings import (
    RABBIT_URL,
    RABBIT_PYTHON_QUEUE,
    RABBIT_RETRY_DELAY,
    setup_logging,
)
from messaging import publish_carga_tabla
from parsers import get_parser, extraer_payload

logger = logging.getLogger(__name__)


def procesar_proveedor(nombre_proveedor: str, archivo_base64: str) -> bool:
    """Decodifica, parsea y envía resultado al backend. Devuelve True si OK."""
    try:
        file_data = base64.b64decode(archivo_base64)
        archivo_bytesio = io.BytesIO(file_data)
        parser = get_parser(nombre_proveedor)
        if not parser:
            raise ValueError(f"Proveedor no soportado: {nombre_proveedor}")
        data = parser(archivo_bytesio)
        publish_carga_tabla(nombre_proveedor, data)
        return True
    except Exception as ex:
        logger.exception("Error en %s: %s", nombre_proveedor, ex)
        return False


def callback(ch, method, properties, body):
    try:
        mensaje = json.loads(body.decode("utf-8"))
        proveedor, archivo_base64 = extraer_payload(mensaje)
        logger.info("Recibido mensaje para proveedor %s", proveedor)
        process_ok = procesar_proveedor(proveedor, archivo_base64)
        if process_ok:
            ch.basic_ack(delivery_tag=method.delivery_tag)
        else:
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
    except (json.JSONDecodeError, ValueError, TypeError) as e:
        logger.exception("Mensaje invalido o incompleto: %s", e, exc_info=True)
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
    except Exception as e:
        logger.exception("Error inesperado en callback: %s", e, exc_info=True)
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)


def run_consumer_with_retry():
    """Loop principal: conecta a RabbitMQ y consume hasta interrupción o error no recuperable."""
    setup_logging()
    import sys

    csv_field_size = getattr(sys, "maxsize", 2**31 - 1)
    try:
        import csv as csv_module

        csv_module.field_size_limit(csv_field_size)
    except Exception:
        pass

    while True:
        try:
            with pika.BlockingConnection(pika.URLParameters(RABBIT_URL)) as connection:
                channel = connection.channel()
                channel.queue_declare(queue=RABBIT_PYTHON_QUEUE, durable=True)
                channel.basic_consume(
                    queue=RABBIT_PYTHON_QUEUE,
                    on_message_callback=callback,
                    auto_ack=False,
                )
                logger.info("Iniciando ejecución del consumidor...")
                channel.start_consuming()
        except KeyboardInterrupt:
            logger.info("Ejecución detenida por el usuario.")
            break
        except Exception as e:
            logger.exception(
                "No se pudo conectar/consumir RabbitMQ: %s. Reintentando en %ss",
                e,
                RABBIT_RETRY_DELAY,
                exc_info=True,
            )
            time.sleep(RABBIT_RETRY_DELAY)
