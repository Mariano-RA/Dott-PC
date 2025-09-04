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

# python-api/Dockerfile
# Usamos Python 3.9 por compat con pandas==1.3.3 / openpyxl==3.0.9
FROM python:3.9-slim AS base
WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
      build-essential \
    && rm -rf /var/lib/apt/lists/*

# Cache fuerte: primero requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Código
COPY . .

# Permisos: evitá 777; dejé 755
RUN mkdir -p /app/nuevosScripts/diccionarios && \
    chmod -R 755 /app/nuevosScripts/diccionarios

# Usuario no-root
RUN useradd -m appuser
USER appuser

EXPOSE 5000
# Si es web, considerá gunicorn. Por ahora respetamos lo tuyo:
CMD ["python", "dottDB.py"]
