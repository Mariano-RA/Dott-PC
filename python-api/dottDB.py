"""
Entrypoint del consumer de listas de precios (cola RABBITMQ_PYTHON_QUEUE).
Mantiene compatibilidad con el CMD del Dockerfile: python dottDB.py
"""
from consumers.price_list_consumer import run_consumer_with_retry

if __name__ == "__main__":
    run_consumer_with_retry()
