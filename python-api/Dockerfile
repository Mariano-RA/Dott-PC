# Imagen base ligera (musl)
FROM python:3.11-alpine

# Ajustes de runtime
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# Directorio de trabajo
WORKDIR /app

# (Opcional) toolchain si algún wheel necesita compilar en el futuro
# RUN apk add --no-cache build-base linux-headers libffi-dev openssl-dev

# Copiá primero requirements para aprovechar cache de capas
COPY requirements.txt .

# Instalar dependencias de Python sin cache
RUN pip install -r requirements.txt

# Copiar el resto del código
COPY . .

# Permisos razonables (evitá 777)
RUN chmod -R 755 /app/nuevosScripts/diccionarios || true

# Usuario no-root
RUN addgroup -S app && adduser -S app -G app && chown -R app:app /app
USER app

# Puerto de la API
EXPOSE 5000

# Comando (ajustá si usás gunicorn)
CMD ["python", "dottDB.py"]
