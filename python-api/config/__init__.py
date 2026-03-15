"""
Configuración centralizada: entorno, RabbitMQ, logging y rutas.
"""
from .settings import (
    RABBIT_URL,
    RABBIT_QUEUE,
    RABBIT_PYTHON_QUEUE,
    RABBIT_FETCH_PRICES_QUEUE,
    RABBIT_RETRY_DELAY,
    CATEGORIES_DATA_DIR,
    LOG_DIR,
    setup_logging,
)

__all__ = [
    "RABBIT_URL",
    "RABBIT_QUEUE",
    "RABBIT_PYTHON_QUEUE",
    "RABBIT_FETCH_PRICES_QUEUE",
    "RABBIT_RETRY_DELAY",
    "CATEGORIES_DATA_DIR",
    "LOG_DIR",
    "setup_logging",
]
