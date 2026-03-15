"""
Entrypoint del consumer de descarga de listados (cola RABBITMQ_FETCH_PRICES_QUEUE).
Uso: python fetch_price_list_consumer.py
"""
from consumers.fetch_prices_consumer import run_consumer

if __name__ == "__main__":
    run_consumer()
