"""
Lógica de negocio: precios. Las categorías se resuelven en el backend (MySQL).
"""
from .price import calcular_precio

__all__ = ["calcular_precio"]
