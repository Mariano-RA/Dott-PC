"""
Consumers de RabbitMQ: procesamiento de listas de precios y descarga (fetch).
"""
from .price_list_consumer import run_consumer_with_retry

__all__ = ["run_consumer_with_retry"]
