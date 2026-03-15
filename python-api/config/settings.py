"""
Configuración desde variables de entorno y rutas de datos.
Principio: una única fuente de verdad para configuración.
"""
import logging
import os
from pathlib import Path

logger = logging.getLogger(__name__)


def _rabbit_url() -> str:
    raw = os.environ.get("RABBITMQ_URL", "amqp://guest:guest@localhost:5672")
    if raw and "://" in raw:
        return raw
    return f"amqp://guest:guest@{raw or 'localhost'}:5672/"


RABBIT_URL = _rabbit_url()
RABBIT_QUEUE = os.environ.get("RABBITMQ_QUEUE", "RABBIT_MR_DOTT_QUEUE")
RABBIT_PYTHON_QUEUE = os.environ.get("RABBITMQ_PYTHON_QUEUE", "PYTHON_QUEUE")
RABBIT_FETCH_PRICES_QUEUE = os.environ.get("RABBITMQ_FETCH_PRICES_QUEUE", "fetch_prices")
RABBIT_RETRY_DELAY = int(os.environ.get("RABBITMQ_RETRY_DELAY", "5"))

# Directorio base del proyecto (donde está python-api)
_BASE_DIR = Path(__file__).resolve().parent.parent
# Diccionarios de categorías: data/categories (solo diccionarios.json para carga inicial)
CATEGORIES_DATA_DIR = Path(os.environ.get("DOTT_CATEGORIES_DIR", str(_BASE_DIR / "data" / "categories")))
LOG_DIR = Path(os.environ.get("DOTT_LOG_DIR", str(_BASE_DIR / "logs")))


def setup_logging() -> None:
    """Configura logging a archivo y consola. Idempotente."""
    import logging

    if logging.getLogger().handlers:
        return
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    log_file = LOG_DIR / "app.log"
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=[
            logging.FileHandler(log_file, encoding="utf-8"),
            logging.StreamHandler(),
        ],
    )
    logging.getLogger("xlrd").setLevel(logging.WARNING)
    logging.info("Logging configurado: nivel INFO, archivo %s", log_file)
