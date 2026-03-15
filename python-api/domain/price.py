"""
Cálculo de precio final con IVA.
Responsabilidad única: fórmula de precio.
"""


def calcular_precio(precio, iva=0):
    """Calcula precio final aplicando IVA (porcentaje)."""
    precio = float(str(precio).replace(",", ".")) if isinstance(precio, str) else float(precio)
    iva = float(str(iva).replace(",", ".")) if isinstance(iva, str) else float(iva)
    return round(float(precio) * (1 + float(iva) / 100))
