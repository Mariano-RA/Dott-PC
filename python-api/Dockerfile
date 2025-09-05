# # Utiliza una imagen base de Python
# FROM python:3.8-slim
# # Establece el directorio de trabajo dentro del contenedor
# WORKDIR /app
# # Copia el archivo de requisitos e instala las dependencias
# COPY /requirements.txt requirements.txt
# # RUN pip install -r requeriments.txt
# RUN pip install -r requirements.txt && \
#     rm -rf /root/.cache && \
#     apt-get clean && \
#     rm -rf /var/lib/apt/lists/* && \
#     rm -rf /tmp/*
# # Copia el código de la aplicación a la imagen
# COPY . .
# RUN chmod -R 777 /app/nuevosScripts/diccionarios
# # Expone el puerto en el que la API estará escuchando
# EXPOSE 5000
# CMD ["python", "dottDB.py"]

# syntax=docker/dockerfile:1.7
FROM python:3.11-slim

# Evita archivos pyc y buffers
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Paquetes base mínimos y utilidades de adduser/addgroup (shadow/ passwd)
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates tzdata passwd \
 && rm -rf /var/lib/apt/lists/*

# Crear usuario no root (usar addgroup/adduser que existen en Debian)
RUN addgroup --gid 10001 app \
 && adduser  --uid 10001 --gid 10001 --disabled-login --gecos "" app

# Instalar deps primero (aprovecha cache de capas)
COPY requirements.txt /app/requirements.txt
RUN pip install -r requirements.txt

# Copiar código con dueño correcto (requiere BuildKit, lo forzamos en CI)
COPY --chown=app:app . .

# Crear carpeta y permisos (por si tu app escribe allí)
RUN mkdir -p /app/nuevosScripts/diccionarios \
 && chown -R app:app /app/nuevosScripts \
 && chmod -R 775 /app/nuevosScripts

USER app

EXPOSE 5000
CMD ["python", "dottDB.py"]