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

FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Crear usuario no-root
RUN groupadd -g 10001 app && useradd -m -u 10001 -g 10001 -s /usr/sbin/nologin app

# (Opcional) libstdc++/gomp por si alguna wheel las usa
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates libstdc++6 libgomp1 \
  && rm -rf /var/lib/apt/lists/*

# Instalar deps primero (cache)
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copiar código
COPY --chown=app:app . .

# Si tu app necesita esos archivos para escritura/lectura:
RUN mkdir -p /app/nuevosScripts/diccionarios \
 && chown -R app:app /app/nuevosScripts \
 && chmod -R 775 /app/nuevosScripts

USER app

EXPOSE 5000
CMD ["python", "dottDB.py"]