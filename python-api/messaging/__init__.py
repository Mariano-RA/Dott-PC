"""
Mensajería con el backend (RabbitMQ): construcción y publicación de carga_tabla.
"""
from .rabbit import build_carga_tabla_message, publish_carga_tabla

__all__ = ["build_carga_tabla_message", "publish_carga_tabla"]
